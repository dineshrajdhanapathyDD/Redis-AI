# Redis AI Platform Documentation

Welcome to the Redis AI Platform - an innovative application that leverages Redis as a high-performance real-time data layer to enable cutting-edge AI capabilities.

## 📚 Documentation Structure

- [**Simple Server Guide**](./simple-server.md) - Lightweight demo server documentation
- [**API Reference**](./api/README.md) - Complete API documentation with examples
- [**Developer Guide**](./developer-guide/README.md) - Getting started and development workflows
- [**Architecture Guide**](./architecture/README.md) - System design and component overview
- [**Deployment Guide**](./deployment/README.md) - Production deployment instructions
- [**Troubleshooting**](./troubleshooting/README.md) - Common issues and solutions
- [**Examples**](./examples/README.md) - Code examples and use cases
- [**SDK Reference**](./sdk/README.md) - Client SDK documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Redis 7.0+ with RedisSearch and RedisTimeSeries modules
- Docker and Docker Compose (for local development)

### Installation

#### Option A: Simple Server (Quick Demo)

For quick testing and demonstrations:

```bash
# Clone the repository
git clone https://github.com/your-org/redis-ai-platform.git
cd redis-ai-platform

# Install minimal dependencies
npm install express cors redis

# Start Redis with required modules
docker-compose up -d redis-stack

# Run the simple server
node simple-server.js
```

Access the web dashboard at `http://localhost:3000`

#### Option B: Full Development Environment

```bash
# Clone the repository
git clone https://github.com/your-org/redis-ai-platform.git
cd redis-ai-platform

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start Redis with required modules
docker-compose up -d redis-stack

# Verify setup with automated test script
node test-setup.js

# Run the application
npm run dev
```

### First API Call

#### Simple Server API

```bash
# Health check
curl http://localhost:3000/api/health

# Get Redis statistics
curl http://localhost:3000/api/stats

# Search documents
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "redis search",
    "limit": 10
  }'

# Add a document
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Redis",
    "content": "Redis is an in-memory data structure store",
    "category": "tutorial"
  }'
```

#### Full Platform API

```bash
# Health check
curl http://localhost:3000/api/health

# Multi-modal search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence",
    "modalities": ["text", "image"],
    "limit": 10
  }'
```

## 🏗️ Architecture Overview

The Redis AI Platform consists of several interconnected modules:

- **Multi-Modal Search Engine**: Natural language search across text, images, audio, and code
- **AI Model Router**: Intelligent routing to optimal AI models based on real-time metrics
- **Collaborative Workspace Manager**: Shared AI contexts and knowledge graphs
- **Adaptive Learning System**: Personalizes experiences through behavioral analysis
- **Code Intelligence Engine**: AI-powered code analysis and generation
- **Content Consistency Manager**: Brand consistency across multi-platform content
- **Predictive Optimization Engine**: Auto-optimizes system performance
- **Adaptive UI Controller**: Dynamically adjusts interface based on user patterns

## 🔧 Key Features

### Multi-Modal AI Search
Search across different content types using natural language queries with vector similarity matching.

### Intelligent Model Routing
Automatically route requests to the best AI model based on real-time performance metrics and request complexity.

### Collaborative AI Workspaces
Share AI contexts and insights across team members with real-time synchronization.

### Adaptive Learning
System learns from user behavior and adapts responses in real-time for personalized experiences.

### Performance Optimization
Built-in connection pooling, request batching, intelligent prefetching, and query optimization.

## 📊 Performance Characteristics

- **Sub-100ms** response times for vector searches
- **10-20x** throughput improvement through request batching
- **50-90%** latency reduction via intelligent caching
- **Real-time** collaboration with Redis pub/sub
- **Automatic** scaling and optimization

## 🛠️ Development Tools

### Interactive Demos
```bash
# Run all feature demos
npm run demo

# Specific feature demos
npm run demo:search
npm run demo:routing
npm run demo:workspace
npm run demo:performance
```

### Testing
```bash
# Verify Redis setup and modules
node test-setup.js

# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
```

### Monitoring
```bash
# Start monitoring dashboard
npm run monitor

# View performance metrics
npm run metrics

# Generate performance report
npm run report
```

## 🔗 Links

- [GitHub Repository](https://github.com/your-org/redis-ai-platform)
- [Issue Tracker](https://github.com/your-org/redis-ai-platform/issues)
- [Discussions](https://github.com/your-org/redis-ai-platform/discussions)
- [Changelog](./CHANGELOG.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🤝 Support

- 📧 Email: support@redis-ai-platform.com
- 💬 Discord: [Join our community](https://discord.gg/redis-ai-platform)
- 📖 Documentation: [docs.redis-ai-platform.com](https://docs.redis-ai-platform.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-org/redis-ai-platform/issues)