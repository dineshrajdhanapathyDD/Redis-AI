# Redis Projects Deployment Verification Script
# Usage: .\verify-deployment.ps1 -Project "redis-ai-platform"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("redis-ai-platform", "redis-ai-starter")]
    [string]$Project
)

Write-Host "🔍 Verifying deployment for $Project..." -ForegroundColor Green

# Change to project directory
Set-Location $Project

# Check if required files exist
$requiredFiles = @(
    "package.json",
    "docker-compose.yml",
    "README.md",
    ".env.example"
)

Write-Host "`n📁 Checking required files..." -ForegroundColor Blue
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Check Docker setup
Write-Host "`n🐳 Checking Docker setup..." -ForegroundColor Blue
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker installed: $dockerVersion" -ForegroundColor Green
    
    $dockerComposeVersion = docker-compose --version
    Write-Host "✅ Docker Compose installed: $dockerComposeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not installed or not accessible" -ForegroundColor Red
}

# Check Node.js setup
Write-Host "`n📦 Checking Node.js setup..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    
    $npmVersion = npm --version
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not installed or not accessible" -ForegroundColor Red
}

# Check if dependencies are installed
Write-Host "`n🔧 Checking dependencies..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies not installed. Run: npm install" -ForegroundColor Yellow
}

# Check environment configuration
Write-Host "`n⚙️  Checking environment configuration..." -ForegroundColor Blue
$envFiles = @(".env", ".env.development", ".env.production")
$envFound = $false

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "✅ $envFile exists" -ForegroundColor Green
        $envFound = $true
    }
}

if (-not $envFound) {
    Write-Host "⚠️  No environment files found. Copy .env.example to .env" -ForegroundColor Yellow
}

# Test Redis connection (if running)
Write-Host "`n🔍 Testing Redis connection..." -ForegroundColor Blue
try {
    $redisResponse = redis-cli ping 2>$null
    if ($redisResponse -eq "PONG") {
        Write-Host "✅ Redis is running and accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis not running. Start with: docker-compose up -d redis" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Redis CLI not available or Redis not running" -ForegroundColor Yellow
}

# Check port availability
Write-Host "`n🌐 Checking port availability..." -ForegroundColor Blue
$ports = @(3000, 6379, 8001)

foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "⚠️  Port $port is in use" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Port $port is available" -ForegroundColor Green
        }
    } catch {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

# Project-specific checks
if ($Project -eq "redis-ai-platform") {
    Write-Host "`n🧠 Checking Redis AI Platform specific components..." -ForegroundColor Blue
    
    $platformDirs = @("src", "tests", "frontend", "docs", "k8s")
    foreach ($dir in $platformDirs) {
        if (Test-Path $dir) {
            Write-Host "✅ $dir directory exists" -ForegroundColor Green
        } else {
            Write-Host "❌ $dir directory missing" -ForegroundColor Red
        }
    }
    
    # Check if TypeScript is configured
    if (Test-Path "tsconfig.json") {
        Write-Host "✅ TypeScript configuration exists" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript configuration missing" -ForegroundColor Red
    }
}

if ($Project -eq "redis-ai-starter") {
    Write-Host "`n🚀 Checking Redis AI Starter specific components..." -ForegroundColor Blue
    
    $starterDirs = @("src", "docs")
    foreach ($dir in $starterDirs) {
        if (Test-Path $dir) {
            Write-Host "✅ $dir directory exists" -ForegroundColor Green
        } else {
            Write-Host "❌ $dir directory missing" -ForegroundColor Red
        }
    }
}

# Generate deployment readiness report
Write-Host "`n📋 Deployment Readiness Report:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$readinessScore = 0
$totalChecks = 10

# Calculate readiness score based on checks
if (Test-Path "package.json") { $readinessScore++ }
if (Test-Path "docker-compose.yml") { $readinessScore++ }
if (Test-Path "README.md") { $readinessScore++ }
if (Test-Path ".env.example") { $readinessScore++ }

try {
    docker --version | Out-Null
    $readinessScore++
} catch { }

try {
    node --version | Out-Null
    $readinessScore++
} catch { }

if (Test-Path "node_modules") { $readinessScore++ }

$envFound = $false
foreach ($envFile in @(".env", ".env.development")) {
    if (Test-Path $envFile) {
        $envFound = $true
        break
    }
}
if ($envFound) { $readinessScore++ }

if ($Project -eq "redis-ai-platform") {
    if (Test-Path "src" -and Test-Path "tests" -and Test-Path "frontend") { $readinessScore++ }
    if (Test-Path "tsconfig.json") { $readinessScore++ }
} else {
    if (Test-Path "src") { $readinessScore++ }
    $readinessScore++ # Bonus for starter simplicity
}

$readinessPercentage = [math]::Round(($readinessScore / $totalChecks) * 100, 0)

Write-Host "Project: $Project" -ForegroundColor White
Write-Host "Readiness Score: $readinessScore/$totalChecks ($readinessPercentage%)" -ForegroundColor White

if ($readinessPercentage -ge 90) {
    Write-Host "Status: 🟢 READY FOR DEPLOYMENT" -ForegroundColor Green
    Write-Host "Recommendation: Proceed with deployment" -ForegroundColor Green
} elseif ($readinessPercentage -ge 70) {
    Write-Host "Status: 🟡 MOSTLY READY" -ForegroundColor Yellow
    Write-Host "Recommendation: Address missing components before deployment" -ForegroundColor Yellow
} else {
    Write-Host "Status: 🔴 NOT READY" -ForegroundColor Red
    Write-Host "Recommendation: Complete setup before attempting deployment" -ForegroundColor Red
}

# Next steps recommendations
Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "1. Install dependencies: npm install" -ForegroundColor White
}

if (-not $envFound) {
    Write-Host "2. Create environment file: cp .env.example .env" -ForegroundColor White
    Write-Host "3. Configure API keys in .env file" -ForegroundColor White
}

try {
    $redisResponse = redis-cli ping 2>$null
    if ($redisResponse -ne "PONG") {
        Write-Host "4. Start Redis: docker-compose up -d redis" -ForegroundColor White
    }
} catch {
    Write-Host "4. Start Redis: docker-compose up -d redis" -ForegroundColor White
}

Write-Host "5. Start application: npm run dev" -ForegroundColor White
Write-Host "6. Test deployment: curl http://localhost:3000/api/health" -ForegroundColor White

Write-Host "`n✅ Verification completed!" -ForegroundColor Green