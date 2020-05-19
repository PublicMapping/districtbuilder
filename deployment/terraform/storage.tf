resource "aws_s3_bucket" "logs" {
  bucket = "${lower(var.project)}-${lower(var.environment)}-logs-${var.aws_region}"
  acl    = "private"

  tags = {
    Name        = "${lower(var.project)}-${lower(var.environment)}-logs-${var.aws_region}"
    Project     = var.project
    Environment = var.environment
  }
}

module "ecr" {
  source = "github.com/azavea/terraform-aws-ecr-repository?ref=1.0.0"

  repository_name         = lower(var.project)
  attach_lifecycle_policy = true
}

module "ecr_cli" {
  source = "github.com/azavea/terraform-aws-ecr-repository?ref=1.0.0"

  repository_name         = "${lower(var.project)}-manage"
  attach_lifecycle_policy = true
}
