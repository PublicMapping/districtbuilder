#
# Bastion security group resources
#
resource "aws_security_group_rule" "bastion_ssh_ingress" {
  type        = "ingress"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = [var.external_access_cidr_block]

  security_group_id = module.vpc.bastion_security_group_id
}
