# Redis Projects Deployment Script
# Usage: .\deploy.ps1 -Project "redis-ai-platform" -Environment "development" -Platform "docker"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("redis-ai-platform", "redis-ai-starter")]
    [string]$Project,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("docker", "kubernetes", "aws", "gcp", "azure")]
    [string]$Platform
)

Write-Host "🚀 Deploying $Project to $Environment on $Platform..." -ForegroundColor Green

# Change to project directory
Set-Location $Project

# Validate environment file exists
if (-not (Test-Path ".env.$Environment")) {
    if (Test-Path ".env.example") {
        Write-Host "⚠️  Creating .env.$Environment from .env.example" -ForegroundColor Yellow
        Copy-Item ".env.example" ".env.$Environment"
        Write-Host "📝 Please edit .env.$Environment with your configuration" -ForegroundColor Yellow
        Read-Host "Press Enter when ready to continue"
    } else {
        Write-Error "❌ No environment file found. Please create .env.$Environment"
        exit 1
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Blue
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Tests failed. Deployment aborted."
    exit 1
}

# Build application
Write-Host "🔨 Building application..." -ForegroundColor Blue
npm run build

# Deploy based on platform
switch ($Platform) {
    "docker" {
        Write-Host "🐳 Deploying with Docker..." -ForegroundColor Blue
        
        # Build Docker image
        $imageName = "$Project-$Environment"
        docker build -t $imageName .
        
        # Stop existing containers
        docker-compose -f docker-compose.$Environment.yml down
        
        # Start new containers
        docker-compose -f docker-compose.$Environment.yml up -d
        
        Write-Host "✅ Docker deployment complete!" -ForegroundColor Green
        Write-Host "🌐 Application available at: http://localhost:3000" -ForegroundColor Cyan
    }
    
    "kubernetes" {
        Write-Host "☸️  Deploying to Kubernetes..." -ForegroundColor Blue
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/
        
        # Wait for deployment
        kubectl rollout status deployment/$Project-api -n $Project
        
        Write-Host "✅ Kubernetes deployment complete!" -ForegroundColor Green
        
        # Get service URL
        $serviceUrl = kubectl get service $Project-frontend -n $Project -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
        if ($serviceUrl) {
            Write-Host "🌐 Application available at: http://$serviceUrl" -ForegroundColor Cyan
        }
    }
    
    "aws" {
        Write-Host "☁️  Deploying to AWS EKS..." -ForegroundColor Blue
        
        # Initialize Terraform
        Set-Location terraform
        terraform init
        
        # Plan deployment
        terraform plan -var="environment=$Environment"
        
        # Apply infrastructure
        terraform apply -var="environment=$Environment" -auto-approve
        
        # Deploy to EKS
        Set-Location ..
        kubectl apply -f k8s/
        
        Write-Host "✅ AWS deployment complete!" -ForegroundColor Green
    }
    
    "gcp" {
        Write-Host "☁️  Deploying to Google GKE..." -ForegroundColor Blue
        
        # Create GKE cluster if it doesn't exist
        $clusterExists = gcloud container clusters describe $Project-cluster --zone=us-central1-a 2>$null
        if (-not $clusterExists) {
            gcloud container clusters create $Project-cluster --zone=us-central1-a --num-nodes=3
        }
        
        # Get credentials
        gcloud container clusters get-credentials $Project-cluster --zone=us-central1-a
        
        # Deploy application
        kubectl apply -f k8s/
        
        Write-Host "✅ GCP deployment complete!" -ForegroundColor Green
    }
    
    "azure" {
        Write-Host "☁️  Deploying to Azure AKS..." -ForegroundColor Blue
        
        # Create resource group if it doesn't exist
        az group create --name $Project-rg --location eastus
        
        # Create AKS cluster if it doesn't exist
        $clusterExists = az aks show --resource-group $Project-rg --name $Project-cluster 2>$null
        if (-not $clusterExists) {
            az aks create --resource-group $Project-rg --name $Project-cluster --node-count 3 --enable-addons monitoring --generate-ssh-keys
        }
        
        # Get credentials
        az aks get-credentials --resource-group $Project-rg --name $Project-cluster
        
        # Deploy application
        kubectl apply -f k8s/
        
        Write-Host "✅ Azure deployment complete!" -ForegroundColor Green
    }
}

# Health check
Write-Host "🏥 Performing health check..." -ForegroundColor Blue
Start-Sleep -Seconds 30

$healthUrl = "http://localhost:3000/api/health"
try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Health check returned: $($response.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Display deployment summary
Write-Host "`n📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   Project: $Project" -ForegroundColor White
Write-Host "   Environment: $Environment" -ForegroundColor White
Write-Host "   Platform: $Platform" -ForegroundColor White
Write-Host "   Status: Deployed" -ForegroundColor Green

# Display useful commands
Write-Host "`n🔧 Useful Commands:" -ForegroundColor Cyan
switch ($Platform) {
    "docker" {
        Write-Host "   View logs: docker-compose logs -f" -ForegroundColor White
        Write-Host "   Stop: docker-compose down" -ForegroundColor White
        Write-Host "   Restart: docker-compose restart" -ForegroundColor White
    }
    "kubernetes" {
        Write-Host "   View pods: kubectl get pods -n $Project" -ForegroundColor White
        Write-Host "   View logs: kubectl logs -f deployment/$Project-api -n $Project" -ForegroundColor White
        Write-Host "   Scale: kubectl scale deployment/$Project-api --replicas=3 -n $Project" -ForegroundColor White
    }
}

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green