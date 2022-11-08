#
# Database Related Alarms SNS Topic Notification
#

resource "aws_lambda_function" "alert_database_server_alarms" {
  filename         = "${path.module}/lambda-functions/alert_to_slack/alert_to_slack.zip"
  source_code_hash = base64sha256(filebase64("${path.module}/lambda-functions/alert_to_slack/alert_to_slack.zip"))
  function_name    = "func${var.environment}AlertDatabaseServerAlarms"
  description      = "Function to listen to the global SNS topics for database related CloudWatch alarms."
  role             = aws_iam_role.alert_database_server_alarms.arn
  handler          = "alert_to_slack.handler"
  runtime          = "python3.8"
  timeout          = 90
  memory_size      = 256

  reserved_concurrent_executions = 1

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      SLACK_BOT_WEBHOOK = var.slack_bot_webhook_url
    }
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alert_database_server_alarms_global_events" {
  topic_arn = aws_sns_topic.global.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alert_database_server_alarms.arn
}

resource "aws_lambda_permission" "alert_database_server_alarms_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_database_server_alarms.arn
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.global.arn
}