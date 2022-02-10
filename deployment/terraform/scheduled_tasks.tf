resource "aws_cloudwatch_event_rule" "reindex_task" {
  name                = "reindex-scheduled-ecs-event-rule-${var.environment}"
  // Run monthly at 5AM UTC (midnight EST)
  schedule_expression = "cron(0 5 1 * ? *)"
}

resource "aws_cloudwatch_event_target" "reindex_task" {
  target_id = "reindex-scheduled-ecs-event-rule-${var.environment}"
  rule      = aws_cloudwatch_event_rule.reindex_task.name
  arn       = aws_ecs_cluster.app.arn
  role_arn  = aws_iam_role.ecs_task_role.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.app.arn
    // Reindex task doesn't load TopoJSON, so we can run it on Fargate
    launch_type         = "FARGATE"
    network_configuration {
      subnets         = module.vpc.private_subnet_ids
      // TODO: check if thi is really necessary
      assign_public_ip = true
      security_groups  = [aws_security_group.app.id]
    }
  }
  input = <<DOC
  {
    "containerOverrides": [
      {
        "name": "app",
        "command": ["run", "reindex"]
      }
    ]
  }
  DOC
}