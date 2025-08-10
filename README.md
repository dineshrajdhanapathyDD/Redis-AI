# Redis AI Platform

An innovative AI-powered application that leverages Redis as a real-time data layer to accelerate cutting-edge AI workflows. The platform showcases unique use cases including multi-modal AI search, dynamic AI model routing, collaborative AI workspaces, and adaptive learning systems.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Redis Stack (automatically started with Docker Compose)

### Installation

#### Option A: Simple Server (Quick Demo)

For quick testing and demonstrations:

```bash
cd redis-ai-platform
npm install express cors redis
docker-compose up -d redis-stack
node simple-server.js
```

Access the web dashboard at `http://localhost:3001`

#### Option B: Full Development Environment

1. **Clone and Setup**
   ```bash
   cd redis-ai-platform
   npm install
   cp .env.example .env
   ```

2. **Start Redis Stack**
   ```bash
   docker-compose up -d redis-stack
   ```

3. **Verify Setup**
   ```bash
   node test-setup.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🎯 Quick Demo Options

### Simple Server (Web Dashboard)

Experience Redis AI Platform through a web interface:

```bash
node simple-server.js
```

Features:
- **Web Dashboard**: Real-time Redis monitoring at `http://localhost:3001`
- **Document Search**: Interactive search using RedisSearch
- **Statistics Visualization**: Live Redis performance metrics
- **Document Management**: Add and manage searchable documents
- **API Endpoints**: RESTful API for integration testing

### Command Line Demo

Want to see Redis AI Platform capabilities in action? Run the simple demo:

```bash
node simple-demo.js
```

This standalone demo showcases:
- **Basic Redis Operations**: Key-value storage and retrieval
- **Full-text Search**: Document indexing and search with RedisSearch
- **Time Series Data**: Metrics collection and querying with RedisTimeSeries
- **Probabilistic Data Structures**: Bloom filters with RedisBloom
- **Real-time Processing**: Live data operations and analysis

Both demos run independently and don't require the full application setup, making them perfect for quick exploration of Redis AI capabilities.

## 🧪 Setup Verification

The `test-setup.js` script provides comprehensive verification of your Redis AI Platform environment:

### What it Tests
- **Redis Connection**: Basic connectivity and operations
- **RedisSearch Module**: Full-text search and indexing capabilities
- **RedisTimeSeries Module**: Time-series data storage and retrieval
- **RedisBloom Module**: Probabilistic data structures (Bloom filters)

### Running the Test
```bash
node test-setup.js
```

### Expected Output
```
🔍 Testing Redis AI Platform Setup...

1. Testing Redis connection...
✅ Redis connection successful: Redis AI Platform

2. Testing RedisSearch module...
✅ RedisSearch module working

3. Testing RedisTimeSeries module...
✅ RedisTimeSeries module working

4. Testing RedisBloom module...
✅ RedisBloom module working, item exists: true

🎉 Setup verification completed successfully!

📋 Summary:
   ✅ Redis connection: Working
   ✅ RedisSearch module: Available
   ✅ RedisTimeSeries module: Available
   ✅ RedisBloom module: Available

🚀 Your Redis AI Platform is ready for development!
```

### Troubleshooting

If the test fails, check:

1. **Redis Stack is Running**
   ```bash
   docker-compose ps
   ```

2. **Redis Stack Logs**
   ```bash
   docker-compose logs redis-stack
   ```

3. **Port Availability**
   - Ensure port 6379 is not in use by another Redis instance
   - Check firewall settings

4. **Module Loading**
   - Verify Redis Stack image includes all required modules
   - Check redis.conf configuration

## 🏗️ Architecture

The Redis AI Platform consists of several interconnected modules:

- **Multi-Modal Search Engine**: Handles text, image, audio, and code search using vector embeddings
- **AI Model Router**: Intelligently routes requests to optimal AI models based on real-time metrics
- **Collaborative Workspace Manager**: Manages shared AI contexts and knowledge graphs
- **Adaptive Learning System**: Personalizes user experiences through behavioral analysis
- **Code Intelligence Engine**: Provides AI-powered code analysis and generation
- **Content Consistency Manager**: Ensures brand consistency across multi-platform content
- **Predictive Optimization Engine**: Auto-optimizes system performance
- **Adaptive UI Controller**: Dynamically adjusts interface based on user patterns

## 📊 Performance Characteristics

- **Response Time**: Sub-100ms for vector searches
- **Throughput**: 10-20x improvement with request batching
- **Scalability**: Horizontal scaling with Kubernetes
- **Availability**: 99.9% uptime with proper deployment
- **Memory Usage**: Optimized Redis configurations
- **CPU Usage**: Efficient multi-threading and async operations

## 🔧 Configuration

### Environment Variables
Key configuration options in `.env`:

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
```

### Redis Modules
The platform requires these Redis modules:
- **RedisSearch**: Vector similarity search and full-text search
- **RedisTimeSeries**: Time-series data for performance metrics
- **RedisBloom**: Probabilistic data structures for optimization
- **RedisJSON**: JSON document storage and manipulation

## 🧪 Testing

### Setup Verification
```bash
node test-setup.js
```

### Full Test Suite
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
```

### Interactive Demos
```bash
# Web-based demo server
node simple-server.js

# Simple Redis capabilities demo (standalone)
node simple-demo.js

# All features demo
npm run demo

# Specific feature demos
npm run demo:search
npm run demo:routing
npm run demo:workspace
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale api=3
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check status
kubectl get pods -n redis-ai-platform
```

### Cloud Deployments
- **AWS EKS**: Terraform configurations included
- **Google GKE**: GKE-specific manifests available
- **Azure AKS**: AKS deployment scripts provided

## 📚 Documentation

- [Simple Server Guide](docs/simple-server.md) - Lightweight demo server documentation
- [API Reference](docs/api/README.md)
- [Developer Guide](docs/developer-guide/README.md)
- [Architecture Guide](docs/architecture/README.md)
- [Deployment Guide](docs/deployment/README.md)

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Use GitHub issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check project-specific docs
- **Community**: Join our Discord server

---

**Built with ❤️ using Redis and modern AI technologies**

*Empowering developers to build intelligent, real-time applications.*