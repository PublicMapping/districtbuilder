data "aws_canonical_user_id" "current" {}

resource "aws_s3_bucket" "logs" {
  bucket = "${lower(var.project)}-${lower(var.environment)}-logs-${var.aws_region}"

  grant {
    type        = "CanonicalUser"
    permissions = ["FULL_CONTROL"]
    id          = data.aws_canonical_user_id.current.id
  }

  grant {
    type        = "CanonicalUser"
    permissions = ["FULL_CONTROL"]
    id          = var.aws_cloudfront_canonical_user_id
  }

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
