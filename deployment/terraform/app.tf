#
# Security Group Resources
#
resource "aws_security_group" "alb" {
  vpc_id = module.vpc.id

  tags = {
    Name        = "sgAppLoadBalancer"
    Project     = var.project
    Environment = var.environment
  }
}

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
# ALB Resources
#
resource "aws_lb" "app" {
  name            = "alb${var.environment}App"
  security_groups = [aws_security_group.alb.id]
  subnets         = module.vpc.public_subnet_ids

  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "ALB/APP"
    enabled = true
  }

  tags = {
    Name        = "alb${var.environment}App"
    Project     = var.project
    Environment = var.environment
  }

  # In order to enable access logging, the ELB service account needs S3 access.
  # This is a "hidden" dependency that Terraform cannot automatically infer, so
  # it must be declared explicitly.
  depends_on = [
    aws_s3_bucket_policy.alb_access_logging
  ]
}

resource "aws_lb_target_group" "app" {
  name = "tg${var.environment}App"

  health_check {
    healthy_threshold   = var.target_group_health_check_healthy_threshold
    interval            = var.target_group_health_check_interval
    matcher             = "200"
    protocol            = "HTTP"
    timeout             = var.target_group_health_check_timeout
    path                = "/healthcheck"
    unhealthy_threshold = var.target_group_health_check_unhealthy_threshold
  }

  port     = "80"
  protocol = "HTTP"
  vpc_id   = module.vpc.id

  target_type = "ip"

  tags = {
    Name        = "tg${var.environment}App"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.id
  port              = "443"
  protocol          = "HTTPS"
  certificate_arn   = module.cert.arn

  default_action {
    target_group_arn = aws_lb_target_group.app.id
    type             = "forward"
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

locals {
  fargate_app_memory = min(
    // It is estimated that some larger states could use up to a gig.
    // This math will add an additional 1024MiB for every state.
    var.fargate_app_base_memory + var.districtbuilder_state_count * 1024,
    // This math will also cap memory by vCPUs to not exceed Fargate
    // limits.
    (var.fargate_app_cpu / 1024) * 8192,
    // This ensures no configuration exceeds the upper bound of memory
    // a Fargate container can have.
    30720
  )

  # We're splitting out some of the task definition's templated variables into a
  # local value to avoid duplicating things for the EC2 version of the task.
  shared_app_task_def_template_vars = {
    image = "${module.ecr.repository_url}:${var.image_tag}"

    postgres_host     = aws_route53_record.database.name
    postgres_port     = module.database.port
    postgres_user     = var.rds_database_username
    postgres_password = var.rds_database_password
    postgres_db       = var.rds_database_name

    # The database health check is wrapped within a promise that will reject in
    # the specified number of milliseconds.
    # https://github.com/nestjs/terminus/blob/d5226a9334abfe1112c523c3b92cdc7214a26025/lib/health-indicator/database/typeorm.health.ts#L90-L114
    typeorm_health_check_timeout = var.typeorm_health_check_timeout * 1000

    default_from_email   = "no-reply@${var.r53_public_hosted_zone}"
    jwt_secret           = var.jwt_secret
    jwt_expiration_in_ms = var.jwt_expiration_in_ms
    client_url           = var.client_url

    app_port = var.app_port

    rollbar_access_token = var.rollbar_access_token

    plan_score_api_token = var.plan_score_api_token

    project     = var.project
    environment = var.environment
    aws_region  = var.aws_region
  }

  app_health_check_grace_period_seconds = var.districtbuilder_state_count * var.health_check_grace_period_per_state
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.environment}App"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fargate_app_cpu
  memory                   = local.fargate_app_memory

  task_role_arn      = aws_iam_role.ecs_task_role.arn
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = templatefile("${path.module}/task-definitions/app.json.tmpl", merge(
    local.shared_app_task_def_template_vars,
    {
      max_old_space_size = floor(local.fargate_app_memory * var.max_old_space_size_scale_factor)
    }
  ))

  tags = {
    Name        = "${var.environment}App",
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_ecs_service" "app" {
  name            = "${var.environment}App"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.app.arn

  desired_count                      = var.fargate_app_desired_count
  deployment_minimum_healthy_percent = var.fargate_app_deployment_min_percent
  deployment_maximum_percent         = var.fargate_app_deployment_max_percent

  health_check_grace_period_seconds = local.app_health_check_grace_period_seconds

  launch_type      = "FARGATE"
  platform_version = var.fargate_platform_version

  network_configuration {
    security_groups = [aws_security_group.app.id]
    subnets         = module.vpc.private_subnet_ids
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = var.app_port
  }

  depends_on = [
    aws_lb_listener.app,
  ]
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
resource "aws_cloudwatch_log_group" "app" {
  name              = "log${var.environment}App"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "app_cli" {
  name              = "log${var.environment}AppCLI"
  retention_in_days = 30
}
