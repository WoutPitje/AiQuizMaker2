# Terraform GCP Deployment Documentation

## Overview

This document describes the Terraform infrastructure setup for deploying AiQuizMaker to Google Cloud Platform using Google Cloud Run. The infrastructure is designed to be production-ready, scalable, and cost-effective.

## Architecture Components

### 1. Project Module (`terraform/modules/project/`)
**Purpose**: Handles GCP project setup and base configuration

**Resources Created**:
- GCP Project (optional - can use existing)
- Required API enablement (Cloud Run, Storage, Monitoring, etc.)
- Service accounts with appropriate permissions
- Secret Manager setup for OpenAI API key
- IAM roles and bindings

**Key Features**:
- Conditional project creation
- Comprehensive API enablement
- Secure secret management
- Minimal permission service accounts

### 2. Cloud Run Module (`terraform/modules/cloud_run/`)
**Purpose**: Deploys containerized applications as Cloud Run services

**Resources Created**:
- API service (NestJS backend)
- Web service (Nuxt.js frontend)
- IAM policies for public access
- Custom domain mappings (optional)
- Health checks and probes

**Key Features**:
- Auto-scaling configuration
- Environment variable management
- Service-to-service communication
- Custom domain support
- Health monitoring

### 3. Storage Module (`terraform/modules/storage/`)
**Purpose**: Manages file storage and data persistence

**Resources Created**:
- Uploads bucket for user file uploads
- Quiz storage bucket for generated quizzes
- IAM permissions for service accounts
- Lifecycle policies for cost optimization
- CORS configuration for web uploads
- Optional Pub/Sub notifications

**Key Features**:
- Versioning enabled
- Automatic lifecycle management
- Cross-origin resource sharing
- Cost-optimized storage classes
- Event-driven processing capabilities

### 4. Monitoring Module (`terraform/modules/monitoring/`)
**Purpose**: Provides observability and alerting

**Resources Created**:
- Email notification channels
- Alert policies for various metrics
- Custom monitoring dashboard
- Log-based metrics
- Error tracking

**Key Features**:
- Service availability monitoring
- Error rate alerts
- Response latency tracking
- Application error logging
- Custom dashboard with key metrics

## File Structure

```
terraform/
├── main.tf                 # Root configuration
├── variables.tf            # Input variables definition  
├── outputs.tf             # Output values
├── terraform.tfvars.example # Example configuration
├── README.md              # Usage instructions
└── modules/
    ├── project/           # Project setup module
    ├── cloud_run/         # Cloud Run services
    ├── storage/           # Storage buckets
    └── monitoring/        # Monitoring & alerting
```

## Key Configuration Variables

### Required Variables
- `project_id`: GCP project identifier
- `billing_account`: Billing account for costs
- `org_id` or `folder_id`: Organization hierarchy
- `openai_api_key`: API key for quiz generation

### Optional Variables
- `environment`: Deployment environment (dev/staging/prod)
- `region`: GCP region for resources
- Resource allocation (CPU, memory, instances)
- Custom domain configuration
- Monitoring settings

## Security Considerations

1. **Service Accounts**: Minimal permissions following least privilege principle
2. **Secrets Management**: OpenAI API key stored securely in Secret Manager
3. **Storage Security**: Uniform bucket-level access control
4. **Network Security**: HTTPS-only traffic enforcing TLS
5. **IAM**: Role-based access control with proper resource isolation

## Cost Optimization Features

1. **Auto-scaling**: Scale to zero when not in use
2. **Storage Lifecycle**: Automatic transition to cheaper storage classes
3. **Resource Sizing**: Configurable CPU and memory allocation
4. **Regional Deployment**: Avoid multi-regional costs unless needed
5. **Monitoring**: Track usage and costs with alerts

## Deployment Workflow

1. **Infrastructure Provisioning**: `terraform apply` creates all resources
2. **Container Building**: Build Docker images for API and Web
3. **Image Deployment**: Push to Google Container Registry
4. **Service Update**: Update Cloud Run services with new images
5. **Verification**: Test endpoints and monitor metrics

## Environment Management

The setup supports multiple environments through Terraform workspaces:
- Development: Cost-optimized with minimal resources
- Staging: Production-like for testing
- Production: High availability with monitoring

## Monitoring and Alerting

### Alert Policies Created
- Service availability (uptime < 95%)
- High error rate (> 5% HTTP errors)
- Response latency (> 5 seconds)
- Application errors (log-based alerts)

### Dashboard Metrics
- Request count per service
- Response latency percentiles
- Error rates and types
- Resource utilization

## Integration Points

### Application Code Changes Required
1. **API**: Update file storage to use Cloud Storage buckets
2. **Environment Variables**: Configure service URLs and storage paths
3. **Health Checks**: Implement `/health` endpoint for API
4. **Logging**: Use structured logging for better monitoring

### Docker Image Considerations
1. **Port Configuration**: Services must listen on port 8080
2. **Health Endpoints**: Required for Cloud Run health checks
3. **Environment Variables**: Handle Cloud Run environment setup
4. **Signal Handling**: Proper graceful shutdown implementation

## Troubleshooting

### Common Issues
1. **API Enablement**: Ensure all required APIs are enabled
2. **Billing**: Verify billing account is properly linked
3. **Permissions**: Check service account permissions
4. **Images**: Ensure Docker images are pushed to correct registry
5. **Networking**: Verify service-to-service communication

### Debug Resources
- Cloud Console for visual inspection
- Cloud Logging for application logs
- Cloud Monitoring for metrics
- Cloud Trace for request tracing

## Best Practices

1. **State Management**: Use remote state storage for team collaboration
2. **Version Control**: Keep Terraform code in git with proper branching
3. **Environment Separation**: Use separate projects/workspaces per environment
4. **Secret Management**: Never commit secrets to version control
5. **Resource Naming**: Use consistent naming conventions across resources

## Future Enhancements

1. **CI/CD Integration**: Automate deployments with Cloud Build
2. **Database**: Add Cloud SQL for persistent data storage
3. **CDN**: Implement Cloud CDN for global content delivery
4. **Load Balancing**: Add global load balancer for multi-region deployment
5. **Backup**: Implement automated backup strategies

## Performance Considerations

1. **Cold Starts**: Configure minimum instances for production
2. **Memory Allocation**: Right-size containers for optimal performance
3. **Regional Placement**: Deploy close to users for low latency
4. **Caching**: Implement caching strategies for better performance
5. **Database Connections**: Use connection pooling for database access

This infrastructure provides a solid foundation for the AiQuizMaker application with room for growth and optimization as requirements evolve. 