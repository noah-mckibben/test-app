#!/bin/bash

set -e

# Configuration
SUBSCRIPTION_ID="e4fb7f30-86ac-4ae8-82e1-297f8752bb7f"
RESOURCE_GROUP="rg-testapp-prod"
ACR_NAME="contactcenterplatform"
LOCATION="westus2"
CONTAINER_APP_NAME="test-app-container"
IMAGE_NAME="test-app"
DB_PASSWORD="Ready1235$"
KEYVAULT_NAME="contactcenterplatform"

echo "================================"
echo "Azure Container Apps Deployment"
echo "================================"

# Check if logged in to Azure
echo "Checking Azure CLI authentication..."
az account show > /dev/null || (echo "Please run: az login" && exit 1)

# Set subscription
echo "Setting subscription to ${SUBSCRIPTION_ID}..."
az account set --subscription ${SUBSCRIPTION_ID}

# Build Docker image
echo ""
echo "Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

# Login to ACR
echo ""
echo "Logging in to Azure Container Registry..."
az acr login --name ${ACR_NAME}

# Tag and push image
echo "Tagging image for ACR..."
docker tag ${IMAGE_NAME}:latest ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest

echo "Pushing image to ACR..."
docker push ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest

echo ""
echo "✓ Image pushed successfully!"
echo "  Image URI: ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest"

# Get ACR credentials
echo ""
echo "Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show -n ${ACR_NAME} --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show -n ${ACR_NAME} --query "passwords[0].value" -o tsv)

# Store password in Key Vault
echo "Storing database password in Key Vault..."
az keyvault secret set \
  --vault-name ${KEYVAULT_NAME} \
  --name "DbPassword" \
  --value "${DB_PASSWORD}" || echo "Warning: Could not store in Key Vault"

# Check if Container App exists
echo ""
echo "Checking if Container App exists..."
CONTAINER_APP=$(az containerapp show \
  --name ${CONTAINER_APP_NAME} \
  --resource-group ${RESOURCE_GROUP} \
  --query "id" 2>/dev/null)

if [ -z "$CONTAINER_APP" ]; then
  echo "Creating Container App ${CONTAINER_APP_NAME}..."

  # Create or get Container Apps environment
  ENVIRONMENT_NAME="prod-environment"
  ENVIRONMENT=$(az containerapp env show \
    --name ${ENVIRONMENT_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "id" 2>/dev/null)

  if [ -z "$ENVIRONMENT" ]; then
    echo "Creating Container Apps environment..."
    az containerapp env create \
      --name ${ENVIRONMENT_NAME} \
      --resource-group ${RESOURCE_GROUP} \
      --location ${LOCATION}
  fi

  az containerapp create \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --environment ${ENVIRONMENT_NAME} \
    --image ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest \
    --registry-server ${ACR_NAME}.azurecr.io \
    --registry-username ${ACR_USERNAME} \
    --registry-password ${ACR_PASSWORD} \
    --target-port 8080 \
    --ingress external \
    --cpu 1.0 \
    --memory 2Gi \
    --env-vars \
      ASPNETCORE_ENVIRONMENT=Production \
      KeyVault__Url=https://${KEYVAULT_NAME}.vault.azure.net/ \
      DbPassword="${DB_PASSWORD}"
else
  echo "Updating Container App ${CONTAINER_APP_NAME}..."
  az containerapp update \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --image ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest \
    --set-env-vars \
      DbPassword="${DB_PASSWORD}"
fi

echo ""
echo "✓ Deployment complete!"
echo ""
echo "Container App Details:"
az containerapp show \
  --name ${CONTAINER_APP_NAME} \
  --resource-group ${RESOURCE_GROUP} \
  --query "{name: name, status: properties.runningStatus, url: properties.configuration.ingress.fqdn}" \
  -o table

echo ""
echo "Application URL:"
APP_URL=$(az containerapp show \
  --name ${CONTAINER_APP_NAME} \
  --resource-group ${RESOURCE_GROUP} \
  --query "properties.configuration.ingress.fqdn" -o tsv)
echo "https://${APP_URL}"
