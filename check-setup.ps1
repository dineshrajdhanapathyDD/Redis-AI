param(
    [string]$Project = "redis-ai-platform"
)

Write-Host "Checking setup for $Project..." -ForegroundColor Green

Set-Location $Project

Write-Host "Checking required files..." -ForegroundColor Blue

if (Test-Path "package.json") {
    Write-Host "✓ package.json exists" -ForegroundColor Green
} else {
    Write-Host "✗ package.json missing" -ForegroundColor Red
}

if (Test-Path "docker-compose.yml") {
    Write-Host "✓ docker-compose.yml exists" -ForegroundColor Green
} else {
    Write-Host "✗ docker-compose.yml missing" -ForegroundColor Red
}

if (Test-Path ".env.example") {
    Write-Host "✓ .env.example exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env.example missing" -ForegroundColor Red
}

Write-Host "Checking Docker..." -ForegroundColor Blue
try {
    docker --version
    Write-Host "✓ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not available" -ForegroundColor Red
}

Write-Host "Checking Node.js..." -ForegroundColor Blue
try {
    node --version
    Write-Host "✓ Node.js is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not available" -ForegroundColor Red
}

Write-Host "Setup check completed!" -ForegroundColor Green