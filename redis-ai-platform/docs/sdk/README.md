# SDK Reference

The Redis AI Platform provides SDKs for multiple programming languages to make integration easy and efficient.

## Available SDKs

- [JavaScript/TypeScript SDK](#javascripttypescript-sdk)
- [Python SDK](#python-sdk)
- [React Hooks](#react-hooks)
- [CLI Tools](#cli-tools)

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @redis-ai-platform/sdk
```

### Quick Start

```typescript
import { RedisAIPlatform } from '@redis-ai-platform/sdk';

const client = new RedisAIPlatform({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.redis-ai-platform.com'
});

// Multi-modal search
const results = await client.search({
  query: 'machine learning algorithms',
  modalities: ['text', 'image'],
  limit: 10
});

console.log(`Found ${results.total} results`);
```

### Configuration Options

```typescript
interface RedisAIPlatformConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  redis?: {
    host?: string;
    port?: number;
    password?: string;
  };
  performance?: {
    enableCaching?: boolean;
    enableBatching?: boolean;
    enablePrefetching?: boolean;
  };
}

const client = new RedisAIPlatform({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.redis-ai-platform.com',
  timeout: 30000,
  retries: 3,
  performance: {
    enableCaching: true,
    enableBatching: true,
    enablePrefetching: true
  }
});
```

### Search API

#### Basic Search

```typescript
const results = await client.search({
  query: 'artificial intelligence',
  modalities: ['text'],
  limit: 20
});
```

#### Advanced Search

```typescript
const results = await client.search({
  query: 'neural networks',
  modalities: ['text', 'image', 'code'],
  limit: 50,
  filters: {
    category: 'technology',
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    },
    tags: ['deep-learning', 'ai']
  },
  options: {
    includeMetadata: true,
    highlightMatches: true,
    crossModal: true,
    boostRecent: true
  }
});
```

#### Search with Embeddings

```typescript
// Search using custom embeddings
const results = await client.searchByEmbedding({
  embedding: [0.1, 0.2, 0.3, ...], // Your embedding vector
  modalities: ['text', 'image'],
  limit: 10,
  threshold: 0.8
});
```

### AI Model Routing

#### Route Request

```typescript
const routing = await client.routeRequest({
  type: 'text-generation',
  complexity: 'high',
  context: 'code-generation',
  requirements: {
    maxLatency: 2000,
    minAccuracy: 0.9,
    costOptimized: false
  }
});

console.log(`Selected model: ${routing.selectedModel.id}`);
console.log(`Estimated cost: $${routing.estimatedCost}`);
```

#### Execute with Routing

```typescript
const response = await client.executeWithRouting({
  request: {
    type: 'text-generation',
    complexity: 'medium'
  },
  prompt: 'Write a function to calculate fibonacci numbers',
  parameters: {
    temperature: 0.7,
    maxTokens: 500
  }
});
```

### Workspace Management

#### Create Workspace

```typescript
const workspace = await client.createWorkspace({
  name: 'AI Research Project',
  description: 'Collaborative space for AI research',
  settings: {
    visibility: 'private',
    allowGuests: false
  }
});
```

#### Manage Knowledge

```typescript
// Add knowledge
const knowledge = await client.addKnowledge(workspace.id, {
  type: 'insight',
  title: 'Key Finding',
  content: 'We discovered that...',
  tags: ['research', 'breakthrough']
});

// Search knowledge
const knowledgeResults = await client.searchKnowledge(workspace.id, {
  query: 'neural architecture',
  limit: 10
});
```

### Real-time Features

#### WebSocket Connection

```typescript
const wsClient = await client.connectWebSocket();

// Join workspace for real-time collaboration
await wsClient.joinWorkspace('workspace-123');

// Listen for events
wsClient.on('knowledge_added', (knowledge) => {
  console.log('New knowledge:', knowledge.title);
});

wsClient.on('user_joined', (user) => {
  console.log(`${user.name} joined the workspace`);
});

// Send real-time updates
wsClient.sendCursorPosition({ x: 100, y: 200 });
```

### Error Handling

```typescript
try {
  const results = await client.search({ query: 'test' });
} catch (error) {
  if (error instanceof RedisAIError) {
    console.error(`API Error: ${error.code} - ${error.message}`);
    
    // Handle specific error types
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Implement backoff strategy
        await new Promise(resolve => setTimeout(resolve, 5000));
        break;
      case 'AUTHENTICATION_FAILED':
        // Refresh token
        await client.refreshToken();
        break;
    }
  }
}
```

### Performance Optimization

#### Connection Pooling

```typescript
const client = new RedisAIPlatform({
  apiKey: 'your-api-key',
  performance: {
    connectionPool: {
      minConnections: 5,
      maxConnections: 20
    }
  }
});
```

#### Request Batching

```typescript
// Batch multiple requests
const batchResults = await client.batch([
  { method: 'search', params: { query: 'AI' } },
  { method: 'search', params: { query: 'ML' } },
  { method: 'routeRequest', params: { type: 'text-generation' } }
]);
```

#### Caching

```typescript
// Enable automatic caching
const client = new RedisAIPlatform({
  apiKey: 'your-api-key',
  performance: {
    enableCaching: true,
    cacheConfig: {
      ttl: 300000, // 5 minutes
      maxSize: 1000
    }
  }
});
```

## Python SDK

### Installation

```bash
pip install redis-ai-platform
```

### Quick Start

```python
from redis_ai_platform import RedisAIPlatform

client = RedisAIPlatform(
    api_key="your-api-key",
    base_url="https://api.redis-ai-platform.com"
)

# Multi-modal search
results = client.search(
    query="machine learning algorithms",
    modalities=["text", "image"],
    limit=10
)

print(f"Found {results['total']} results")
```

### Configuration

```python
client = RedisAIPlatform(
    api_key="your-api-key",
    base_url="https://api.redis-ai-platform.com",
    timeout=30,
    retries=3,
    performance={
        "enable_caching": True,
        "enable_batching": True,
        "enable_prefetching": True
    }
)
```

### Search Operations

```python
# Basic search
results = client.search(
    query="artificial intelligence",
    modalities=["text"],
    limit=20
)

# Advanced search with filters
results = client.search(
    query="neural networks",
    modalities=["text", "image", "code"],
    limit=50,
    filters={
        "category": "technology",
        "date_range": {
            "start": "2024-01-01",
            "end": "2024-12-31"
        },
        "tags": ["deep-learning", "ai"]
    },
    options={
        "include_metadata": True,
        "highlight_matches": True,
        "cross_modal": True
    }
)

# Search with custom embeddings
results = client.search_by_embedding(
    embedding=[0.1, 0.2, 0.3, ...],
    modalities=["text", "image"],
    limit=10,
    threshold=0.8
)
```

### AI Model Routing

```python
# Route request to optimal model
routing = client.route_request({
    "type": "text-generation",
    "complexity": "high",
    "context": "code-generation",
    "requirements": {
        "max_latency": 2000,
        "min_accuracy": 0.9,
        "cost_optimized": False
    }
})

print(f"Selected model: {routing['selected_model']['id']}")

# Execute with routing
response = client.execute_with_routing(
    request={
        "type": "text-generation",
        "complexity": "medium"
    },
    prompt="Write a function to calculate fibonacci numbers",
    parameters={
        "temperature": 0.7,
        "max_tokens": 500
    }
)
```

### Workspace Management

```python
# Create workspace
workspace = client.create_workspace({
    "name": "AI Research Project",
    "description": "Collaborative space for AI research",
    "settings": {
        "visibility": "private",
        "allow_guests": False
    }
})

# Add knowledge
knowledge = client.add_knowledge(workspace["id"], {
    "type": "insight",
    "title": "Key Finding",
    "content": "We discovered that...",
    "tags": ["research", "breakthrough"]
})

# Search knowledge
knowledge_results = client.search_knowledge(workspace["id"], {
    "query": "neural architecture",
    "limit": 10
})
```

### Async Support

```python
import asyncio
from redis_ai_platform import AsyncRedisAIPlatform

async def main():
    client = AsyncRedisAIPlatform(api_key="your-api-key")
    
    # Async search
    results = await client.search(
        query="machine learning",
        modalities=["text"],
        limit=10
    )
    
    print(f"Found {results['total']} results")
    
    await client.close()

asyncio.run(main())
```

### Error Handling

```python
from redis_ai_platform import RedisAIError, RateLimitError, AuthenticationError

try:
    results = client.search(query="test")
except RateLimitError as e:
    print(f"Rate limit exceeded: {e}")
    time.sleep(5)  # Wait before retrying
except AuthenticationError as e:
    print(f"Authentication failed: {e}")
    client.refresh_token()
except RedisAIError as e:
    print(f"API error: {e.code} - {e.message}")
```

## React Hooks

### Installation

```bash
npm install @redis-ai-platform/react
```

### Setup Provider

```tsx
import { RedisAIProvider } from '@redis-ai-platform/react';

function App() {
  return (
    <RedisAIProvider
      apiKey="your-api-key"
      baseUrl="https://api.redis-ai-platform.com"
    >
      <YourApp />
    </RedisAIProvider>
  );
}
```

### useSearch Hook

```tsx
import { useSearch } from '@redis-ai-platform/react';

function SearchComponent() {
  const { search, loading, results, error } = useSearch();

  const handleSearch = async () => {
    await search({
      query: 'machine learning',
      modalities: ['text', 'image'],
      limit: 10
    });
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {results && (
        <div>
          <h3>Found {results.total} results</h3>
          {results.results.map(result => (
            <div key={result.id}>
              <h4>{result.title}</h4>
              <p>{result.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### useWorkspace Hook

```tsx
import { useWorkspace } from '@redis-ai-platform/react';

function WorkspaceComponent({ workspaceId }) {
  const {
    workspace,
    knowledge,
    addKnowledge,
    searchKnowledge,
    loading,
    error
  } = useWorkspace(workspaceId);

  const handleAddKnowledge = async () => {
    await addKnowledge({
      type: 'insight',
      title: 'New Discovery',
      content: 'We found that...'
    });
  };

  return (
    <div>
      <h2>{workspace?.name}</h2>
      
      <button onClick={handleAddKnowledge}>
        Add Knowledge
      </button>
      
      <div>
        {knowledge.map(item => (
          <div key={item.id}>
            <h4>{item.title}</h4>
            <p>{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### useRealTime Hook

```tsx
import { useRealTime } from '@redis-ai-platform/react';

function CollaborativeEditor({ workspaceId }) {
  const { 
    connected, 
    users, 
    sendMessage, 
    onMessage 
  } = useRealTime(workspaceId);

  useEffect(() => {
    onMessage('knowledge_added', (knowledge) => {
      console.log('New knowledge added:', knowledge);
    });

    onMessage('user_joined', (user) => {
      console.log(`${user.name} joined`);
    });
  }, [onMessage]);

  return (
    <div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      <div>Users online: {users.length}</div>
      
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

## CLI Tools

### Installation

```bash
npm install -g @redis-ai-platform/cli
```

### Authentication

```bash
# Login to get API key
redis-ai login

# Set API key manually
redis-ai config set apiKey your-api-key

# Set base URL
redis-ai config set baseUrl https://api.redis-ai-platform.com
```

### Search Commands

```bash
# Basic search
redis-ai search "machine learning algorithms"

# Multi-modal search
redis-ai search "neural networks" --modalities text,image,code

# Search with filters
redis-ai search "AI research" --category technology --tags ai,ml

# Search and save results
redis-ai search "deep learning" --output results.json

# Interactive search
redis-ai search --interactive
```

### Workspace Commands

```bash
# List workspaces
redis-ai workspace list

# Create workspace
redis-ai workspace create "AI Research" --description "Research project"

# Add knowledge
redis-ai workspace add-knowledge workspace-123 \
  --title "Key Finding" \
  --content "We discovered..." \
  --type insight

# Search workspace knowledge
redis-ai workspace search workspace-123 "neural networks"

# Export workspace
redis-ai workspace export workspace-123 --format json
```

### Model Routing Commands

```bash
# Route request
redis-ai route --type text-generation --complexity high

# List available models
redis-ai models list

# Get model metrics
redis-ai models metrics

# Test model performance
redis-ai models test gpt-4 --prompt "Hello world"
```

### Development Commands

```bash
# Start local development server
redis-ai dev start

# Run tests
redis-ai test

# Generate API documentation
redis-ai docs generate

# Validate configuration
redis-ai config validate

# Monitor performance
redis-ai monitor

# Generate performance report
redis-ai report performance
```

### Batch Operations

```bash
# Batch index content
redis-ai batch index --input content.jsonl

# Batch search
redis-ai batch search --queries queries.txt --output results.csv

# Batch workspace operations
redis-ai batch workspace-add --workspace workspace-123 --input knowledge.jsonl
```

### Configuration

```bash
# View current configuration
redis-ai config show

# Set configuration values
redis-ai config set timeout 30000
redis-ai config set retries 3

# Reset configuration
redis-ai config reset

# Export configuration
redis-ai config export --output config.json

# Import configuration
redis-ai config import --input config.json
```

## SDK Examples

### Building a Search Application

```typescript
import { RedisAIPlatform } from '@redis-ai-platform/sdk';

class SearchApplication {
  private client: RedisAIPlatform;

  constructor(apiKey: string) {
    this.client = new RedisAIPlatform({
      apiKey,
      performance: {
        enableCaching: true,
        enableBatching: true
      }
    });
  }

  async search(query: string, options: any = {}) {
    try {
      const results = await this.client.search({
        query,
        modalities: options.modalities || ['text'],
        limit: options.limit || 20,
        filters: options.filters
      });

      return {
        success: true,
        data: results,
        cached: results.cached || false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async indexContent(content: any[]) {
    const results = await Promise.all(
      content.map(item => this.client.indexContent(item))
    );

    return {
      indexed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
}
```

### Building a Collaborative Tool

```typescript
import { RedisAIPlatform } from '@redis-ai-platform/sdk';

class CollaborativeTool {
  private client: RedisAIPlatform;
  private wsClient: any;

  constructor(apiKey: string) {
    this.client = new RedisAIPlatform({ apiKey });
  }

  async initializeWorkspace(workspaceId: string) {
    // Connect to real-time features
    this.wsClient = await this.client.connectWebSocket();
    await this.wsClient.joinWorkspace(workspaceId);

    // Set up event handlers
    this.wsClient.on('knowledge_added', this.handleKnowledgeAdded.bind(this));
    this.wsClient.on('user_joined', this.handleUserJoined.bind(this));
    this.wsClient.on('cursor_moved', this.handleCursorMoved.bind(this));
  }

  async addKnowledge(workspaceId: string, knowledge: any) {
    const result = await this.client.addKnowledge(workspaceId, knowledge);
    
    // Broadcast to other users
    this.wsClient.broadcast('knowledge_added', result);
    
    return result;
  }

  private handleKnowledgeAdded(knowledge: any) {
    // Update UI with new knowledge
    this.updateKnowledgeList(knowledge);
  }

  private handleUserJoined(user: any) {
    // Show user joined notification
    this.showNotification(`${user.name} joined the workspace`);
  }

  private handleCursorMoved(event: any) {
    // Update cursor position for other users
    this.updateCursorPosition(event.userId, event.position);
  }
}
```

## Best Practices

### Error Handling

```typescript
// Implement retry logic with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Performance Optimization

```typescript
// Use connection pooling
const client = new RedisAIPlatform({
  apiKey: 'your-api-key',
  performance: {
    connectionPool: {
      minConnections: 5,
      maxConnections: 20
    },
    enableCaching: true,
    enableBatching: true
  }
});

// Batch operations when possible
const batchResults = await client.batch([
  { method: 'search', params: { query: 'AI' } },
  { method: 'search', params: { query: 'ML' } }
]);
```

### Security

```typescript
// Store API keys securely
const client = new RedisAIPlatform({
  apiKey: process.env.REDIS_AI_API_KEY, // Use environment variables
  baseUrl: process.env.REDIS_AI_BASE_URL
});

// Validate inputs
function validateSearchQuery(query: string) {
  if (!query || query.length > 1000) {
    throw new Error('Invalid query');
  }
  return query.trim();
}
```

### Testing

```typescript
// Mock the SDK for testing
jest.mock('@redis-ai-platform/sdk', () => ({
  RedisAIPlatform: jest.fn().mockImplementation(() => ({
    search: jest.fn().mockResolvedValue({
      total: 10,
      results: [{ id: '1', title: 'Test Result' }]
    })
  }))
}));

// Test your application
test('should search successfully', async () => {
  const app = new SearchApplication('test-key');
  const result = await app.search('test query');
  
  expect(result.success).toBe(true);
  expect(result.data.total).toBe(10);
});
```

## Support

- 📖 **Documentation**: [Full API Reference](../api/README.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/redis-ai-platform/issues)
- 💬 **Community**: [Discord Server](https://discord.gg/redis-ai-platform)
- 📧 **Support**: sdk-support@redis-ai-platform.com