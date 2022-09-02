## Configuring PG Admin

### Requirements

- [PG Admin](https://www.pgadmin.org/)
- AWS credentials

The configuration file is written referring to the staging database; however, the same process applies to the production database. Just follow the same instructions, replacing the word "staging" with "production" or Staging with Production.


### Connecting
1. Find an ec2 instance id like i-0e2796c2ebbfbb048 (not the bastion) either via the console or a command like 

```
aws ec2 describe-instances --query Reservations[*].Instances[*].[InstanceId,Tags] --filters "Name=tag:Environment,Values=Staging"
```

2. Then enable port 5432 locally to be connect to the database on the same port.

```
aws ssm start-session     --target i-0e2796c2ebbfbb048     --document-name AWS-StartPortForwardingSessionToRemoteHost     --parameters '{"host":["database.service.districtbuilder.internal"],"portNumber":["5432"], "localPortNumber":["5432"]}'
```

3. Connect to PGAdmin with the host set as localhost.

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

If you need to troubleshoot you can always do ```aws ssm start-session     --target i-0e2796c2ebbfbb048``` will give you a shell on the ec2 instance. You can also press Connect on the instance in the console.