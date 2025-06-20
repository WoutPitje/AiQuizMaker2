variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "docker_image" {
  description = "Docker image URL"
  type        = string
}

# Application configuration
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "max_pdf_size" {
  description = "Maximum PDF file size"
  type        = number
}

variable "max_pages_per_pdf" {
  description = "Maximum pages per PDF"
  type        = number
}

variable "default_questions_per_page" {
  description = "Default questions per page"
  type        = number
}

variable "web_url" {
  description = "Frontend URL for CORS"
  type        = string
}

# Cloud Run configuration
variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
}

variable "memory" {
  description = "Memory allocation"
  type        = string
}

variable "timeout" {
  description = "Request timeout in seconds"
  type        = number
}

# Storage bucket names
variable "uploads_bucket_name" {
  description = "Name of the uploads bucket"
  type        = string
}

variable "quiz_storage_bucket_name" {
  description = "Name of the quiz storage bucket"
  type        = string
} 