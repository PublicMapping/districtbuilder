# Deployment

- [AWS Credentials](#aws-credentials)
- [Publish Container Images](#publish-container-images)
- [Terraform](#terraform)
- [Migrations](#migrations)

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
