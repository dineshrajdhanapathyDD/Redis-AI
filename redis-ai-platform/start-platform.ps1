# Redis AI Platform - Start Script
Write-Host "Starting Redis AI Platform..." -ForegroundColor Green

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "Docker is available" -ForegroundColor Green
} catch {
    Write-Host "Docker is not available. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start Redis Stack
Write-Host "Starting Redis Stack..." -ForegroundColor Blue
docker-compose up -d redis-stack

# Wait for Redis
Write-Host "Waiting for Redis..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test connection
Write-Host "Testing Redis connection..." -ForegroundColor Blue
try {
    $result = docker exec redis-ai-platform-stack redis-cli ping
    if ($result -eq "PONG") {
        Write-Host "Redis is ready!" -ForegroundColor Green
    }
} catch {
    Write-Host "Redis connection failed" -ForegroundColor Red
    exit 1
}

# Run demo
Write-Host "Running demo..." -ForegroundColor Blue
node simple-demo.js

Write-Host "Redis AI Platform is ready!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run demos: node simple-demo.js" -ForegroundColor White
Write-Host "  2. Visit RedisInsight: http://localhost:8001" -ForegroundColor White
Write-Host "  3. Check status: node test-setup.js" -ForegroundColor White