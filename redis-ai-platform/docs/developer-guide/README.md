# Developer Guide

This guide will help you get started with developing on the Redis AI Platform, from setting up your development environment to contributing new features.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Performance Optimization](#performance-optimization)
- [Contributing](#contributing)
- [Best Practices](#best-practices)

## Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: [Download here](https://nodejs.org/)
- **Redis 7.0+** with modules:
  - RedisSearch
  - RedisTimeSeries
  - RedisJSON
- **Docker & Docker Compose**: [Install guide](https://docs.docker.com/get-docker/)
- **Git**: [Install guide](https://git-scm.com/downloads)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/redis-ai-platform.git
   cd redis-ai-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # API Configuration
   PORT=3000
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRES_IN=24h
   
   # AI Model APIs
   OPENAI_API_KEY=your-openai-key
   ANTHROPIC_API_KEY=your-anthropic-key
   HUGGINGFACE_API_KEY=your-huggingface-key
   ```

4. **Start Redis with required modules**
   ```bash
   docker-compose up -d redis-stack
   ```

5. **Verify setup**
   ```bash
   node test-setup.js
   ```
   
   This script will test:
   - Redis connection and basic operations
   - RedisSearch module functionality
   - RedisTimeSeries module functionality
   - RedisBloom module functionality

6. **Run database migrations**
   ```bash
   npm run migrate
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

### Frontend Development

The Redis AI Platform includes a modern React frontend built with Vite for fast development and optimized builds.

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start frontend development server**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` (Vite default port).

#### Frontend Features

- **React with TypeScript**: Type-safe component development
- **Vite Build System**: Fast HMR and optimized production builds
- **Modern Fonts**: Inter for UI text and JetBrains Mono for code
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Real-time Features**: WebSocket integration for live collaboration
- **AI Interface Components**: Specialized UI for multi-modal search and AI interactions

#### Frontend Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/              # Page-level components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── main.tsx            # Application entry point
├── public/
│   ├── vite.svg            # Vite logo
│   └── favicon.ico         # Site favicon
├── index.html              # HTML template
├── package.json            # Frontend dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

### Development Tools

#### VS Code Extensions

Install these recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "redhat.vscode-yaml",
    "ms-kubernetes-tools.vscode-kubernetes-tools"
  ]
}
```

#### Debug Configuration

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Project Structure

```
redis-ai-platform/
├── src/                          # Source code
│   ├── api/                      # API layer
│   │   ├── rest/                 # REST endpoints
│   │   ├── graphql/              # GraphQL schema and resolvers
│   │   └── websocket/            # WebSocket handlers
│   ├── services/                 # Business logic
│   │   ├── search/               # Multi-modal search
│   │   ├── ai-routing/           # AI model routing
│   │   ├── workspace/            # Collaborative workspaces
│   │   ├── learning/             # Adaptive learning
│   │   ├── code-intelligence/    # Code analysis and generation
│   │   ├── content-consistency/  # Content management
│   │   ├── optimization/         # Predictive optimization
│   │   ├── adaptive-ui/          # UI adaptation
│   │   ├── performance/          # Performance optimization
│   │   ├── auth/                 # Authentication and authorization
│   │   ├── monitoring/           # System monitoring
│   │   └── embeddings/           # Vector embeddings
│   ├── config/                   # Configuration
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── demo/                     # Demo scripts
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── e2e/                      # End-to-end tests
│   └── performance/              # Performance tests
├── frontend/                     # React frontend application
│   ├── src/                      # React source code
│   ├── public/                   # Static assets
│   ├── index.html                # Main HTML template (Vite entry point)
│   ├── package.json              # Frontend dependencies
│   └── vite.config.ts            # Vite configuration
├── docs/                         # Documentation
├── k8s/                          # Kubernetes manifests
├── terraform/                    # Infrastructure as code
├── scripts/                      # Build and deployment scripts
└── docker-compose.yml            # Local development setup
```

### Key Directories

#### `/src/services/`
Contains the core business logic organized by feature:

- **search/**: Multi-modal search engine with vector similarity
- **ai-routing/**: Intelligent AI model selection and routing
- **workspace/**: Collaborative workspace management
- **learning/**: Adaptive learning and personalization
- **performance/**: Connection pooling, batching, caching

#### `/src/api/`
API layer with multiple interfaces:

- **rest/**: RESTful API endpoints
- **graphql/**: GraphQL schema and resolvers  
- **websocket/**: Real-time WebSocket handlers

#### `/frontend/`
React-based frontend application:

- **src/**: React components and application logic
- **public/**: Static assets and favicon
- **index.html**: Main HTML template with Vite integration
- **package.json**: Frontend-specific dependencies and scripts
- **vite.config.ts**: Vite build configuration

#### `/tests/`
Comprehensive test suite:

- **unit/**: Fast, isolated unit tests
- **integration/**: Service integration tests
- **e2e/**: Full application workflow tests
- **performance/**: Load and performance tests

## Development Workflow

### 1. Feature Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write tests first** (TDD approach)
   ```bash
   # Create test file
   touch tests/services/your-service.test.ts
   
   # Write failing tests
   npm test -- --watch your-service.test.ts
   ```

3. **Implement the feature**
   ```bash
   # Create service file
   touch src/services/your-service.ts
   
   # Implement functionality
   npm run dev
   ```

4. **Run all tests**
   ```bash
   npm test
   ```

5. **Update documentation**
   ```bash
   # Update API docs if needed
   vim docs/api/README.md
   ```

### 2. Code Quality

#### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

#### Type Checking

```bash
# Run TypeScript compiler
npm run type-check

# Watch mode for development
npm run type-check:watch
```

### 3. Testing Strategy

#### Unit Tests
Test individual functions and classes in isolation:

```typescript
// tests/services/search/multi-modal-search.test.ts
import { MultiModalSearch } from '../../../src/services/search/multi-modal-search';

describe('MultiModalSearch', () => {
  let searchEngine: MultiModalSearch;

  beforeEach(() => {
    searchEngine = new MultiModalSearch(mockConfig);
  });

  it('should search across multiple modalities', async () => {
    const results = await searchEngine.search('test query', ['text', 'image']);
    expect(results).toHaveLength(2);
    expect(results[0].type).toBe('text');
  });
});
```

#### Integration Tests
Test service interactions:

```typescript
// tests/integration/search-system.test.ts
describe('Search System Integration', () => {
  it('should index and search content end-to-end', async () => {
    // Index content
    await searchService.indexContent(testContent);
    
    // Search for content
    const results = await searchService.search('test query');
    
    expect(results.total).toBeGreaterThan(0);
  });
});
```

#### Performance Tests
Measure system performance:

```typescript
// tests/performance/search-performance.test.ts
describe('Search Performance', () => {
  it('should handle 1000 concurrent searches', async () => {
    const startTime = Date.now();
    
    const promises = Array(1000).fill(null).map(() => 
      searchService.search('performance test')
    );
    
    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

### 4. Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run performance tests
npm run test:performance
```

## Performance Optimization

### Connection Pooling

Use the built-in connection pool for Redis operations:

```typescript
import { ConnectionPool } from '../services/performance/connection-pool';

const pool = new ConnectionPool({
  minConnections: 5,
  maxConnections: 20,
  acquireTimeoutMs: 5000
});

// Use connection
const redis = await pool.acquire();
try {
  const result = await redis.get('key');
  return result;
} finally {
  pool.release(redis);
}
```

### Request Batching

Batch Redis operations for better throughput:

```typescript
import { RequestBatcher } from '../services/performance/request-batcher';

const batcher = new RequestBatcher({
  maxBatchSize: 100,
  maxWaitTimeMs: 50
});

// Batch requests automatically
const result = await batcher.execute(redis, {
  id: 'req-1',
  operation: 'GET',
  key: 'user:123',
  priority: 1,
  timestamp: Date.now()
});
```

### Intelligent Caching

Use the prefetch service for smart caching:

```typescript
import { PrefetchService } from '../services/performance/prefetch-service';

const prefetch = new PrefetchService({
  enabled: true,
  maxCacheSize: 10000000, // 10MB
  prefetchThreshold: 0.8
});

// Automatically cached and prefetched
const value = await prefetch.get(redis, 'frequently-accessed-key');
```

### Query Optimization

Optimize vector searches:

```typescript
import { QueryOptimizer } from '../services/performance/query-optimizer';

const optimizer = new QueryOptimizer({
  enableQueryRewriting: true,
  enableResultCaching: true,
  maxComplexity: 100
});

// Optimize and execute query
const plan = await optimizer.optimizeVectorSearch(redis, query);
const results = await optimizer.executeOptimizedQuery(redis, plan);
```

## Contributing

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new functionality**
5. **Ensure all tests pass**
6. **Update documentation**
7. **Submit a pull request**

### Commit Message Format

Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(search): add multi-modal vector search
fix(auth): resolve JWT token expiration issue
docs(api): update search endpoint documentation
```

### Code Review Guidelines

- **Functionality**: Does the code work as intended?
- **Tests**: Are there adequate tests?
- **Performance**: Any performance implications?
- **Security**: Are there security concerns?
- **Documentation**: Is documentation updated?
- **Style**: Does it follow project conventions?

## Best Practices

### TypeScript

1. **Use strict type checking**
   ```typescript
   // Good
   interface User {
     id: string;
     name: string;
     email: string;
   }
   
   function getUser(id: string): Promise<User | null> {
     // Implementation
   }
   
   // Avoid
   function getUser(id: any): any {
     // Implementation
   }
   ```

2. **Prefer interfaces over types for object shapes**
   ```typescript
   // Good
   interface SearchOptions {
     limit: number;
     offset: number;
   }
   
   // Less preferred
   type SearchOptions = {
     limit: number;
     offset: number;
   }
   ```

### Error Handling

1. **Use custom error classes**
   ```typescript
   export class ValidationError extends Error {
     constructor(message: string, public field: string) {
       super(message);
       this.name = 'ValidationError';
     }
   }
   ```

2. **Handle errors gracefully**
   ```typescript
   try {
     const result = await riskyOperation();
     return result;
   } catch (error) {
     logger.error('Operation failed:', error);
     throw new ServiceError('Operation failed', error);
   }
   ```

### Async/Await

1. **Prefer async/await over promises**
   ```typescript
   // Good
   async function fetchUserData(id: string): Promise<User> {
     const user = await userService.getUser(id);
     const profile = await profileService.getProfile(id);
     return { ...user, ...profile };
   }
   
   // Avoid
   function fetchUserData(id: string): Promise<User> {
     return userService.getUser(id)
       .then(user => profileService.getProfile(id)
         .then(profile => ({ ...user, ...profile })));
   }
   ```

2. **Handle concurrent operations**
   ```typescript
   // Good - concurrent execution
   const [user, profile, settings] = await Promise.all([
     userService.getUser(id),
     profileService.getProfile(id),
     settingsService.getSettings(id)
   ]);
   
   // Avoid - sequential execution
   const user = await userService.getUser(id);
   const profile = await profileService.getProfile(id);
   const settings = await settingsService.getSettings(id);
   ```

### Performance

1. **Use connection pooling**
2. **Batch database operations**
3. **Implement caching strategies**
4. **Monitor performance metrics**
5. **Profile critical paths**

### Security

1. **Validate all inputs**
2. **Use parameterized queries**
3. **Implement proper authentication**
4. **Follow OWASP guidelines**
5. **Regular security audits**

### Testing

1. **Write tests first (TDD)**
2. **Aim for high test coverage**
3. **Test edge cases**
4. **Use descriptive test names**
5. **Mock external dependencies**

## Debugging

### Common Issues

1. **Redis Connection Issues**
   ```bash
   # Check Redis status
   docker-compose ps redis
   
   # View Redis logs
   docker-compose logs redis
   
   # Test Redis connection
   redis-cli ping
   ```

2. **Performance Issues**
   ```bash
   # Run performance profiler
   npm run profile
   
   # Check memory usage
   npm run memory-usage
   
   # Analyze bundle size
   npm run analyze
   ```

3. **Test Failures**
   ```bash
   # Run tests with verbose output
   npm test -- --verbose
   
   # Run specific test file
   npm test -- search.test.ts
   
   # Debug test with Node inspector
   npm run test:debug
   ```

### Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run type-check      # Run TypeScript compiler

# Database
npm run migrate         # Run database migrations
npm run seed            # Seed database with test data

# Monitoring
npm run monitor         # Start monitoring dashboard
npm run metrics         # View performance metrics
```

## Getting Help

- 📖 **Documentation**: Check the [docs](../README.md) first
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/redis-ai-platform/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/redis-ai-platform/discussions)
- 📧 **Email**: dev-support@redis-ai-platform.com