provider "aws" {
  region  = var.aws_region
  version = "~> 2.55.0"
}

terraform {
  backend "s3" {
    region  = "us-east-1"
    encrypt = "true"
  }
}
