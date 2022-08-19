module "vpc" {
  source = "git::github.com/azavea/terraform-aws-vpc?ref=7.0.0"

  name                       = "vpc${var.project}${var.environment}"
  region                     = var.aws_region
  cidr_block                 = var.vpc_cidr_block
  private_subnet_cidr_blocks = var.vpc_private_subnet_cidr_blocks
  public_subnet_cidr_blocks  = var.vpc_public_subnet_cidr_blocks
  availability_zones         = var.aws_availability_zones
  
  project     = var.project
  environment = var.environment
}
