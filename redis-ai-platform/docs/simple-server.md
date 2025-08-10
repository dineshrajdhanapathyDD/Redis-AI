# Simple Server Documentation

The Simple Server (`simple-server.js`) is a lightweight Express.js application that provides a quick way to demonstrate Redis AI Platform capabilities without the full development environment setup.

## Overview

The Simple Server provides:
- Web-based dashboard for Redis monitoring
- Document search using RedisSearch
- Document management system
- Real-time Redis statistics
- Time series metrics visualization

## Quick Start

```bash
cd redis-ai-platform
npm install express cors redis
docker-compose up -d redis-stack
node simple-server.js
```

The server will start on `http://localhost:3001`

## Features

### Web Dashboard
- Real-time system health monitoring
- Redis connection status
- Performance statistics visualization
- Interactive document search interface
- Document management forms

### API Endpoints

#### Health Check
```http
GET /api/health
```

Returns system and Redis connection status.

**Response:**
```json
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2025-01-08T10:30:00.000Z"
}
```

#### Redis Statistics
```http
GET /api/stats
```

Returns Redis performance metrics.

**Response:**
```json
{
  "connected_clients": "2",
  "used_memory_human": "1.2M",
  "total_commands_processed": "1234",
  "keyspace_hits": "567",
  "keyspace_misses": "89",
  "uptime_in_seconds": "3600"
}
```

#### Document Search
```http
POST /api/search
```

Search documents using RedisSearch.

**Request Body:**
```json
{
  "query": "search term",
  "limit": 10
}
```

**Response:**
```json
{
  "query": "search term",
  "total": 5,
  "results": [
    {
      "key": "doc:1234567890",
      "title": "Document Title",
      "content": "Document content...",
      "category": "tutorial"
    }
  ]
}
```

#### Add Document
```http
POST /api/documents
```

Add a new document to the search index.

**Request Body:**
```json
{
  "title": "Document Title",
  "content": "Document content",
  "category": "tutorial"
}
```

**Response:**
```json
{
  "success": true,
  "id": "doc:1234567890",
  "message": "Document added successfully"
}
```

#### Time Series Metrics
```http
GET /api/metrics
```

Get time series metrics data (last hour).

**Response:**
```json
{
  "metric": "cpu_usage",
  "timeRange": "1h",
  "data": [
    {
      "timestamp": 1641638400000,
      "value": 45.2,
      "date": "2025-01-08T10:00:00.000Z"
    }
  ]
}
```

## Web Interface

The web interface provides:

### System Status Card
- Real-time health indicators
- Redis connection status
- Last update timestamp

### Redis Statistics Card
- Connected clients count
- Memory usage
- Commands processed
- Cache hit/miss ratio
- Uptime information

### Document Search Section
- Search input with real-time results
- Result display with metadata
- Search history

### Add Document Form
- Title, content, and category fields
- Form validation
- Success/error feedback

## Dependencies

The Simple Server requires minimal dependencies:
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `redis` - Redis client

## Configuration

The server uses default configuration:
- Port: 3001
- Redis host: localhost
- Redis port: 6379

## Error Handling

The server includes comprehensive error handling:
- Redis connection failures
- Invalid API requests
- Search errors
- Document creation failures

All errors return appropriate HTTP status codes and error messages.

## Development

### File Structure
```
simple-server.js    # Main server file
public/
  index.html        # Web dashboard
```

### Extending the Server

To add new features:

1. Add new API routes in `simple-server.js`
2. Update the frontend in `public/index.html`
3. Test with Redis commands

### Testing

Test the server endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Add a test document
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content","category":"test"}'

# Search for the document
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","limit":5}'
```

## Troubleshooting

### Common Issues

**Redis Connection Failed**
- Ensure Redis is running: `docker-compose up -d redis-stack`
- Check Redis logs: `docker-compose logs redis-stack`

**Search Not Working**
- Verify RedisSearch module is loaded
- Check if search index exists
- Ensure documents are properly indexed

**Port Already in Use**
- Change the PORT variable in `simple-server.js`
- Kill existing processes on port 3001

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG=* node simple-server.js
```

## Migration to Full Platform

To migrate from Simple Server to the full platform:

1. Install full dependencies: `npm install`
2. Copy environment configuration: `cp .env.example .env`
3. Run setup verification: `node test-setup.js`
4. Start full development server: `npm run dev`

The Simple Server data will be preserved in Redis and accessible in the full platform.