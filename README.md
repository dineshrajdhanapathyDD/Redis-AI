# Redis Projects Collection

This folder contains all Redis-related projects and implementations, organized for easy development and deployment.

## 📁 Project Structure

```
redis-projects/
├── redis-ai-platform/          # Main Redis AI Platform (Production-ready)
│   ├── src/                     # Source code
│   ├── tests/                   # Test suites
│   ├── frontend/                # React frontend
│   ├── docs/                    # Documentation
│   ├── k8s/                     # Kubernetes manifests
│   ├── terraform/               # Infrastructure as code
│   ├── tools/                   # Developer tools
│   └── scripts/                 # Deployment scripts
├── redis-ai-starter/            # Simplified starter template
│   ├── src/                     # Basic implementation
│   ├── docs/                    # Getting started docs
│   └── docker-compose.yml       # Local development setup
└── deployment/                  # Shared deployment resources
    ├── docker/                  # Docker configurations
    ├── kubernetes/              # K8s shared resources
    └── scripts/                 # Deployment automation
```

## 🚀 Projects Overview

### 1. Redis AI Platform (Production)

**Location**: `redis-ai-platform/`

A comprehensive, enterprise-ready AI platform built on Redis with:

- Multi-modal search engine
- AI model routing
- Collaborative workspaces
- Performance optimization
- Real-time monitoring
- Enterprise security

**Quick Start Options**:

#### Option A: Simple Server (Lightweight Demo)

Perfect for quick testing and demonstrations:

```bash
cd redis-ai-platform
npm install express cors redis
docker-compose up -d redis-stack
node simple-server.js
```

**Features**:

- Web-based dashboard at `http://localhost:3001`
- Real-time Redis health monitoring
- Document search with RedisSearch
- Document management system
- Redis statistics visualization
- Time series metrics support

**API Endpoints**:

- `GET /api/health` - System health check
- `GET /api/stats` - Redis performance statistics
- `POST /api/search` - Search documents using RedisSearch
- `POST /api/documents` - Add new documents
- `GET /api/metrics` - Time series metrics data

#### Option B: Full Development Environment
```bash
cd redis-ai-platform
npm install
cp .env.example .env
docker-compose up -d redis-stack

# Verify setup with automated test script
node test-setup.js

npm run dev
```

### 2. Redis AI Starter (Learning/Prototyping)

**Location**: `redis-ai-starter/`

A simplified version perfect for:

- Learning Redis AI concepts
- Rapid prototyping
- Educational purposes
- Quick demos

**Quick Start**:

```bash
cd redis-ai-starter
npm install
docker-compose up -d
npm start
```

## 🛠️ Development Workflow

### Local Development

```bash
# Choose your project
cd redis-ai-platform  # or redis-ai-starter

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start Redis with required modules
docker-compose up -d redis

# Run tests
npm test

# Start development server
npm run dev
```

### Testing

#### Setup Verification

Before running the full test suite, verify your Redis setup:

```bash
# Verify Redis AI Platform setup
cd redis-ai-platform
node test-setup.js
```

The setup verification script tests:

- Redis connection and basic operations
- RedisSearch module functionality
- RedisTimeSeries module functionality  
- RedisBloom module functionality

#### Full Test Suite

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Performance testing
npm run test:performance
```

## 🚢 Deployment Options

### 1. Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale api=3
```

### 2. Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check status
kubectl get pods -n redis-ai-platform
```

### 3. Cloud Deployments

#### AWS EKS

```bash
# Set up EKS cluster
terraform init
terraform plan
terraform apply

# Deploy application
kubectl apply -f k8s/
```

#### Google GKE

```bash
# Create GKE cluster
gcloud container clusters create redis-ai-cluster

# Deploy application
kubectl apply -f k8s/
```

#### Azure AKS

```bash
# Create AKS cluster
az aks create --resource-group myResourceGroup --name redis-ai-cluster

# Deploy application
kubectl apply -f k8s/
```

## 📊 Performance Benchmarks

### Redis AI Platform

- **Response Time**: Sub-100ms for vector searches
- **Throughput**: 10-20x improvement with batching
- **Latency Reduction**: 50-90% via intelligent caching
- **Uptime**: 99.9% with proper deployment

### Redis AI Starter

- **Response Time**: Sub-200ms for basic operations
- **Throughput**: Suitable for development and small-scale testing
- **Resource Usage**: Minimal footprint for learning

## 🔧 Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password

# AI Models
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Security
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Redis Configuration

Both projects include optimized Redis configurations:

- Memory optimization
- Persistence settings
- Module loading (RedisSearch, RedisTimeSeries, etc.)
- Security settings

## 📚 Documentation

### Redis AI Platform

- [📖 API Reference](redis-ai-platform/docs/api/README.md)
- [🛠️ Developer Guide](redis-ai-platform/docs/developer-guide/README.md)
- [🏗️ Architecture Guide](redis-ai-platform/docs/architecture/README.md)
- [🚀 Deployment Guide](redis-ai-platform/docs/deployment/README.md)

### Redis AI Starter

- [🚀 Quick Start](redis-ai-starter/README.md)
- [📖 API Documentation](redis-ai-starter/docs/api.md)
- [⚙️ Configuration Guide](redis-ai-starter/docs/configuration.md)

## 🧪 Demo & Testing

### Interactive Demos

```bash
# Redis AI Platform demos
cd redis-ai-platform
node simple-demo.js            # Simple Redis capabilities demo
npm run demo                    # All features
npm run demo:search            # Multi-modal search
npm run demo:routing           # AI model routing
npm run demo:workspace         # Collaborative workspaces

# Redis AI Starter demos
cd redis-ai-starter
npm run demo                   # Basic features
```

### Load Testing

```bash
# Performance testing
npm run test:performance

# Load testing with custom parameters
npm run load-test -- --users=100 --duration=60s
```

## 🔐 Security

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Rate limiting
- Input validation

### Data Protection

- Encryption at rest and in transit
- Secure Redis configurations
- Audit logging
- Security headers

## 📈 Monitoring & Observability

### Health Monitoring

```bash
# Check system health
curl http://localhost:3001/api/health

# Detailed health check
curl http://localhost:3001/api/health/detailed
```

### Metrics & Logging

- Prometheus-compatible metrics
- Structured logging
- Distributed tracing
- Real-time dashboards
- Alerting system

## 🤝 Contributing

1. Choose the appropriate project for your contribution
2. Follow the project-specific contributing guidelines
3. Ensure all tests pass
4. Submit a pull request

### Development Standards

- TypeScript strict mode
- ESLint + Prettier
- Comprehensive testing
- Documentation updates
- Security best practices

## 📄 License

All projects in this collection are licensed under the MIT License.

## 🔗 Quick Links

- [Redis AI Platform Demo](http://localhost:3001) (when running)
- [Redis AI Starter Demo](http://localhost:3002) (when running)
- [Documentation Portal](redis-ai-platform/docs/)
- [API Testing Tools](redis-ai-platform/tools/)

## 🆘 Support

- **Issues**: Use GitHub issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check project-specific docs
- **Community**: Join our Discord server

---

**Built with ❤️ using Redis and modern AI technologies**

*Empowering developers to build intelligent, real-time applications.*
