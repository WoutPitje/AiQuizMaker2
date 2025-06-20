variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "europe-west4" # Netherlands region for .nl domain
}

variable "zone" {
  description = "GCP zone for resources"
  type        = string
  default     = "europe-west4-a"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "quizai.nl"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Application configuration
variable "openai_api_key" {
  description = "OpenAI API key for quiz generation"
  type        = string
  sensitive   = true
}

variable "max_pdf_size" {
  description = "Maximum PDF file size in bytes"
  type        = number
  default     = 104857600 # 100MB
}

variable "max_pages_per_pdf" {
  description = "Maximum pages per PDF"
  type        = number
  default     = 200
}

variable "default_questions_per_page" {
  description = "Default questions per page"
  type        = number
  default     = 2
}

variable "google_analytics_id" {
  description = "Google Analytics ID"
  type        = string
  default     = "G-D817VJ3RW5"
}

# Cloud Run configuration
variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0 # Scale to zero for cost savings
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 1
}

variable "cloud_run_cpu" {
  description = "CPU allocation for Cloud Run"
  type        = string
  default     = "1"
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run"
  type        = string
  default     = "512Mi"
}

variable "cloud_run_timeout" {
  description = "Cloud Run request timeout in seconds"
  type        = number
  default     = 300 # 5 minutes for PDF processing
} 