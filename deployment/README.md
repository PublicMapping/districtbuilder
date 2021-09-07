# Deployment

- [AWS Credentials](#aws-credentials)
- [Publish Container Images](#publish-container-images)
- [Terraform](#terraform)
- [Migrations](#migrations)
- [Restart services](#restart-services)

**Note** when deploying a production release create a new issue using the [release issue template](../.github/ISSUE_TEMPLATE/release.md) and follow the checklist.

## AWS Credentials

Using the AWS CLI, create an AWS profile named `district-builder`:

```bash
$ aws configure --profile district-builder
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]:
```

You will be prompted to enter your AWS credentials, along with a default region. These credentials will be used to authenticate calls to the AWS API when using Terraform and the AWS CLI.

## Publish Container Images

Before we can deploy this project's core infrastructure, we will need to build a container image and publish it somewhere accessible to Amazon's services.

AWS Elastic Container Registry (ECR) is a good candidate because ECR authentication with AWS Elastic Container Service (ECS) is handled transparently.

To do this, we can use the `cibuild` and `cipublish` scripts:

```bash
$ export DB_AWS_ECR_ENDPOINT=123456789012.dkr.ecr.us-east-1.amazonaws.com
$ ./scripts/cibuild
...
Successfully built 20dcf93f6907
Successfully tagged districtbuilder:a476b78
$ ./scripts/cipublish
...
```

## Terraform

First, we need to make sure there is a `terraform.tfvars` file in the project settings bucket on S3. The `.tfvars` file is where we can change specific attributes of the project's infrastructure, not defined in the `variables.tf` file.

Here is an example `terraform.tfvars` for this project:

```hcl
project     = "DistrictBuilder"
environment = "Staging"
aws_region  = "us-east-1"

aws_key_name = "districtbuilder-stg"

r53_private_hosted_zone = "districtbuilder.internal"

external_access_cidr_block = "127.0.0.1/32"

bastion_ami           = "ami-0fc61db8544a617ed"
bastion_instance_type = "t3.nano"
bastion_ebs_optimized = true

rds_database_identifier = districtbuilder-staging
rds_database_name       = districtbuilder
rds_database_username   = districtbuilder
rds_database_password   = districtbuilder
```

This file lives at `s3://districtbuilder-staging-config-us-east-1/terraform/terraform.tfvars`.

To deploy this project's core infrastructure, use the `infra` wrapper script to lookup the remote state of the infrastructure and assemble a plan for work to be done:

```bash
$ docker-compose -f docker-compose.ci.yml run --rm terraform
$ ./scripts/infra plan
```

Once the plan has been assembled, and you agree with the changes, apply it:

```bash
$ ./scripts/infra apply
```

This will attempt to apply the plan assembled in the previous step using Amazon's APIs.

## Migrations

### Common

- Select the most recent task definition for [StagingApp](https://console.aws.amazon.com/ecs/home?region=us-east-1#/taskDefinitions/StagingApp/status/ACTIVE) or [ProductionApp](https://console.aws.amazon.com/ecs/home?region=us-east-1#/taskDefinitions/ProductionApp/status/ACTIVE)
- Select **Actions** -> **Run Task**
- Below the warning, click the blue link: "Switch to launch type"
- Select the following
  - **Launch type**: `Fargate`
  - **Cluster**: (See table below)
  - **Cluster VPC**: (See table below)
  - **Subnets**: Select any named `PrivateSubnet`
  - **Select existing security group**: (See table below)
  - **Auto-assign public IP**: `DISABLED`
- Expand **Advanced Options**
  - Expand `app` under **Container Overrides**
  - **Command override**: `run,migration:run`
- Click **Run Task**
- Monitor the log output ([staging](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/logStagingApp) or [production](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/logProductionApp)) for the newly created task

### Variables

| Environment | Cluster                | Cluster VPC             | Security Group         |
|-------------|------------------------|-------------------------|------------------------|
| Staging     | `ecsStagingCluster`    | `vpc-04d3fda63dfc36e58` | `sg-00b08b20f31addcc1` |
| Production  | `ecsProductionCluster` | `vpc-039833dc732e496a1` | `sg-05a0cca2a9f5b57a3` |

## Restart services

### Starting new tasks

After updating TopoJSON assets using the `update-region` command, updating data in S3 directly, or updating the `region_config` table in the staging / production database, you will need to restart the ECS services to refresh the cached TopoJSON assets.

Go to the [auto scaling group](https://console.aws.amazon.com/ec2autoscaling/home?region=us-east-1#/details) for the environment you are interested in. Click the Edit button for "Group Details" and set the desired group capacity to be equal to the maximum capacity.

Next, go to the [Staging](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ecsStagingCluster/services/StagingApp_EC2LaunchType/details) or [Production](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ecsProductionCluster/services/ProductionApp_EC2LaunchType/details) "EC2LaunchType" service and click "Update".

On the next screen, increase the "Number of tasks" to match the amount you set for the auto-scaling group, and leave everything else as-is.

It will take some time (approx. 20-25 mins) for the new tasks to finish loading all TopoJSON data. You can monitor the progress by looking for `HealthCheckService` logs in the [`logStagingApp` / `logProductionApp` Cloudwatch logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups) or by looking at the number of healthy hosts in the [appropriate target group](https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#TargetGroups:).

### Stopping old tasks

Once all the new tasks are healthy, you will need to stop the old tasks.
Go to the task list for [staging](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ecsStagingCluster/tasks) / [production](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ecsProductionCluster/tasks) and stop any tasks whose "Started At" date is from before increasing the auto scaling group / number of desired tasks (this should be half of the tasks shown).

Next, revert your changes to the [Staging](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ecsStagingCluster/services/StagingApp_EC2LaunchType/details) or [Production](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ecsProductionCluster/services/ProductionApp_EC2LaunchType/details) "EC2LaunchType" service to bring the desired number of tasks back down to the previous amount.

The auto-scaling group will automatically reduce in size over time until it is back at the minimum amount again - there is no need to revert the changes to it.

### Updating cache keys

After all of the old tasks have been stopped, you need to update the `region_config.version` column in the database for every region that was updated, in order to trigger updates to cached data for maps in those regions. If you didn't update any existing regions, only added new ones, you can skip this step.
