# Code Examples and Use Cases

This section provides practical examples and common use cases for the Redis AI Platform.

## Table of Contents

- [Multi-Modal Search Examples](#multi-modal-search-examples)
- [AI Model Routing Examples](#ai-model-routing-examples)
- [Collaborative Workspace Examples](#collaborative-workspace-examples)
- [Adaptive Learning Examples](#adaptive-learning-examples)
- [Code Intelligence Examples](#code-intelligence-examples)
- [Performance Optimization Examples](#performance-optimization-examples)
- [Integration Examples](#integration-examples)

## Multi-Modal Search Examples

### Basic Text Search

```typescript
import { MultiModalSearch } from '@redis-ai-platform/sdk';

const searchEngine = new MultiModalSearch({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.redis-ai-platform.com'
});

// Simple text search
const results = await searchEngine.search({
  query: 'machine learning algorithms',
  modalities: ['text'],
  limit: 10
});

console.log(`Found ${results.total} results`);
results.results.forEach(result => {
  console.log(`${result.title}: ${result.score}`);
});
```

### Cross-Modal Search

```typescript
// Search for images using text description
const imageResults = await searchEngine.search({
  query: 'red sports car in urban setting',
  modalities: ['image'],
  limit: 5,
  options: {
    crossModal: true,
    includeMetadata: true
  }
});

// Search across multiple modalities
const multiModalResults = await searchEngine.search({
  query: 'neural network architecture',
  modalities: ['text', 'image', 'code'],
  limit: 20,
  filters: {
    category: 'technology',
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    }
  }
});
```

### Advanced Search with Filters

```typescript
const advancedResults = await searchEngine.search({
  query: 'deep learning frameworks',
  modalities: ['text', 'code'],
  limit: 15,
  filters: {
    tags: ['pytorch', 'tensorflow'],
    author: 'research-team',
    complexity: 'advanced'
  },
  options: {
    highlightMatches: true,
    includeSimilar: true,
    boostRecent: true
  }
});

// Process results with highlights
advancedResults.results.forEach(result => {
  if (result.highlights) {
    console.log('Highlighted matches:', result.highlights);
  }
});
```

### Real-time Search with WebSocket

```typescript
import { WebSocketClient } from '@redis-ai-platform/sdk';

const wsClient = new WebSocketClient('ws://localhost:3000/ws');

await wsClient.connect('your-jwt-token');

// Subscribe to search updates
wsClient.subscribe('search_updates', (update) => {
  console.log('New search result:', update);
});

// Perform real-time search
wsClient.send({
  type: 'search',
  data: {
    query: 'artificial intelligence',
    modalities: ['text', 'image'],
    realTime: true
  }
});
```

## AI Model Routing Examples

### Basic Model Routing

```typescript
import { AIModelRouter } from '@redis-ai-platform/sdk';

const router = new AIModelRouter({
  apiKey: 'your-api-key'
});

// Get optimal model for text generation
const routingResult = await router.route({
  type: 'text-generation',
  complexity: 'medium',
  context: 'creative-writing',
  requirements: {
    maxLatency: 3000,
    minAccuracy: 0.85,
    costOptimized: true
  }
});

console.log(`Selected model: ${routingResult.selectedModel.id}`);
console.log(`Estimated cost: $${routingResult.estimatedCost}`);
console.log(`Estimated latency: ${routingResult.estimatedLatency}ms`);
```

### Dynamic Model Selection

```typescript
// Route based on current system load
const adaptiveRouting = await router.route({
  type: 'code-generation',
  complexity: 'high',
  context: 'typescript-react',
  requirements: {
    adaptToLoad: true,
    fallbackModels: ['gpt-4', 'claude-3-opus', 'local-model']
  }
});

// Execute request with selected model
const response = await router.execute(adaptiveRouting.selectedModel, {
  prompt: 'Create a React component for user authentication',
  parameters: {
    temperature: 0.7,
    maxTokens: 1000
  }
});
```

### Model Performance Monitoring

```typescript
// Get real-time model metrics
const metrics = await router.getMetrics();

metrics.models.forEach(model => {
  console.log(`${model.id}:`);
  console.log(`  Latency: ${model.metrics.averageLatency}ms`);
  console.log(`  Accuracy: ${model.metrics.accuracy}`);
  console.log(`  Status: ${model.status}`);
});

// Set up performance alerts
router.onPerformanceAlert((alert) => {
  console.log(`Performance alert: ${alert.message}`);
  if (alert.severity === 'critical') {
    // Handle critical performance issues
    handleCriticalAlert(alert);
  }
});
```

## Collaborative Workspace Examples

### Creating and Managing Workspaces

```typescript
import { WorkspaceManager } from '@redis-ai-platform/sdk';

const workspaceManager = new WorkspaceManager({
  apiKey: 'your-api-key'
});

// Create a new workspace
const workspace = await workspaceManager.create({
  name: 'AI Research Project',
  description: 'Collaborative space for AI research',
  settings: {
    visibility: 'private',
    allowGuests: false,
    retentionDays: 90
  }
});

// Add members to workspace
await workspaceManager.addMember(workspace.id, {
  userId: 'user-456',
  role: 'editor'
});

// Set up real-time collaboration
const collaboration = await workspaceManager.enableRealTime(workspace.id);

collaboration.on('member_joined', (member) => {
  console.log(`${member.name} joined the workspace`);
});

collaboration.on('knowledge_added', (knowledge) => {
  console.log(`New knowledge added: ${knowledge.title}`);
});
```

### Knowledge Management

```typescript
// Add knowledge to workspace
const knowledge = await workspaceManager.addKnowledge(workspace.id, {
  type: 'insight',
  title: 'Breakthrough in Attention Mechanisms',
  content: 'We discovered that multi-head attention can be optimized by...',
  tags: ['attention', 'optimization', 'performance'],
  relationships: [
    {
      type: 'builds-on',
      targetId: 'knowledge-123'
    }
  ],
  metadata: {
    source: 'experiment-results',
    confidence: 0.95
  }
});

// Query knowledge with semantic search
const searchResults = await workspaceManager.searchKnowledge(workspace.id, {
  query: 'attention mechanism optimization',
  filters: {
    types: ['insight', 'experiment'],
    confidence: { min: 0.8 }
  },
  limit: 10
});

// Build knowledge graph
const knowledgeGraph = await workspaceManager.getKnowledgeGraph(workspace.id);
console.log(`Knowledge graph has ${knowledgeGraph.nodes.length} nodes`);
```

### Real-time Collaboration

```typescript
// Set up real-time workspace synchronization
const realtimeWorkspace = await workspaceManager.connectRealTime(workspace.id);

// Handle real-time events
realtimeWorkspace.on('cursor_moved', (event) => {
  updateCursorPosition(event.userId, event.position);
});

realtimeWorkspace.on('content_changed', (event) => {
  applyContentChange(event.change);
});

realtimeWorkspace.on('ai_suggestion', (suggestion) => {
  displayAISuggestion(suggestion);
});

// Send real-time updates
realtimeWorkspace.sendCursorPosition({ x: 100, y: 200 });
realtimeWorkspace.sendContentChange({
  type: 'insert',
  position: 150,
  content: 'New insight about neural networks...'
});
```

## Adaptive Learning Examples

### User Behavior Tracking

```typescript
import { AdaptiveLearning } from '@redis-ai-platform/sdk';

const learning = new AdaptiveLearning({
  apiKey: 'your-api-key'
});

// Track user behavior
await learning.trackBehavior({
  action: 'content_viewed',
  context: {
    contentId: 'article-123',
    contentType: 'research-paper',
    duration: 300,
    engagement: 'high',
    scrollDepth: 0.85
  },
  metadata: {
    device: 'desktop',
    location: 'workspace-789',
    timestamp: new Date().toISOString()
  }
});

// Track interaction patterns
await learning.trackInteraction({
  type: 'search_query',
  data: {
    query: 'transformer architecture',
    resultsClicked: [1, 3, 7],
    timeSpent: 45
  }
});
```

### Personalized Recommendations

```typescript
// Get personalized content recommendations
const recommendations = await learning.getRecommendations({
  userId: 'user-123',
  context: 'research',
  limit: 10,
  types: ['articles', 'papers', 'tutorials']
});

recommendations.forEach(rec => {
  console.log(`${rec.title} (confidence: ${rec.confidence})`);
  console.log(`Reason: ${rec.reason}`);
});

// Get adaptive UI recommendations
const uiRecommendations = await learning.getUIRecommendations({
  userId: 'user-123',
  currentPage: 'search',
  context: {
    timeOfDay: 'morning',
    device: 'desktop',
    previousActions: ['search', 'filter', 'sort']
  }
});

// Apply UI adaptations
uiRecommendations.adaptations.forEach(adaptation => {
  applyUIAdaptation(adaptation);
});
```

### Learning Profile Management

```typescript
// Get user learning profile
const profile = await learning.getProfile('user-123');

console.log('Learning preferences:', profile.preferences);
console.log('Behavior patterns:', profile.behaviorPatterns);
console.log('Skill level:', profile.skillLevel);

// Update learning preferences
await learning.updatePreferences('user-123', {
  contentTypes: ['technical', 'research', 'tutorials'],
  complexity: 'advanced',
  learningStyle: 'visual',
  topics: ['machine-learning', 'nlp', 'computer-vision'],
  pace: 'fast'
});

// Get learning analytics
const analytics = await learning.getAnalytics('user-123', {
  timeRange: '30d',
  metrics: ['engagement', 'progress', 'preferences']
});
```

## Code Intelligence Examples

### Code Analysis

```typescript
import { CodeIntelligence } from '@redis-ai-platform/sdk';

const codeIntel = new CodeIntelligence({
  apiKey: 'your-api-key'
});

// Analyze code for issues and improvements
const analysis = await codeIntel.analyze({
  code: `
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n-1) + fibonacci(n-2);
    }
  `,
  language: 'javascript',
  context: {
    projectType: 'web-application',
    framework: 'react'
  },
  analysisTypes: ['performance', 'security', 'style', 'suggestions']
});

// Process analysis results
console.log(`Performance score: ${analysis.performance.score}/10`);
analysis.performance.issues.forEach(issue => {
  console.log(`${issue.severity}: ${issue.message}`);
  console.log(`Suggestion: ${issue.suggestion}`);
});

// Get optimization suggestions
analysis.suggestions.forEach(suggestion => {
  console.log(`Optimization: ${suggestion.title}`);
  console.log(`Code: ${suggestion.code}`);
  console.log(`Explanation: ${suggestion.explanation}`);
});
```

### Code Generation

```typescript
// Generate code from natural language
const generatedCode = await codeIntel.generate({
  description: 'Create a React hook for managing user authentication state',
  language: 'typescript',
  framework: 'react',
  style: 'functional',
  requirements: [
    'Use TypeScript interfaces',
    'Include error handling',
    'Support token refresh',
    'Provide loading states'
  ]
});

console.log('Generated code:');
console.log(generatedCode.code);
console.log('Explanation:', generatedCode.explanation);
console.log('Usage example:', generatedCode.usage);

// Generate tests for existing code
const tests = await codeIntel.generateTests({
  code: generatedCode.code,
  language: 'typescript',
  testFramework: 'jest',
  coverage: 'comprehensive'
});

console.log('Generated tests:');
console.log(tests.code);
```

### Code Refactoring

```typescript
// Get refactoring suggestions
const refactoringSuggestions = await codeIntel.getRefactoringSuggestions({
  code: legacyCode,
  language: 'javascript',
  targetStyle: 'modern-es6',
  goals: ['performance', 'readability', 'maintainability']
});

// Apply refactoring
const refactoredCode = await codeIntel.refactor({
  code: legacyCode,
  language: 'javascript',
  transformations: [
    'convert-to-arrow-functions',
    'use-const-let',
    'destructuring-assignment',
    'template-literals'
  ]
});

console.log('Refactored code:');
console.log(refactoredCode.code);
console.log('Changes made:', refactoredCode.changes);
```

## Performance Optimization Examples

### Connection Pooling

```typescript
import { ConnectionPool } from '@redis-ai-platform/performance';

// Configure connection pool
const pool = new ConnectionPool({
  minConnections: 5,
  maxConnections: 20,
  acquireTimeoutMs: 5000,
  idleTimeoutMs: 30000,
  maxRetries: 3
});

// Use connection pool in service
class UserService {
  async getUser(id: string): Promise<User | null> {
    const redis = await pool.acquire();
    try {
      const userData = await redis.get(`user:${id}`);
      return userData ? JSON.parse(userData) : null;
    } finally {
      pool.release(redis);
    }
  }

  async getUsers(ids: string[]): Promise<User[]> {
    const redis = await pool.acquire();
    try {
      const keys = ids.map(id => `user:${id}`);
      const results = await redis.mget(...keys);
      return results
        .filter(result => result !== null)
        .map(result => JSON.parse(result));
    } finally {
      pool.release(redis);
    }
  }
}
```

### Request Batching

```typescript
import { RequestBatcher } from '@redis-ai-platform/performance';

const batcher = new RequestBatcher({
  maxBatchSize: 100,
  maxWaitTimeMs: 50,
  maxConcurrentBatches: 5,
  priorityLevels: 3
});

// Batch Redis operations automatically
class CacheService {
  async get(key: string, priority: number = 1): Promise<any> {
    const redis = await pool.acquire();
    try {
      const result = await batcher.execute(redis, {
        id: `get-${Date.now()}-${Math.random()}`,
        operation: 'GET',
        key,
        priority,
        timestamp: Date.now()
      });
      return result.data;
    } finally {
      pool.release(redis);
    }
  }

  async set(key: string, value: any, priority: number = 1): Promise<void> {
    const redis = await pool.acquire();
    try {
      await batcher.execute(redis, {
        id: `set-${Date.now()}-${Math.random()}`,
        operation: 'SET',
        key,
        data: value,
        priority,
        timestamp: Date.now()
      });
    } finally {
      pool.release(redis);
    }
  }
}
```

### Intelligent Prefetching

```typescript
import { PrefetchService } from '@redis-ai-platform/performance';

const prefetch = new PrefetchService({
  enabled: true,
  maxCacheSize: 10000000, // 10MB
  prefetchThreshold: 0.8,
  backgroundRefreshInterval: 30000,
  popularityDecayFactor: 0.95
});

// Use prefetch service for smart caching
class ContentService {
  async getContent(id: string): Promise<Content | null> {
    const redis = await pool.acquire();
    try {
      // Automatically cached and prefetched based on access patterns
      const content = await prefetch.get(redis, `content:${id}`);
      return content ? JSON.parse(content) : null;
    } finally {
      pool.release(redis);
    }
  }

  async getRelatedContent(ids: string[]): Promise<Content[]> {
    const redis = await pool.acquire();
    try {
      // Batch prefetch with intelligent caching
      const keys = ids.map(id => `content:${id}`);
      const results = await prefetch.mget(redis, keys);
      return results
        .filter(result => result !== null)
        .map(result => JSON.parse(result));
    } finally {
      pool.release(redis);
    }
  }
}
```

## Integration Examples

### Express.js Integration

```typescript
import express from 'express';
import { RedisAIPlatform } from '@redis-ai-platform/sdk';

const app = express();
const aiPlatform = new RedisAIPlatform({
  apiKey: process.env.REDIS_AI_API_KEY,
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// Multi-modal search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, modalities, filters } = req.body;
    
    const results = await aiPlatform.search({
      query,
      modalities,
      filters,
      limit: 20
    });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI model routing endpoint
app.post('/api/ai/route', async (req, res) => {
  try {
    const { request } = req.body;
    
    const routing = await aiPlatform.routeRequest(request);
    
    res.json(routing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Next.js Integration

```typescript
// pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { RedisAIPlatform } from '@redis-ai-platform/sdk';

const aiPlatform = new RedisAIPlatform({
  apiKey: process.env.REDIS_AI_API_KEY!
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = await aiPlatform.search(req.body);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
}
```

```tsx
// components/SearchComponent.tsx
import { useState } from 'react';
import { useRedisAI } from '@redis-ai-platform/react';

export function SearchComponent() {
  const [query, setQuery] = useState('');
  const { search, loading, results, error } = useRedisAI();

  const handleSearch = async () => {
    await search({
      query,
      modalities: ['text', 'image'],
      limit: 10
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search across all content..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {results && (
        <div className="results">
          {results.results.map(result => (
            <div key={result.id} className="result">
              <h3>{result.title}</h3>
              <p>{result.content}</p>
              <span>Score: {result.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Python Integration

```python
# Using the Python SDK
from redis_ai_platform import RedisAIPlatform

# Initialize client
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
for result in results['results']:
    print(f"{result['title']}: {result['score']}")

# AI model routing
routing = client.route_request({
    "type": "text-generation",
    "complexity": "high",
    "context": "code-generation"
})

print(f"Selected model: {routing['selectedModel']['id']}")
```

### React Hook

```typescript
// hooks/useRedisAI.ts
import { useState, useCallback } from 'react';
import { RedisAIPlatform } from '@redis-ai-platform/sdk';

const client = new RedisAIPlatform({
  apiKey: process.env.NEXT_PUBLIC_REDIS_AI_API_KEY!
});

export function useRedisAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const search = useCallback(async (params: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await client.search(params);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const routeRequest = useCallback(async (request: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const routing = await client.routeRequest(request);
      return routing;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Routing failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    search,
    routeRequest,
    loading,
    error,
    results
  };
}
```

These examples demonstrate the key features and integration patterns for the Redis AI Platform. Each example includes error handling, performance considerations, and real-world usage patterns.