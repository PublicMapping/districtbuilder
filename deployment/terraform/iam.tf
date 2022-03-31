#
# ECS IAM resources
#
data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }

    actions = [
      "sts:AssumeRole",
    ]
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "ecs${var.environment}TaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role" "ecs_task_role" {
  name               = "ecs${var.environment}TaskRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = var.aws_ecs_task_execution_role_policy_arn
}

#
# ECS container instance IAM resources
#
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_container_instance_role" {
  name               = "ecs${var.environment}ContainerInstanceRole"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

# AmazonEC2ContainerServiceforEC2Role allows the container instances to pull
# container images from ECR and write to CloudWatch Logs. This role is similar
# to an ECS task execution role, except it's applied at the instance level. ECS
# task execution roles appear to work on EC2 instances, but it's unclear what
# the current best practice is. So, we're following this pattern out of
# historical precedent.
resource "aws_iam_role_policy_attachment" "ec2_service_role_policy" {
  role       = aws_iam_role.ecs_container_instance_role.name
  policy_arn = var.aws_ec2_service_role_policy_arn
}

resource "aws_iam_instance_profile" "ecs_container_instance_role" {
  name = aws_iam_role.ecs_container_instance_role.name
  role = aws_iam_role.ecs_container_instance_role.name
}

#
# App Server IAM resources
#
data "aws_iam_policy_document" "scoped_email_sending" {
  statement {
    effect = "Allow"

    actions = ["ses:SendRawEmail"]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"

      values = ["no-reply@${var.r53_public_hosted_zone}"]
    }
  }
}

resource "aws_iam_role_policy" "scoped_email_sending" {
  name   = "ses${var.environment}ScopedEmailSendingPolicy"
  role   = aws_iam_role.ecs_task_role.name
  policy = data.aws_iam_policy_document.scoped_email_sending.json
}

resource "aws_iam_role_policy" "scoped_email_sending_container_instance" {
  name   = "ses${var.environment}ScopedEmailSendingPolicy"
  role   = aws_iam_role.ecs_container_instance_role.name
  policy = data.aws_iam_policy_document.scoped_email_sending.json
}

#
# ALB IAM resources
#
data "aws_elb_service_account" "main" {}

data "aws_iam_policy_document" "alb_access_logging" {
  statement {
    effect = "Allow"

    actions = ["s3:PutObject"]

    principals {
      type        = "AWS"
      identifiers = [data.aws_elb_service_account.main.arn]
    }

    resources = [
      "${aws_s3_bucket.logs.arn}/ALB/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "alb_access_logging" {
  bucket = aws_s3_bucket.logs.id
  policy = data.aws_iam_policy_document.alb_access_logging.json
}

#
# Lambda IAM resources
#
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

#
# Lambda function role for DB server alarms
#
resource "aws_iam_role" "alert_database_server_alarms" {
  name               = "lambda${var.environment}AlertDatabaseServerAlarms"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "alert_database_server_alarms_policy" {
  role       = aws_iam_role.alert_database_server_alarms.name
  policy_arn = var.aws_lambda_service_role_policy_arn
}