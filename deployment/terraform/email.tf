#
# SES resources
#
resource "aws_ses_domain_identity" "app" {
  domain = var.r53_public_hosted_zone
}

resource "aws_ses_domain_dkim" "app" {
  domain = aws_ses_domain_identity.app.domain
}
