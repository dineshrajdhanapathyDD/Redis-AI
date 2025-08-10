# API Reference

The Redis AI Platform provides both REST and GraphQL APIs, along with WebSocket support for real-time features.

## Base URL

```
Production: https://api.redis-ai-platform.com
Development: http://localhost:3000/api
```

## Authentication

All API requests require authentication using JWT tokens:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.redis-ai-platform.com/api/search
```

### Getting a Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Multi-Modal Search API

### Search Content

Search across multiple content types using natural language.

```http
POST /api/search
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "query": "machine learning algorithms",
  "modalities": ["text", "image", "code"],
  "limit": 20,
  "filters": {
    "category": "technology",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  },
  "options": {
    "includeMetadata": true,
    "highlightMatches": true
  }
}
```

Response:
```json
{
  "total": 156,
  "results": [
    {
      "id": "doc-123",
      "type": "text",
      "title": "Introduction to Machine Learning",
      "content": "Machine learning is a subset of artificial intelligence...",
      "score": 0.95,
      "metadata": {
        "author": "Jane Smith",
        "publishedAt": "2024-03-15T10:00:00Z",
        "tags": ["ml", "ai", "algorithms"]
      },
      "highlights": [
        "Machine <mark>learning algorithms</mark> are designed to..."
      ]
    }
  ],
  "facets": {
    "modalities": {
      "text": 89,
      "image": 45,
      "code": 22
    },
    "categories": {
      "technology": 156,
      "science": 23
    }
  },
  "queryTime": 45
}
```

### Index Content

Add new content to the search index.

```http
POST /api/search/index
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "id": "doc-456",
  "type": "text",
  "title": "Advanced Neural Networks",
  "content": "Deep learning networks with multiple layers...",
  "metadata": {
    "author": "Dr. AI",
    "category": "technology",
    "tags": ["neural-networks", "deep-learning"]
  },
  "embeddings": {
    "text": [0.1, 0.2, 0.3, ...],
    "semantic": [0.4, 0.5, 0.6, ...]
  }
}
```

## AI Model Routing API

### Route Request

Get the optimal AI model for a specific request.

```http
POST /api/ai-routing/route
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "request": {
    "type": "text-generation",
    "complexity": "high",
    "context": "code-generation",
    "requirements": {
      "maxLatency": 2000,
      "minAccuracy": 0.9,
      "costOptimized": false
    }
  }
}
```

Response:
```json
{
  "selectedModel": {
    "id": "gpt-4-turbo",
    "provider": "openai",
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "confidence": 0.95
  },
  "alternatives": [
    {
      "id": "claude-3-opus",
      "provider": "anthropic",
      "confidence": 0.88
    }
  ],
  "reasoning": {
    "factors": [
      "High complexity requires advanced model",
      "Code generation context favors GPT-4",
      "Current latency metrics are optimal"
    ]
  },
  "estimatedCost": 0.002,
  "estimatedLatency": 1200
}
```

### Model Metrics

Get current performance metrics for all models.

```http
GET /api/ai-routing/metrics
Authorization: Bearer YOUR_TOKEN
```

Response:
```json
{
  "models": [
    {
      "id": "gpt-4-turbo",
      "metrics": {
        "averageLatency": 1150,
        "accuracy": 0.94,
        "throughput": 45.2,
        "errorRate": 0.002,
        "cost": 0.002
      },
      "status": "healthy",
      "lastUpdated": "2024-01-15T14:30:00Z"
    }
  ],
  "summary": {
    "totalRequests": 15420,
    "averageRoutingTime": 12,
    "routingAccuracy": 0.97
  }
}
```

## Collaborative Workspace API

### Create Workspace

Create a new collaborative workspace.

```http
POST /api/workspace
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "AI Research Project",
  "description": "Collaborative space for AI research",
  "settings": {
    "visibility": "private",
    "allowGuests": false,
    "retentionDays": 90
  },
  "initialMembers": [
    {
      "userId": "user-456",
      "role": "editor"
    }
  ]
}
```

Response:
```json
{
  "id": "workspace-789",
  "name": "AI Research Project",
  "createdAt": "2024-01-15T14:30:00Z",
  "owner": "user-123",
  "members": [
    {
      "userId": "user-123",
      "role": "owner",
      "joinedAt": "2024-01-15T14:30:00Z"
    },
    {
      "userId": "user-456", 
      "role": "editor",
      "joinedAt": "2024-01-15T14:30:00Z"
    }
  ],
  "inviteCode": "abc123def"
}
```

### Add Knowledge

Add knowledge to a workspace.

```http
POST /api/workspace/{workspaceId}/knowledge
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "type": "insight",
  "title": "Key Finding on Neural Architecture",
  "content": "We discovered that attention mechanisms...",
  "tags": ["neural-networks", "attention", "architecture"],
  "relationships": [
    {
      "type": "builds-on",
      "targetId": "knowledge-456"
    }
  ],
  "metadata": {
    "source": "experiment-results",
    "confidence": 0.9
  }
}
```

### Query Knowledge

Search knowledge within a workspace.

```http
POST /api/workspace/{workspaceId}/knowledge/search
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "query": "attention mechanisms in transformers",
  "filters": {
    "types": ["insight", "document"],
    "tags": ["neural-networks"]
  },
  "limit": 10
}
```

## Adaptive Learning API

### Get User Profile

Retrieve user's learning profile and preferences.

```http
GET /api/learning/profile
Authorization: Bearer YOUR_TOKEN
```

Response:
```json
{
  "userId": "user-123",
  "preferences": {
    "contentTypes": ["technical", "research"],
    "complexity": "advanced",
    "learningStyle": "visual",
    "topics": ["machine-learning", "nlp", "computer-vision"]
  },
  "behaviorPatterns": [
    {
      "pattern": "morning-researcher",
      "confidence": 0.85,
      "description": "Most active in research tasks during morning hours"
    }
  ],
  "recommendations": [
    {
      "type": "content",
      "title": "Advanced Transformer Architectures",
      "reason": "Based on your interest in NLP and recent activity",
      "confidence": 0.92
    }
  ],
  "lastUpdated": "2024-01-15T14:30:00Z"
}
```

### Track Behavior

Record user behavior for learning adaptation.

```http
POST /api/learning/behavior
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "action": "content_viewed",
  "context": {
    "contentId": "doc-123",
    "contentType": "research-paper",
    "duration": 300,
    "engagement": "high"
  },
  "metadata": {
    "device": "desktop",
    "location": "workspace-789",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

## Code Intelligence API

### Analyze Code

Get AI-powered code analysis and suggestions.

```http
POST /api/code-intelligence/analyze
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "code": "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}",
  "language": "javascript",
  "context": {
    "projectType": "web-application",
    "framework": "react"
  },
  "analysisTypes": ["performance", "security", "style", "suggestions"]
}
```

Response:
```json
{
  "analysis": {
    "performance": {
      "score": 3,
      "issues": [
        {
          "type": "inefficient-recursion",
          "line": 3,
          "severity": "high",
          "message": "Recursive fibonacci has exponential time complexity",
          "suggestion": "Use dynamic programming or iterative approach"
        }
      ]
    },
    "security": {
      "score": 8,
      "issues": []
    },
    "style": {
      "score": 9,
      "issues": [
        {
          "type": "naming",
          "line": 1,
          "severity": "low",
          "message": "Consider more descriptive parameter name",
          "suggestion": "Use 'number' instead of 'n'"
        }
      ]
    }
  },
  "suggestions": [
    {
      "type": "optimization",
      "title": "Optimize Fibonacci Implementation",
      "code": "function fibonacci(n) {\n  const memo = {};\n  function fib(num) {\n    if (num <= 1) return num;\n    if (memo[num]) return memo[num];\n    memo[num] = fib(num-1) + fib(num-2);\n    return memo[num];\n  }\n  return fib(n);\n}",
      "explanation": "Memoized version reduces time complexity from O(2^n) to O(n)"
    }
  ],
  "metrics": {
    "complexity": 2,
    "maintainability": 85,
    "testability": 90
  }
}
```

### Generate Code

Generate code based on natural language description.

```http
POST /api/code-intelligence/generate
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "description": "Create a React component for displaying user profile with avatar, name, and bio",
  "language": "typescript",
  "framework": "react",
  "style": "functional-component",
  "requirements": [
    "Use TypeScript interfaces",
    "Include prop validation",
    "Support dark mode",
    "Make it responsive"
  ]
}
```

## WebSocket API

### Connection

Connect to WebSocket for real-time features:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'YOUR_JWT_TOKEN'
}));

// Join workspace for real-time collaboration
ws.send(JSON.stringify({
  type: 'join_workspace',
  workspaceId: 'workspace-789'
}));
```

### Real-time Events

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'workspace_update':
      // Handle workspace changes
      console.log('Workspace updated:', message.data);
      break;
      
    case 'knowledge_added':
      // Handle new knowledge
      console.log('New knowledge:', message.data);
      break;
      
    case 'user_joined':
      // Handle user joining workspace
      console.log('User joined:', message.data);
      break;
  }
};
```

## GraphQL API

### Endpoint

```
POST /api/graphql
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

### Example Query

```graphql
query GetWorkspaceWithKnowledge($workspaceId: ID!) {
  workspace(id: $workspaceId) {
    id
    name
    description
    members {
      user {
        id
        name
        email
      }
      role
      joinedAt
    }
    knowledge(limit: 10) {
      id
      title
      content
      type
      tags
      createdAt
      author {
        id
        name
      }
    }
  }
}
```

### Example Mutation

```graphql
mutation AddKnowledge($workspaceId: ID!, $input: KnowledgeInput!) {
  addKnowledge(workspaceId: $workspaceId, input: $input) {
    id
    title
    content
    createdAt
    author {
      id
      name
    }
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "query",
        "message": "Query parameter is required"
      }
    ],
    "requestId": "req-123456",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` (401) - Missing or invalid authentication
- `AUTHORIZATION_FAILED` (403) - Insufficient permissions
- `VALIDATION_ERROR` (400) - Invalid request parameters
- `RESOURCE_NOT_FOUND` (404) - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## Rate Limiting

API requests are rate limited:

- **Free tier**: 100 requests/minute
- **Pro tier**: 1000 requests/minute  
- **Enterprise**: Custom limits

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
```

## Pagination

List endpoints support pagination:

```http
GET /api/search?page=2&limit=20&sort=relevance&order=desc
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```