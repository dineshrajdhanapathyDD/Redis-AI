# Redis Projects Deployment Verification Script
# Usage: .\verify-deployment-fixed.ps1 -Project "redis-ai-platform"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("redis-ai-platform", "redis-ai-starter")]
    [string]$Project
)

Write-Host "Verifying deployment for $Project..." -ForegroundColor Green

# Change to project directory
Set-Location $Project

# Check if required files exist
$requiredFiles = @(
    "package.json",
    "docker-compose.yml",
    "README.md",
    ".env.example"
)

Write-Host "`nChecking required files..." -ForegroundColor Blue
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

# Check Docker setup
Write-Host "`nChecking Docker setup..." -ForegroundColor Blue
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
    
    $dockerComposeVersion = docker-compose --version
    Write-Host "✓ Docker Compose installed: $dockerComposeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not installed or not accessible" -ForegroundColor Red
}

# Check Node.js setup
Write-Host "`nChecking Node.js setup..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
    
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not installed or not accessible" -ForegroundColor Red
}

# Check if dependencies are installed
Write-Host "`nChecking dependencies..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "! Dependencies not installed. Run: npm install" -ForegroundColor Yellow
}

# Check environment configuration
Write-Host "`nChecking environment configuration..." -ForegroundColor Blue
$envFiles = @(".env", ".env.development", ".env.production")
$envFound = $false

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "✓ $envFile exists" -ForegroundColor Green
        $envFound = $true
    }
}

if (-not $envFound) {
    Write-Host "! No environment files found. Copy .env.example to .env" -ForegroundColor Yellow
}

Write-Host "`nVerification completed!" -ForegroundColor Green