module "vpc" {
  source = "github.com/azavea/terraform-aws-vpc?ref=6.0.0"

  name                       = "vpc${replace(var.project, " ", "")}${var.environment}"
  region                     = var.aws_region
  key_name                   = var.aws_key_name
  cidr_block                 = var.vpc_cidr_block
  private_subnet_cidr_blocks = var.vpc_private_subnet_cidr_blocks
  public_subnet_cidr_blocks  = var.vpc_public_subnet_cidr_blocks
  availability_zones         = var.aws_availability_zones
  bastion_ami                = var.bastion_ami
  bastion_instance_type      = var.bastion_instance_type
  bastion_ebs_optimized      = var.bastion_ebs_optimized

  project     = var.project
  environment = var.environment
}
