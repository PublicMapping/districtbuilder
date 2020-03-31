#
# Private DNS resources
#
resource "aws_route53_zone" "internal" {
  name = var.r53_private_hosted_zone

  vpc {
    vpc_id     = module.vpc.id
    vpc_region = var.aws_region
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_route53_record" "database" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "database.service.${var.r53_private_hosted_zone}"
  type    = "CNAME"
  ttl     = "10"
  records = [module.database.hostname]
}
