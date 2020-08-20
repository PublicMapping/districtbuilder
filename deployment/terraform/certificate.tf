#
# ACM resources
#
module "cert" {
  source = "github.com/azavea/terraform-aws-acm-certificate?ref=3.0.0"

  providers = {
    aws.acm_account     = aws
    aws.route53_account = aws
  }

  domain_name               = var.r53_public_hosted_zone
  subject_alternative_names = ["*.${var.r53_public_hosted_zone}"]
  hosted_zone_id            = aws_route53_zone.external.zone_id
  validation_record_ttl     = "60"
}
