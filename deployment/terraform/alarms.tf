resource "aws_sns_topic" "global" {
  name = "topic${var.environment}GlobalNotifications"
}

resource "aws_cloudwatch_metric_alarm" "db_server_cpu_utilization" {
  count                     = var.environment == "Staging" ? 1 : 0
  alarm_name                = "alarm${var.environment}DatabaseServerCPUUtilization"
  comparison_operator       = "GreaterThanThreshold"
  evaluation_periods        = "1"
  metric_name               = "CPUUtilization"
  namespace                 = "AWS/RDS"
  period                    = "300"
  statistic                 = "Average"
  threshold                 = "80"
  alarm_actions             = [aws_sns_topic.global.arn]
  insufficient_data_actions = [aws_sns_topic.global.arn]
  ok_actions                = [aws_sns_topic.global.arn]
  alarm_description         = "Monitor if database server CPU utilization rate is on average larger than 80 for 1 datapoint in 5 minutes"
  datapoints_to_alarm       = "1"
  treat_missing_data        = "missing"

  dimensions = {
    DBInstanceIdentifier = var.rds_database_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_server_disk_queue_depth" {
  count                     = var.environment == "Staging" ? 1 : 0
  alarm_name                = "alarm${var.environment}DatabaseServerDiskQueueDepth"
  comparison_operator       = "GreaterThanThreshold"
  evaluation_periods        = "1"
  metric_name               = "DiskQueueDepth"
  namespace                 = "AWS/RDS"
  period                    = "60"
  statistic                 = "Average"
  threshold                 = "10"
  alarm_actions             = [aws_sns_topic.global.arn]
  insufficient_data_actions = [aws_sns_topic.global.arn]
  ok_actions                = [aws_sns_topic.global.arn]
  alarm_description         = "Monitors if database server disk queue depth is on average larger than 10 for 1 datapoint in 1 minute"
  datapoints_to_alarm       = "1"
  treat_missing_data        = "missing"

  dimensions = {
    DBInstanceIdentifier = var.rds_database_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_server_freeable_memory" {
  count                     = var.environment == "Staging" ? 1 : 0
  alarm_name                = "alarm${var.environment}DatabaseServerFreeableMemory"
  comparison_operator       = "LessThanThreshold"
  evaluation_periods        = "1"
  metric_name               = "FreeableMemory"
  namespace                 = "AWS/RDS"
  period                    = "60"
  statistic                 = "Average"
  threshold                 = "128000000"
  alarm_actions             = [aws_sns_topic.global.arn]
  insufficient_data_actions = [aws_sns_topic.global.arn]
  ok_actions                = [aws_sns_topic.global.arn]
  alarm_description         = "Monitor if database server freeable memory is on average less than 128M for 1 datapoint in 1 minute"
  datapoints_to_alarm       = "1"
  treat_missing_data        = "missing"

  dimensions = {
    DBInstanceIdentifier = var.rds_database_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_server_free_storage_space" {
  count                     = var.environment == "Staging" ? 1 : 0
  alarm_name                = "alarm${var.environment}DatabaseServerFreeStorageSpace"
  comparison_operator       = "LessThanThreshold"
  evaluation_periods        = "1"
  metric_name               = "FreeStorageSpace"
  namespace                 = "AWS/RDS"
  period                    = "60"
  statistic                 = "Average"
  threshold                 = "5000000000"
  alarm_actions             = [aws_sns_topic.global.arn]
  insufficient_data_actions = [aws_sns_topic.global.arn]
  ok_actions                = [aws_sns_topic.global.arn]
  alarm_description         = "Monitor if database server free storage space is on average less than 5G for 1 datapoint in 1 minute"
  datapoints_to_alarm       = "1"
  treat_missing_data        = "missing"

  dimensions = {
    DBInstanceIdentifier = var.rds_database_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "app_server_latency" {
  count                     = var.environment == "Staging" ? 1 : 0
  alarm_name                = "alarm${var.environment}AppServerTargetResponseRate"
  comparison_operator       = "GreaterThanThreshold"
  evaluation_periods        = "1"
  metric_name               = "TargetResponseTime"
  namespace                 = "AWS/ApplicationELB"
  period                    = "900"
  statistic                 = "Average"
  threshold                 = "1.5"
  alarm_actions             = [aws_sns_topic.global.arn]
  insufficient_data_actions = [aws_sns_topic.global.arn]
  ok_actions                = [aws_sns_topic.global.arn]
  alarm_description         = "Monitor if load balancer target response rate is on average greater than 1.5sec for 1 data point in 15 minutes"
  datapoints_to_alarm       = "1"
  treat_missing_data        = "missing"

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }
}