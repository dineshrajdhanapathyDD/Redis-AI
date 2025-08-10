# Environment Setup Script for Redis Projects
# Usage: .\setup-environment.ps1 -Environment "development"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment
)

Write-Host "🔧 Setting up $Environment environment..." -ForegroundColor Green

# Create environment-specific directories
$envDirs = @(
    "logs",
    "data",
    "ssl",
    "monitoring"
)

foreach ($dir in $envDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "📁 Created directory: $dir" -ForegroundColor Blue
    }
}

# Generate environment file
$envFile = ".env.$Environment"
if (-not (Test-Path $envFile)) {
    Write-Host "📝 Creating $envFile..." -ForegroundColor Blue
    
    $envContent = @"
# Redis AI Platform - $Environment Environment
NODE_ENV=$Environment
PORT=3000
LOG_LEVEL=info

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$(New-Guid | Select-Object -ExpandProperty Guid)

# AI Model APIs
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
HUGGINGFACE_API_KEY=your-huggingface-api-key-here

# Security
JWT_SECRET=$(New-Guid | Select-Object -ExpandProperty Guid)
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=redis://localhost:6379

# Performance
ENABLE_PERFORMANCE_OPTIMIZATION=true
CONNECTION_POOL_MIN=5
CONNECTION_POOL_MAX=20
CACHE_TTL=3600

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
GRAFANA_PASSWORD=$(New-Guid | Select-Object -ExpandProperty Guid)

# Feature Flags
ENABLE_MULTI_MODAL_SEARCH=true
ENABLE_AI_ROUTING=true
ENABLE_COLLABORATIVE_WORKSPACE=true
ENABLE_ADAPTIVE_LEARNING=true
ENABLE_CODE_INTELLIGENCE=true
ENABLE_CONTENT_CONSISTENCY=true
ENABLE_PREDICTIVE_OPTIMIZATION=true
ENABLE_ADAPTIVE_UI=true

# External Services
WEBHOOK_URL=https://your-webhook-url.com
NOTIFICATION_EMAIL=admin@your-domain.com

# SSL/TLS (for production)
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
"@

    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ Created $envFile" -ForegroundColor Green
    Write-Host "⚠️  Please update the API keys and other sensitive values" -ForegroundColor Yellow
}

# Generate SSL certificates for production
if ($Environment -eq "production") {
    Write-Host "🔐 Generating SSL certificates..." -ForegroundColor Blue
    
    if (-not (Test-Path "ssl/cert.pem")) {
        # Generate self-signed certificate (replace with proper certificates in production)
        $certParams = @{
            Subject = "CN=redis-ai-platform.local"
            KeyAlgorithm = "RSA"
            KeyLength = 2048
            NotAfter = (Get-Date).AddYears(1)
            CertStoreLocation = "Cert:\CurrentUser\My"
        }
        
        try {
            $cert = New-SelfSignedCertificate @certParams
            $certPath = "ssl/cert.pem"
            $keyPath = "ssl/key.pem"
            
            # Export certificate
            Export-Certificate -Cert $cert -FilePath $certPath -Type CERT
            
            Write-Host "✅ SSL certificates generated" -ForegroundColor Green
            Write-Host "⚠️  Replace with proper certificates for production use" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Failed to generate SSL certificates: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Create monitoring configuration
$monitoringDir = "monitoring"
if (-not (Test-Path "$monitoringDir/prometheus.yml")) {
    Write-Host "📊 Creating monitoring configuration..." -ForegroundColor Blue
    
    $prometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'redis-ai-platform'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
"@

    $prometheusConfig | Out-File -FilePath "$monitoringDir/prometheus.yml" -Encoding UTF8
    Write-Host "✅ Created Prometheus configuration" -ForegroundColor Green
}

# Create Docker Compose override for environment
$dockerOverride = "docker-compose.$Environment.yml"
if (-not (Test-Path $dockerOverride)) {
    Write-Host "🐳 Creating Docker Compose override..." -ForegroundColor Blue
    
    $dockerConfig = @"
version: '3.8'

services:
  redis:
    environment:
      - REDIS_PASSWORD=`${REDIS_PASSWORD}
    volumes:
      - ./data:/data
      - ./logs:/var/log/redis

  api:
    environment:
      - NODE_ENV=$Environment
    env_file:
      - .env.$Environment
    volumes:
      - ./logs:/app/logs

  frontend:
    environment:
      - NODE_ENV=$Environment
"@

    if ($Environment -eq "production") {
        $dockerConfig += @"

    volumes:
      - ./ssl:/etc/nginx/ssl
"@
    }

    $dockerConfig | Out-File -FilePath $dockerOverride -Encoding UTF8
    Write-Host "✅ Created Docker Compose override" -ForegroundColor Green
}

# Create backup script
$backupScript = "scripts/backup-$Environment.ps1"
if (-not (Test-Path $backupScript)) {
    Write-Host "💾 Creating backup script..." -ForegroundColor Blue
    
    $backupContent = @"
# Backup script for $Environment environment
param(
    [string]`$BackupPath = "./backups/`$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
)

Write-Host "📦 Creating backup..." -ForegroundColor Green

# Create backup directory
New-Item -ItemType Directory -Path `$BackupPath -Force

# Backup Redis data
Write-Host "💾 Backing up Redis data..." -ForegroundColor Blue
redis-cli --rdb `$BackupPath/redis-dump.rdb

# Backup application data
Write-Host "📁 Backing up application data..." -ForegroundColor Blue
Copy-Item -Recurse ./data `$BackupPath/
Copy-Item -Recurse ./logs `$BackupPath/

# Create backup manifest
`$manifest = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    environment = "$Environment"
    version = (Get-Content package.json | ConvertFrom-Json).version
    files = Get-ChildItem -Recurse `$BackupPath | Select-Object Name, Length
}

`$manifest | ConvertTo-Json -Depth 3 | Out-File "`$BackupPath/manifest.json"

Write-Host "✅ Backup completed: `$BackupPath" -ForegroundColor Green
"@

    New-Item -ItemType Directory -Path "scripts" -Force
    $backupContent | Out-File -FilePath $backupScript -Encoding UTF8
    Write-Host "✅ Created backup script" -ForegroundColor Green
}

# Create health check script
$healthScript = "scripts/health-check-$Environment.ps1"
if (-not (Test-Path $healthScript)) {
    Write-Host "🏥 Creating health check script..." -ForegroundColor Blue
    
    $healthContent = @"
# Health check script for $Environment environment

Write-Host "🏥 Performing health checks..." -ForegroundColor Green

# Check Redis connection
Write-Host "🔍 Checking Redis connection..." -ForegroundColor Blue
try {
    `$redisResponse = redis-cli ping
    if (`$redisResponse -eq "PONG") {
        Write-Host "✅ Redis is healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Redis connection failed: `$(`$_.Exception.Message)" -ForegroundColor Red
}

# Check API health
Write-Host "🔍 Checking API health..." -ForegroundColor Blue
try {
    `$apiResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 10
    if (`$apiResponse.status -eq "healthy") {
        Write-Host "✅ API is healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API health check returned: `$(`$apiResponse.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API health check failed: `$(`$_.Exception.Message)" -ForegroundColor Red
}

# Check disk space
Write-Host "🔍 Checking disk space..." -ForegroundColor Blue
`$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Select-Object DeviceID, @{Name="FreeSpace(GB)";Expression={[math]::Round(`$_.FreeSpace/1GB,2)}}
`$disk | ForEach-Object {
    if (`$_."FreeSpace(GB)" -lt 1) {
        Write-Host "⚠️  Low disk space on `$(`$_.DeviceID): `$(`$_.'FreeSpace(GB)')GB" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Disk space OK on `$(`$_.DeviceID): `$(`$_.'FreeSpace(GB)')GB" -ForegroundColor Green
    }
}

Write-Host "🏥 Health check completed" -ForegroundColor Green
"@

    $healthContent | Out-File -FilePath $healthScript -Encoding UTF8
    Write-Host "✅ Created health check script" -ForegroundColor Green
}

# Display setup summary
Write-Host "`n📋 Environment Setup Summary:" -ForegroundColor Cyan
Write-Host "   Environment: $Environment" -ForegroundColor White
Write-Host "   Configuration: .env.$Environment" -ForegroundColor White
Write-Host "   Docker Override: docker-compose.$Environment.yml" -ForegroundColor White
Write-Host "   Backup Script: $backupScript" -ForegroundColor White
Write-Host "   Health Check: $healthScript" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Edit .env.$Environment with your API keys" -ForegroundColor White
Write-Host "   2. Run: docker-compose -f docker-compose.yml -f docker-compose.$Environment.yml up -d" -ForegroundColor White
Write-Host "   3. Test: .\$healthScript" -ForegroundColor White

Write-Host "`n✅ Environment setup completed!" -ForegroundColor Green