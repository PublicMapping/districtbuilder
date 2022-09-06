## Configuring PG Admin

### Requirements

- [PG Admin](https://www.pgadmin.org/)
- AWS credentials
- AWS CLI with [Session Manager Plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html) installed

The configuration file is written referring to the staging database; however, the same process applies to the production database. Just follow the same instructions, replacing the word "staging" with "production" or Staging with Production.


### Connecting
1. export AWS_PROFILE=district-builder

2. Find an ec2 instance id like i-0e2796c2ebbfbb048 (not the bastion) either via the console or a command like 

```
aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,Tags]" --filters "Name=tag:Environment,Values=Staging"
```

3. Then enable port 5432 locally to be connected to the database on the same port. Either replace $INSTANCE_ID with the new ID or set the shell variable. Note: [Windows has slightly different syntax](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html#sessions-remote-port-forwarding).

```
INSTANCE_ID=
aws ssm start-session     --target $INSTANCE_ID     --document-name AWS-StartPortForwardingSessionToRemoteHost     --parameters '{"host":["database.service.districtbuilder.internal"],"portNumber":["5432"], "localPortNumber":["5432"]}'
```

4. Connect to PGAdmin with the host set as localhost. Note: There is a 20 minute timeout if no connection is established, so you may have to rerun the command when first setting up PGAdmin.

5. Announce that you are making DB changes if they are going to be long running as other actions could cause the instance to be recycled.

6. Make the actual DB changes

7. When done, close or disconnect from PGAdmin first, then Ctrl-C the aws ssm command.

### Configure PGAdmin

To begin, right click "Servers" &#8594; "Create" &#8594; "Server". In the dialog that appears, complete the following:


**General Tab**

_Name_<br>
Give your new server a name. The name can be whatever you choose; however, remember that you need to be able to distinguish between production and staging.


**Connection Tab**

_Host Name_ localhost

_Username, Password and Database Name_<br>
Return to the AWS management console &#8594; All Services &#8594; S3 &#8594; districtbuilder-staging-config-us-east-1 &#8594; Terraform &#8594; download `terraform.tfvars`. Open the `tfvars` file (it can be opened by a text editor) and find `rds_database_username` and `rds_database_password`.

---

Click save on the Database Configuration dialog. If you've successfully connected, you'll see metrics appear on your database dashboard.

If you need to troubleshoot you can always do ```aws ssm start-session     --target $INSTANCE_ID``` will give you a shell on the ec2 instance. You can also press Connect on the instance in the console.