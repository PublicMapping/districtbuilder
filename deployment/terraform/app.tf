#
# Security Group Resources
#
resource "aws_security_group" "app" {
  name   = "sg${var.environment}AppEcsService"
  vpc_id = module.vpc.id

  tags = {
    Name        = "sg${var.environment}AppEcsService",
    Project     = var.project
    Environment = var.environment
  }
}

#
# ECS Resources
#
resource "aws_ecs_cluster" "app" {
  name = "ecs${var.environment}Cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.environment}App"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fargate_app_cpu
  memory                   = var.fargate_app_memory

  task_role_arn      = aws_iam_role.ecs_task_role.arn
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = templatefile("${path.module}/task-definitions/app.json.tmpl", {
    image = "${module.ecr.repository_url}:${var.image_tag}"

    postgres_host     = aws_route53_record.database.name
    postgres_port     = module.database.port
    postgres_user     = var.rds_database_username
    postgres_password = var.rds_database_password
    postgres_db       = var.rds_database_name
    
    jwt_secret           = var.jwt_secret
    jwt_expiration_in_ms = var.jwt_expiration_in_ms
    client_url           = var.client_url

    app_port = var.app_port

    project     = var.project
    environment = var.environment
    aws_region  = var.aws_region
  })

  tags = {
    Name        = "${var.environment}App",
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "app_cli" {
  family                   = "${var.environment}AppCLI"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fargate_app_cli_cpu
  memory                   = var.fargate_app_cli_memory

  task_role_arn      = aws_iam_role.ecs_task_role.arn
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = templatefile("${path.module}/task-definitions/app_cli.json.tmpl", {
    image = "${module.ecr_cli.repository_url}:${var.image_tag}"

    postgres_host     = aws_route53_record.database.name
    postgres_port     = module.database.port
    postgres_user     = var.rds_database_username
    postgres_password = var.rds_database_password
    postgres_db       = var.rds_database_name

    project     = var.project
    environment = var.environment
    aws_region  = var.aws_region
  })

  tags = {
    Name        = "${var.environment}AppCLI",
    Project     = var.project
    Environment = var.environment
  }
}

#
# CloudWatch Resources
#
resource "aws_cloudwatch_log_group" "app_cli" {
  name              = "log${var.environment}AppCLI"
  retention_in_days = 30
}
