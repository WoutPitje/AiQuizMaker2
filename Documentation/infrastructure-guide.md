# Infrastructure Guide

This guide covers setting up and managing the infrastructure for AI Quiz Maker using Terraform on Google Cloud Platform.

## Overview

The AI Quiz Maker uses Infrastructure as Code (IaC) with Terraform to create and manage cloud resources. The infrastructure supports both hybrid static hosting and full Cloud Run deployments.

## Architecture Components

### Terraform Modules

#### 1. Project Module (`terraform/modules/project/`)
**Purpose**: Handles GCP project setup and base configuration

**Resources Created**:
- GCP Project (optional - can use existing)
- Required API enablement (Cloud Run, Storage, Monitoring, etc.)
- Service accounts with appropriate permissions
- Secret Manager setup for OpenAI API key
- IAM roles and bindings

#### 2. Cloud Run Module (`terraform/modules/cloud_run/`)
**Purpose**: Deploys containerized applications as Cloud Run services

**Resources Created**:
- API service (NestJS backend)
- Web service (Nuxt.js frontend) - optional
- IAM policies for public access
- Custom domain mappings (optional)
- Health checks and probes

#### 3. Storage Module (`terraform/modules/storage/`)
**Purpose**: Manages file storage and data persistence

**Resources Created**:
- Uploads bucket for user file uploads
- Quiz storage bucket for generated quizzes
- Static hosting bucket (for hybrid architecture)
- IAM permissions for service accounts
- Lifecycle policies for cost optimization
- CORS configuration for web uploads

#### 4. Monitoring Module (`terraform/modules/monitoring/`)
**Purpose**: Provides observability and alerting

**Resources Created**:
- Email notification channels
- Alert policies for various metrics
- Custom monitoring dashboard
- Log-based metrics
- Error tracking

## File Structure

```
terraform/
├── main.tf                    # Root configuration
├── variables.tf               # Input variables definition  
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Example configuration
├── README.md                  # Usage instructions
└── modules/
    ├── project/               # Project setup module
    ├── cloud_run/             # Cloud Run services
    ├── storage/               # Storage buckets
    ├── static_hosting/        # Static site hosting
    └── monitoring/            # Monitoring & alerting
```

## Quick Start

### 1. Prerequisites
- Google Cloud SDK installed and authenticated
- Terraform installed (version 1.0+)
- Billing account with appropriate permissions
- Organization or folder access

### 2. Initial Setup
```bash
# Clone repository and navigate to terraform directory
cd terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit configuration with your values
nano terraform.tfvars
```

### 3. Configure Variables
Edit `terraform.tfvars` with your specific values:

```hcl
# Project Configuration
project_id = "aiquizmaker-prod"
billing_account = "01234A-56789B-CDEF01"
org_id = "123456789012"

# Application Configuration
openai_api_key = "sk-your-openai-api-key"
environment = "prod"
region = "europe-west1"

# Domain Configuration (optional)
domain_name = "quizai.nl"
api_domain_name = "api.quizai.nl"

# Architecture Choice
enable_static_hosting = true  # For hybrid architecture
enable_web_service = false   # Disable web Cloud Run service
```

### 4. Deploy Infrastructure
```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply
```

## Configuration Options

### Project Creation

#### Automatic Project Creation
```hcl
create_project = true
project_id = "aiquizmaker-1234567890"  # Must be globally unique
billing_account = "01234A-56789B-CDEF01"
org_id = "123456789012"  # Or use folder_id instead
```

#### Using Existing Project
```hcl
create_project = false
project_id = "my-existing-project"
```

### Architecture Selection

#### Hybrid Architecture (Recommended)
```hcl
# Static frontend + Cloud Run API
enable_static_hosting = true
enable_web_service = false
enable_cdn = false  # Optional, adds cost
```

#### Full Cloud Run Architecture
```hcl
# Both frontend and API on Cloud Run
enable_static_hosting = false
enable_web_service = true
```

### Resource Allocation

#### API Service Configuration
```hcl
api_cpu = "1"
api_memory = "512Mi"
api_min_instances = 0
api_max_instances = 10
api_port = 8080
```

#### Web Service Configuration (if enabled)
```hcl
web_cpu = "1"
web_memory = "512Mi"
web_min_instances = 0
web_max_instances = 10
web_port = 3000
```

### Domain Configuration

#### Custom Domains
```hcl
domain_name = "your-domain.com"
api_domain_name = "api.your-domain.com"
```

#### SSL Certificates
Terraform automatically provisions managed SSL certificates for custom domains.

## Advanced Configuration

### Environment-Specific Settings

#### Development Environment
```hcl
environment = "dev"
api_min_instances = 0    # Scale to zero for cost savings
api_max_instances = 2    # Lower limits for dev
enable_cdn = false       # Skip CDN for dev
```

#### Production Environment
```hcl
environment = "prod"
api_min_instances = 1    # Always have 1 instance ready
api_max_instances = 100  # Handle high traffic
enable_cdn = true        # Enable CDN for performance
```

### Storage Configuration

#### Bucket Settings
```hcl
# Upload bucket (temporary files)
upload_bucket_lifecycle_age = 1  # Delete after 1 day

# Quiz storage bucket (persistent)
quiz_bucket_versioning = true
quiz_bucket_lifecycle_age = 365  # Keep versions for 1 year

# Static hosting bucket (hybrid only)
static_bucket_website_main_page_suffix = "index.html"
static_bucket_website_not_found_page = "404.html"
```

#### CORS Configuration
```hcl
cors_origins = ["https://your-domain.com", "https://www.your-domain.com"]
cors_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
cors_headers = ["Content-Type", "Authorization"]
```

### Monitoring Configuration

#### Alert Policies
```hcl
# Email notifications
notification_email = "admin@your-domain.com"

# Alert thresholds
error_rate_threshold = 0.05      # 5% error rate
latency_threshold = 5000         # 5 seconds
uptime_threshold = 0.95          # 95% uptime
```

#### Dashboard Configuration
```hcl
create_dashboard = true
dashboard_name = "AI Quiz Maker - ${var.environment}"
```

## Deployment Strategies

### Single Environment
```bash
# Deploy to production
terraform workspace select default
terraform apply
```

### Multiple Environments
```bash
# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Deploy to specific environment
terraform workspace select prod
terraform apply -var-file="prod.tfvars"
```

### Blue-Green Deployment
```bash
# Deploy new version
terraform apply -var="api_image_tag=v2.0.0"

# Test and validate
# Switch traffic when ready
```

## Resource Management

### Terraform State

#### Remote State Storage
```hcl
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "terraform/state"
  }
}
```

#### State Locking
Terraform automatically uses Cloud Storage for state locking when using GCS backend.

### Resource Import

#### Importing Existing Resources
```bash
# Import existing project
terraform import google_project.main your-project-id

# Import existing bucket
terraform import module.storage.google_storage_bucket.uploads your-bucket-name

# Refresh state after import
terraform refresh
```

#### Handling Conflicts
If resources already exist:

1. **Option 1: Import Resources**
   ```bash
   # Run the import script
   ./import-existing-resources.sh
   ```

2. **Option 2: Use Data Sources**
   ```hcl
   data "google_project" "existing" {
     project_id = var.project_id
   }
   ```

### Cost Optimization

#### Resource Sizing
```hcl
# Minimal configuration for cost savings
api_cpu = "0.5"
api_memory = "256Mi"
api_min_instances = 0
enable_cdn = false
```

#### Lifecycle Policies
```hcl
# Automatic cleanup of old files
upload_bucket_lifecycle_age = 1    # Delete uploads after 1 day
quiz_bucket_lifecycle_age = 90     # Archive quizzes after 90 days
```

#### Regional Deployment
```hcl
# Use single region to minimize costs
region = "us-central1"  # or your preferred region
multi_region = false
```

## Security Configuration

### Service Accounts

#### Minimal Permissions
```hcl
# API service account
api_service_account_roles = [
  "roles/cloudsql.client",
  "roles/storage.objectAdmin",
  "roles/secretmanager.secretAccessor"
]

# Web service account (if using Cloud Run web)
web_service_account_roles = [
  "roles/storage.objectViewer"
]
```

#### Custom Roles
```hcl
resource "google_project_iam_custom_role" "quiz_manager" {
  role_id     = "quizManager"
  title       = "Quiz Manager"
  description = "Custom role for quiz management"
  
  permissions = [
    "storage.objects.create",
    "storage.objects.get",
    "storage.objects.delete"
  ]
}
```

### Network Security

#### VPC Configuration
```hcl
# Optional: Create VPC for enhanced security
create_vpc = true
vpc_name = "aiquizmaker-vpc"
subnet_cidr = "10.0.1.0/24"
```

#### Firewall Rules
```hcl
# Restrict access to specific IPs
allowed_ip_ranges = ["1.2.3.4/32", "5.6.7.8/32"]
```

### Secret Management

#### OpenAI API Key
```hcl
# Stored securely in Secret Manager
resource "google_secret_manager_secret" "openai_key" {
  secret_id = "openai-api-key"
  
  replication {
    automatic = true
  }
}
```

## Monitoring and Alerting

### Alert Policies

#### Service Availability
```hcl
# API uptime monitoring
resource "google_monitoring_alert_policy" "api_uptime" {
  display_name = "API Service Uptime"
  
  conditions {
    display_name = "API is down"
    
    condition_threshold {
      filter         = "resource.type=\"cloud_run_revision\""
      comparison     = "COMPARISON_LESS_THAN"
      threshold_value = 0.95
      duration       = "300s"
    }
  }
}
```

#### Error Rate Monitoring
```hcl
# HTTP error rate alerts
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "High Error Rate"
  
  conditions {
    display_name = "Error rate too high"
    
    condition_threshold {
      filter         = "resource.type=\"cloud_run_revision\""
      comparison     = "COMPARISON_GREATER_THAN"
      threshold_value = 0.05  # 5%
      duration       = "300s"
    }
  }
}
```

### Custom Dashboards

#### Service Dashboard
```hcl
resource "google_monitoring_dashboard" "main" {
  dashboard_json = jsonencode({
    displayName = "AI Quiz Maker Dashboard"
    
    widgets = [
      {
        title = "API Response Time"
        xyChart = {
          dataSets = [{
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter = "resource.type=\"cloud_run_revision\""
                aggregation = {
                  alignmentPeriod = "60s"
                  perSeriesAligner = "ALIGN_MEAN"
                }
              }
            }
          }]
        }
      }
    ]
  })
}
```

## Troubleshooting

### Common Issues

#### Terraform State Issues
```bash
# Fix state corruption
terraform refresh

# Unlock state if stuck
terraform force-unlock LOCK_ID
```

#### Resource Conflicts
```bash
# Handle existing resources
terraform import google_storage_bucket.example bucket-name

# Or delete conflicting resources
gcloud storage rm -r gs://conflicting-bucket
```

#### Permission Issues
```bash
# Check current authentication
gcloud auth list

# Re-authenticate if needed
gcloud auth application-default login
```

### Validation and Testing

#### Configuration Validation
```bash
# Validate Terraform syntax
terraform validate

# Check formatting
terraform fmt -check

# Security scanning
terraform plan | tfsec
```

#### Integration Testing
```bash
# Test infrastructure
cd terraform/test
terraform init
terraform apply
```

### Disaster Recovery

#### Backup Strategies
1. **Terraform State**: Stored in Cloud Storage with versioning
2. **Application Data**: Automated bucket backups
3. **Configuration**: Version controlled in Git

#### Recovery Procedures
```bash
# Restore from backup
terraform state pull > backup.tfstate

# Recreate infrastructure
terraform apply -refresh=false

# Restore application data
gsutil -m cp -r gs://backup-bucket/* gs://production-bucket/
```

## Best Practices

### Development Workflow

1. **Branch Protection**: Require PR reviews for infrastructure changes
2. **Environment Separation**: Use separate projects/workspaces
3. **Version Pinning**: Pin Terraform and provider versions
4. **Documentation**: Keep documentation up to date
5. **Testing**: Validate changes in staging before production

### Security Best Practices

1. **Least Privilege**: Grant minimal required permissions
2. **Secret Management**: Use Secret Manager for sensitive data
3. **Network Security**: Implement proper firewall rules
4. **Audit Logging**: Enable Cloud Audit Logs
5. **Regular Updates**: Keep Terraform and providers updated

### Cost Management

1. **Resource Tagging**: Tag all resources for cost tracking
2. **Lifecycle Policies**: Implement automatic cleanup
3. **Right Sizing**: Monitor and adjust resource allocation
4. **Budget Alerts**: Set up billing alerts
5. **Regular Reviews**: Monthly cost optimization reviews

## Related Documentation

- [GCP Deployment Guide](./gcp-deployment-guide.md) - Complete deployment process
- [Docker Deployment Guide](./docker-deployment-guide.md) - Local development setup
- [Configuration Guide](./configuration.md) - Application configuration
- [Terraform Troubleshooting](./terraform-troubleshooting.md) - Common issues and solutions 