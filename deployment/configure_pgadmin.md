## Configuring PG Admin

### Requirements

- [PG Admin](https://www.pgadmin.org/)
- VPN Access
- AWS credentials

### Configuration

The configuration file is written referring to the staging database; however, the same process applies to the production database. Just follow the same instructions, replacing the word "staging" with "production".

To begin, right click "Servers" &#8594; "Create" &#8594; "Server". In the dialog that appears, complete the following:

**General Tab**

_Name_<br>
Give your new server a name. The name can be whatever you choose; however, remember that you need to be able to distinguish between production and staging.

**Connection Tab**

_Host Name_<br>
Locate the Host Name in AWS: All Services &#8594; RDS &#8594; Databases (in the left sidebar) &#8594; districtbuilder-staging &#8594; Connectivity & Security &#8594; Copy link under Endpoint.

_Username and Password_<br>
Return to the AWS management console &#8594; All Services &#8594; S3 &#8594; districtbuilder-staging-config-us-east-1 &#8594; Terraform &#8594; download `terraform.tfvars`. Open the `tfvars` file (it can be opened by a text editor) and find `rds_database_username` and `rds_database_password`.

**SSH Tunnel Tab**

Turn on "Use SSH Tunneling".

_Tunnel Host_<br>
Return to the AWS management console &#8594; All Services &#8594; EC2 &#8594; Instances (left sidebar) &#8594; select the Staging Bastion. Copy and paste the bastion's public IPv4 address as your tunnel host. Note: If you don't see environment name in your instance table, click on the gear icon to the right and add "environment" as a tag column.

_Username_<br>
Username is ec2-user.

_Authentication_<br>
Select "Identity File". To find this file, connect to the VPN and navigate to the following location on the fileshare: `fileshare.internal.azavea.com/company/documents_systems_admin/marriagez-rings/DistrictBuilder/AWS`. Note: on MacOS, the documents_systems_admin folder may be hidden. To show hidden files, press and hold Command + shift + dot.

From the fileshare location, save the `districtbuilder-stg.pem` file to somewhere PG Admin can be configured to find it, such as a `.ssh` folder in your project root. Then return to PG Admin and use the file browser popup to find it.

---

Click save on the Database Configuration dialog. If you've successfully connected, you'll see metrics appear on your database dashboard.
