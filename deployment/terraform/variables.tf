variable "project" {
  default = "DistrictBuilder"
  type    = string
}

variable "environment" {
  default = "Staging"
  type    = string
}

variable "aws_region" {
  default = "us-east-1"
  type    = string
}

variable "aws_availability_zones" {
  default = ["us-east-1a", "us-east-1b"]
  type    = list(string)
}

variable "aws_key_name" {
  type = string
}

variable "r53_private_hosted_zone" {
  type = string
}

variable "r53_public_hosted_zone" {
  type = string
}

variable "cloudfront_price_class" {
  type = string
}

variable "vpc_cidr_block" {
  default = "10.0.0.0/16"
  type    = string
}

variable "external_access_cidr_block" {
  type = string
}

variable "vpc_private_subnet_cidr_blocks" {
  default = ["10.0.1.0/24", "10.0.3.0/24"]
  type    = list(string)
}

variable "vpc_public_subnet_cidr_blocks" {
  default = ["10.0.0.0/24", "10.0.2.0/24"]
  type    = list(string)
}

variable "bastion_ami" {
  type = string
}

variable "bastion_instance_type" {
  default = "t3.nano"
  type    = string
}

variable "bastion_ebs_optimized" {
  default = true
  type    = bool
}

variable "rds_allocated_storage" {
  default = "32"
  type    = string
}

variable "rds_engine_version" {
  default = "12.4"
  type    = string
}

variable "rds_parameter_group_family" {
  default = "postgres12"
  type    = string
}

variable "rds_instance_type" {
  default = "db.t3.micro"
  type    = string
}

variable "rds_storage_type" {
  default = "gp2"
  type    = string
}

variable "rds_database_identifier" {
  type = string
}

variable "rds_database_name" {
  type = string
}

variable "rds_database_username" {
  type = string
}

variable "rds_database_password" {
  type = string
}

variable "rds_backup_retention_period" {
  default = "30"
  type    = string
}

variable "rds_backup_window" {
  default = "04:00-04:30"
  type    = string
}

variable "rds_maintenance_window" {
  default = "sun:04:30-sun:05:30"
  type    = string
}

variable "rds_auto_minor_version_upgrade" {
  default = true
  type    = bool
}

variable "rds_final_snapshot_identifier" {
  default = "districtbuilder-rds-snapshot"
  type    = string
}

variable "rds_monitoring_interval" {
  default = "60"
  type    = string
}

variable "rds_skip_final_snapshot" {
  default = false
  type    = bool
}

variable "rds_copy_tags_to_snapshot" {
  default = true
  type    = bool
}

variable "rds_multi_az" {
  default = false
  type    = bool
}

variable "rds_storage_encrypted" {
  default = false
  type    = bool
}

variable "rds_seq_page_cost" {
  default = "1"
  type    = string
}

variable "rds_random_page_cost" {
  default = "1"
  type    = string
}

variable "rds_log_min_duration_statement" {
  default = "500"
  type    = string
}

variable "rds_log_connections" {
  default = "0"
  type    = string
}

variable "rds_log_disconnections" {
  default = "0"
  type    = string
}

variable "rds_log_lock_waits" {
  default = "1"
  type    = string
}

variable "rds_log_temp_files" {
  default = "500"
  type    = string
}

variable "rds_log_autovacuum_min_duration" {
  default = "250"
  type    = string
}

variable "rds_cpu_threshold_percent" {
  default = "75"
  type    = string
}

variable "rds_disk_queue_threshold" {
  default = "10"
  type    = string
}

variable "rds_free_disk_threshold_bytes" {
  default = "5000000000"
  type    = string
}

variable "rds_free_memory_threshold_bytes" {
  default = "128000000"
  type    = string
}

variable "rds_cpu_credit_balance_threshold" {
  default = "30"
  type    = string
}

variable "image_tag" {
  type = string
}

variable "container_instance_type" {
  default = "r5.2xlarge"
  type    = string
}

variable "container_instance_root_block_device_type" {
  default = "gp2"
  type    = string
}

variable "container_instance_root_block_device_size" {
  default = 64
  type    = number
}

variable "container_instance_asg_health_check_grace_period" {
  default = 600
  type    = number
}

variable "container_instance_app_desired_count" {
  default = 1
  type    = number
}

variable "container_instance_app_deployment_min_percent" {
  default = 100
  type    = number
}

variable "container_instance_app_deployment_max_percent" {
  default = 200
  type    = number
}

variable "container_instance_app_cpu" {
  default = 4096
  type    = number
}

variable "container_instance_app_base_memory" {
  default = 2048
  type    = number
}

variable "fargate_platform_version" {
  default = "1.4.0"
}

variable "fargate_app_desired_count" {
  default = 1
  type    = number
}

variable "fargate_app_deployment_min_percent" {
  default = 100
  type    = number
}

variable "fargate_app_deployment_max_percent" {
  default = 200
  type    = number
}

variable "health_check_grace_period_per_state" {
  type = number
}

variable "districtbuilder_state_count" {
  type = number
}

variable "fargate_app_cpu" {
  type = number
}

variable "fargate_app_base_memory" {
  type = number
}

variable "fargate_app_cli_cpu" {
  type = number
}

variable "fargate_app_cli_memory" {
  type = number
}

variable "jwt_secret" {
  type = string
}

variable "jwt_expiration_in_ms" {
  type = number
}

variable "client_url" {
  type = string
}

variable "health_check_db_timeout" {
  type = string
}

variable "rollbar_access_token" {
  type = string
}

variable "plan_score_api_token" {
  type = string
}

variable "app_port" {
  default = 3005
  type    = number
}

variable "aws_ecs_task_execution_role_policy_arn" {
  default = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  type    = string
}

variable "aws_ec2_service_role_policy_arn" {
  default = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
  type    = string
}

variable "aws_cloudfront_canonical_user_id" {
  default = "c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0"
  type    = string
}
