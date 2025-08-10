# Redis AI Platform - Quick Start Script
# Usage: .\quick-start.ps1

Write-Host "🚀 Starting Redis AI Platform..." -ForegroundColor Green

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not available. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start Redis Stack
Write-Host "📦 Starting Redis Stack..." -ForegroundColor Blue
docker-compose up -d redis-stack

# Wait for Redis to be ready
Write-Host "⏳ Waiting for Redis to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test Redis connection
Write-Host "🔍 Testing Redis connection..." -ForegroundColor Blue
try {
    $result = docker exec redis-ai-platform-stack redis-cli ping
    if ($result -eq "PONG") {
        Write-Host "✅ Redis is ready!" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis connection failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Could not connect to Redis" -ForegroundColor Red
    exit 1
}

# Run setup verification
Write-Host "🧪 Running setup verification..." -ForegroundColor Blue
node test-setup.js

Write-Host "`n🎉 Redis AI Platform is ready!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run 'npm run dev' to start development server" -ForegroundColor White
Write-Host "   2. Visit http://localhost:8001 for RedisInsight" -ForegroundColor White
Write-Host "   3. Run 'npm run demo' for interactive demos" -ForegroundColor White
Write-Host "   4. Check local-environment-status.md for details" -ForegroundColor White