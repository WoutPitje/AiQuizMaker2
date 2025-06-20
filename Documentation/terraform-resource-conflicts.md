# Handling Existing Resource Conflicts in Terraform

## Problem
When you run `terraform apply` and get errors like:
- `Error 409: Service account already exists`
- `Error 409: the repository already exists`

This happens when resources were created outside of Terraform or from a previous Terraform state that was lost.

## Solutions

### Option 1: Import Existing Resources (Recommended)

Run the import script to bring existing resources into Terraform state:

```bash
cd terraform
chmod +x import-existing-resources.sh
./import-existing-resources.sh aiquizmaker-1750103493
```

Then run `terraform plan` to see what changes will be made.

### Option 2: Use Data Sources

If you want to reference existing resources without managing them, modify your Terraform code:

```hcl
# Instead of creating, reference existing service account
data "google_service_account" "cloud_run_sa" {
  account_id = "aiquizmaker-run-sa"
}

# Then use: data.google_service_account.cloud_run_sa.email
```

### Option 3: Delete and Recreate

If you're sure you want to start fresh:

```bash
# Delete service account
gcloud iam service-accounts delete aiquizmaker-run-sa@aiquizmaker-1750103493.iam.gserviceaccount.com

# Delete artifact registry
gcloud artifacts repositories delete aiquizmaker-docker --location=europe-west4
```

Then run `terraform apply` again.

### Option 4: Rename Resources

Modify `main.tf` to use different names:

```hcl
resource "google_service_account" "cloud_run_sa" {
  account_id   = "aiquizmaker-run-sa-v2"  # New name
  # ...
}

resource "google_artifact_registry_repository" "docker_repo" {
  repository_id = "aiquizmaker-docker-v2"  # New name
  # ...
}
```

## Best Practices

1. **Always keep your terraform.tfstate file safe** - Store it in a GCS bucket for team projects
2. **Use consistent naming** - Helps avoid conflicts
3. **Document manual changes** - If you create resources manually, document them
4. **Use workspaces** - For different environments (dev, staging, prod)

## Terraform State Management

To use remote state storage (recommended for teams):

```hcl
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "terraform/state"
  }
}
```

This prevents state file loss and enables team collaboration. 