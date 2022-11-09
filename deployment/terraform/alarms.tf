resource "aws_sns_topic" "global" {
  name = "topic${var.environment}GlobalNotifications"
}

locals {
  alarm_count = var.environment == "Production" ? 1 : 0
}

resource "aws_cloudwatch_metric_alarm" "app_server_latency" {
  count                     = local.alarm_count
  alarm_name                = "alarm${var.environment}AppServerTargetResponseRate"
  comparison_operator       = "GreaterThanThreshold"
  evaluation_periods        = "1"
  metric_name               = "TargetResponseTime"
  namespace                 = "AWS/ApplicationELB"
  period                    = "900"
  statistic                 = "Average"
  threshold                 = "1.5"
  alarm_actions             = [aws_sns_topic.global.arn]
  ok_actions                = [aws_sns_topic.global.arn]
  alarm_description         = "Monitor if load balancer target response rate is on average greater than 1.5sec for 1 data point in 15 minutes"
  datapoints_to_alarm       = "1"
  treat_missing_data        = "missing"

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }
}