# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Redis AI Platform.

## Table of Contents

- [Common Issues](#common-issues)
- [Redis Connection Issues](#redis-connection-issues)
- [Performance Issues](#performance-issues)
- [API Issues](#api-issues)
- [Authentication Issues](#authentication-issues)
- [Search Issues](#search-issues)
- [WebSocket Issues](#websocket-issues)
- [Deployment Issues](#deployment-issues)
- [Monitoring and Debugging](#monitoring-and-debugging)

## Common Issues

### Application Won't Start

**Symptoms:**
- Server fails to start
- Connection errors on startup
- Environment variable errors

**Solutions:**

1. **Check environment variables**
   ```bash
   # Verify all required environment variables are set
   cat .env
   
   # Required variables:
   # REDIS_HOST, REDIS_PORT, JWT_SECRET, NODE_ENV
   ```

2. **Verify Redis connection and modules**
   ```bash
   # Run the automated setup verification
   node test-setup.js
   
   # Or test Redis connectivity manually
   redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
   
   # Should return: PONG
   ```

3. **Check Node.js version**
   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

4. **Install dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### High Memory Usage

**Symptoms:**
- Application consuming excessive memory
- Out of memory errors
- Slow performance

**Solutions:**

1. **Check cache sizes**
   ```typescript
   // Reduce cache sizes in configuration
   const prefetchConfig = {
     maxCacheSize: 1000000, // Reduce from 10MB to 1MB
     // ... other config
   };
   ```

2. **Monitor memory usage**
   ```bash
   # Check memory usage
   npm run memory-usage
   
   # Profile memory leaks
   npm run profile:memory
   ```

3. **Optimize connection pool**
   ```typescript
   const poolConfig = {
     minConnections: 2,    // Reduce minimum
     maxConnections: 10,   // Reduce maximum
     // ... other config
   };
   ```

### Slow Response Times

**Symptoms:**
- API responses taking > 1 second
- Timeouts on requests
- Poor user experience

**Solutions:**

1. **Enable performance optimizations**
   ```typescript
   // Enable all performance features
   const config = {
     connectionPool: { enabled: true },
     requestBatching: { enabled: true },
     prefetching: { enabled: true },
     queryOptimization: { enabled: true }
   };
   ```

2. **Check Redis performance**
   ```bash
   # Monitor Redis performance
   redis-cli --latency-history -h $REDIS_HOST -p $REDIS_PORT
   
   # Check Redis memory usage
   redis-cli info memory
   ```

3. **Analyze slow queries**
   ```bash
   # Enable query logging
   npm run monitor:queries
   
   # View performance metrics
   npm run metrics
   ```

### Setup Verification Failures

**Symptoms:**
- `test-setup.js` script fails
- Redis modules not available
- Connection timeouts

**Solutions:**

1. **Redis Stack not running**
   ```bash
   # Check if Redis Stack is running
   docker-compose ps
   
   # Start Redis Stack if not running
   docker-compose up -d redis-stack
   
   # Check logs for errors
   docker-compose logs redis-stack
   ```

2. **Redis modules not loaded**
   ```bash
   # Verify modules are loaded
   redis-cli MODULE LIST
   
   # Should show: search, timeseries, bloom, json
   ```

3. **Port conflicts**
   ```bash
   # Check if port 6379 is in use
   netstat -an | grep 6379
   
   # Kill conflicting Redis instances
   sudo pkill redis-server
   ```

4. **Permission issues**
   ```bash
   # Fix Docker permissions (Linux/Mac)
   sudo chown -R $USER:$USER .
   
   # Or run with sudo (not recommended)
   sudo docker-compose up -d redis-stack
   ```

## Redis Connection Issues

### Connection Refused

**Error:** `ECONNREFUSED` or `Connection refused`

**Solutions:**

1. **Check Redis is running**
   ```bash
   # Using Docker Compose
   docker-compose ps redis
   
   # Should show redis container as "Up"
   ```

2. **Verify Redis configuration**
   ```bash
   # Check Redis logs
   docker-compose logs redis
   
   # Look for startup errors or configuration issues
   ```

3. **Test network connectivity**
   ```bash
   # Test connection to Redis host
   telnet $REDIS_HOST $REDIS_PORT
   
   # Should connect successfully
   ```

4. **Check firewall settings**
   ```bash
   # Ensure Redis port is open
   sudo ufw status
   
   # Open Redis port if needed
   sudo ufw allow 6379
   ```

### Authentication Failed

**Error:** `NOAUTH Authentication required` or `ERR invalid password`

**Solutions:**

1. **Check Redis password configuration**
   ```bash
   # Verify password in environment
   echo $REDIS_PASSWORD
   
   # Test authentication
   redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
   ```

2. **Update Redis configuration**
   ```bash
   # In redis.conf
   requirepass your-secure-password
   
   # Restart Redis
   docker-compose restart redis
   ```

### Connection Pool Exhausted

**Error:** `Connection acquisition timeout` or `Pool exhausted`

**Solutions:**

1. **Increase pool size**
   ```typescript
   const poolConfig = {
     minConnections: 5,
     maxConnections: 50,  // Increase maximum
     acquireTimeoutMs: 10000,  // Increase timeout
   };
   ```

2. **Check for connection leaks**
   ```typescript
   // Always release connections
   const redis = await pool.acquire();
   try {
     // Use connection
   } finally {
     pool.release(redis);  // Always release
   }
   ```

3. **Monitor pool metrics**
   ```bash
   # Check pool utilization
   curl http://localhost:3000/api/metrics/pool
   ```

## Performance Issues

### High Latency

**Symptoms:**
- API responses > 500ms
- Search queries taking > 100ms
- User interface feels sluggish

**Diagnosis:**

1. **Check performance metrics**
   ```bash
   # View current metrics
   curl http://localhost:3000/api/metrics
   
   # Check specific component metrics
   curl http://localhost:3000/api/metrics/search
   curl http://localhost:3000/api/metrics/cache
   ```

2. **Profile application**
   ```bash
   # Run performance profiler
   npm run profile
   
   # Generate performance report
   npm run report:performance
   ```

**Solutions:**

1. **Enable query optimization**
   ```typescript
   const queryConfig = {
     enableQueryRewriting: true,
     enableResultCaching: true,
     enableIndexHints: true,
     maxComplexity: 100
   };
   ```

2. **Optimize Redis indices**
   ```bash
   # Check index performance
   redis-cli FT.INFO your-index-name
   
   # Rebuild indices if needed
   redis-cli FT.DROPINDEX your-index-name
   # Recreate with optimized settings
   ```

3. **Enable prefetching**
   ```typescript
   const prefetchConfig = {
     enabled: true,
     prefetchThreshold: 0.8,
     backgroundRefreshInterval: 30000
   };
   ```

### Memory Leaks

**Symptoms:**
- Memory usage continuously increasing
- Application crashes with OOM errors
- Performance degrading over time

**Diagnosis:**

1. **Monitor memory usage**
   ```bash
   # Track memory over time
   npm run monitor:memory
   
   # Generate heap dump
   npm run heap-dump
   ```

2. **Analyze heap dumps**
   ```bash
   # Use Chrome DevTools or clinic.js
   npm install -g clinic
   clinic doctor -- node src/index.js
   ```

**Solutions:**

1. **Fix connection leaks**
   ```typescript
   // Use try-finally blocks
   const redis = await pool.acquire();
   try {
     return await redis.get(key);
   } finally {
     pool.release(redis);
   }
   ```

2. **Clear caches periodically**
   ```typescript
   // Set up cache cleanup
   setInterval(() => {
     prefetchService.cleanup();
     queryOptimizer.clearCache();
   }, 3600000); // Every hour
   ```

3. **Optimize garbage collection**
   ```bash
   # Run with optimized GC settings
   node --max-old-space-size=4096 --optimize-for-size src/index.js
   ```

## API Issues

### 404 Not Found

**Error:** API endpoints returning 404

**Solutions:**

1. **Check route registration**
   ```typescript
   // Ensure routes are properly registered
   app.use('/api/search', searchRoutes);
   app.use('/api/workspace', workspaceRoutes);
   ```

2. **Verify API base URL**
   ```typescript
   // Check client configuration
   const client = new RedisAIPlatform({
     baseUrl: 'http://localhost:3000/api'  // Correct base URL
   });
   ```

3. **Check middleware order**
   ```typescript
   // Ensure middleware is in correct order
   app.use(cors());
   app.use(express.json());
   app.use(authMiddleware);
   app.use('/api', apiRoutes);
   ```

### 500 Internal Server Error

**Error:** Server returning 500 errors

**Diagnosis:**

1. **Check server logs**
   ```bash
   # View application logs
   npm run logs
   
   # Check for error stack traces
   tail -f logs/error.log
   ```

2. **Enable debug logging**
   ```bash
   # Set debug environment
   DEBUG=* npm run dev
   
   # Or specific modules
   DEBUG=redis-ai-platform:* npm run dev
   ```

**Solutions:**

1. **Add error handling**
   ```typescript
   app.use((error, req, res, next) => {
     logger.error('Unhandled error:', error);
     res.status(500).json({
       error: 'Internal server error',
       requestId: req.id
     });
   });
   ```

2. **Validate inputs**
   ```typescript
   // Add input validation
   const { body, validationResult } = require('express-validator');
   
   app.post('/api/search', [
     body('query').notEmpty(),
     body('modalities').isArray()
   ], (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
     // Handle request
   });
   ```

### Rate Limiting Issues

**Error:** `429 Too Many Requests`

**Solutions:**

1. **Check rate limit configuration**
   ```typescript
   // Adjust rate limits
   const rateLimitConfig = {
     windowMs: 60000,  // 1 minute
     max: 1000,        // Increase limit
     skipSuccessfulRequests: true
   };
   ```

2. **Implement request queuing**
   ```typescript
   // Queue requests when rate limited
   const requestQueue = new Queue('api-requests');
   
   requestQueue.process(async (job) => {
     return await makeAPIRequest(job.data);
   });
   ```

3. **Use exponential backoff**
   ```typescript
   async function retryRequest(request, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await makeRequest(request);
       } catch (error) {
         if (error.status === 429) {
           const delay = Math.pow(2, i) * 1000;
           await new Promise(resolve => setTimeout(resolve, delay));
         } else {
           throw error;
         }
       }
     }
   }
   ```

## Authentication Issues

### JWT Token Expired

**Error:** `401 Unauthorized` or `Token expired`

**Solutions:**

1. **Implement token refresh**
   ```typescript
   async function refreshToken(refreshToken) {
     const response = await fetch('/api/auth/refresh', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ refreshToken })
     });
     
     if (response.ok) {
       const { token } = await response.json();
       localStorage.setItem('token', token);
       return token;
     }
     
     throw new Error('Token refresh failed');
   }
   ```

2. **Add automatic retry with refresh**
   ```typescript
   async function apiRequest(url, options = {}) {
     let token = localStorage.getItem('token');
     
     const response = await fetch(url, {
       ...options,
       headers: {
         ...options.headers,
         'Authorization': `Bearer ${token}`
       }
     });
     
     if (response.status === 401) {
       // Try to refresh token
       token = await refreshToken(localStorage.getItem('refreshToken'));
       
       // Retry request with new token
       return fetch(url, {
         ...options,
         headers: {
           ...options.headers,
           'Authorization': `Bearer ${token}`
         }
       });
     }
     
     return response;
   }
   ```

### Invalid Credentials

**Error:** `401 Unauthorized` on login

**Solutions:**

1. **Check user credentials**
   ```bash
   # Verify user exists in database
   redis-cli HGET users:email user@example.com
   ```

2. **Verify password hashing**
   ```typescript
   // Ensure consistent password hashing
   const bcrypt = require('bcrypt');
   
   const isValid = await bcrypt.compare(password, hashedPassword);
   ```

3. **Check authentication middleware**
   ```typescript
   // Verify JWT verification
   const jwt = require('jsonwebtoken');
   
   try {
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     req.user = decoded;
     next();
   } catch (error) {
     return res.status(401).json({ error: 'Invalid token' });
   }
   ```

## Search Issues

### No Search Results

**Symptoms:**
- Search queries returning empty results
- Expected content not found
- Search index appears empty

**Diagnosis:**

1. **Check index status**
   ```bash
   # List all indices
   redis-cli FT._LIST
   
   # Check specific index info
   redis-cli FT.INFO search-index
   ```

2. **Verify content indexing**
   ```bash
   # Check if content is indexed
   redis-cli FT.SEARCH search-index "*" LIMIT 0 10
   ```

**Solutions:**

1. **Rebuild search indices**
   ```bash
   # Drop and recreate index
   redis-cli FT.DROPINDEX search-index
   
   # Recreate with proper schema
   npm run index:rebuild
   ```

2. **Check embedding generation**
   ```typescript
   // Verify embeddings are generated
   const embeddings = await embeddingService.generate('test content');
   console.log('Embeddings length:', embeddings.length);
   ```

3. **Verify search parameters**
   ```typescript
   // Check search query format
   const results = await searchEngine.search({
     query: 'test query',
     modalities: ['text'],  // Ensure modalities exist
     limit: 10
   });
   ```

### Poor Search Relevance

**Symptoms:**
- Irrelevant results returned
- Expected results ranked low
- Search quality is poor

**Solutions:**

1. **Tune search parameters**
   ```typescript
   const searchConfig = {
     vectorWeight: 0.7,      // Adjust vector vs text weight
     textWeight: 0.3,
     boostRecent: true,      // Boost recent content
     semanticThreshold: 0.8  // Minimum similarity threshold
   };
   ```

2. **Improve embedding quality**
   ```typescript
   // Use better embedding models
   const embeddingConfig = {
     model: 'text-embedding-ada-002',  // Higher quality model
     dimensions: 1536,
     normalize: true
   };
   ```

3. **Add result reranking**
   ```typescript
   // Implement custom ranking
   const rerankedResults = results.sort((a, b) => {
     const scoreA = calculateRelevanceScore(a, query);
     const scoreB = calculateRelevanceScore(b, query);
     return scoreB - scoreA;
   });
   ```

## WebSocket Issues

### Connection Failures

**Error:** WebSocket connection failed or disconnected

**Solutions:**

1. **Check WebSocket server**
   ```bash
   # Test WebSocket connection
   wscat -c ws://localhost:3000/ws
   ```

2. **Verify authentication**
   ```javascript
   // Ensure proper authentication
   const ws = new WebSocket('ws://localhost:3000/ws');
   
   ws.onopen = () => {
     ws.send(JSON.stringify({
       type: 'auth',
       token: localStorage.getItem('token')
     }));
   };
   ```

3. **Implement reconnection logic**
   ```javascript
   class WebSocketClient {
     constructor(url) {
       this.url = url;
       this.reconnectAttempts = 0;
       this.maxReconnectAttempts = 5;
       this.connect();
     }
   
     connect() {
       this.ws = new WebSocket(this.url);
       
       this.ws.onclose = () => {
         if (this.reconnectAttempts < this.maxReconnectAttempts) {
           setTimeout(() => {
             this.reconnectAttempts++;
             this.connect();
           }, Math.pow(2, this.reconnectAttempts) * 1000);
         }
       };
       
       this.ws.onopen = () => {
         this.reconnectAttempts = 0;
       };
     }
   }
   ```

### Message Delivery Issues

**Symptoms:**
- Messages not received
- Delayed message delivery
- Duplicate messages

**Solutions:**

1. **Add message acknowledgment**
   ```javascript
   // Client-side acknowledgment
   ws.onmessage = (event) => {
     const message = JSON.parse(event.data);
     
     // Process message
     handleMessage(message);
     
     // Send acknowledgment
     ws.send(JSON.stringify({
       type: 'ack',
       messageId: message.id
     }));
   };
   ```

2. **Implement message queuing**
   ```typescript
   // Server-side message queue
   class MessageQueue {
     private queues = new Map<string, Message[]>();
     
     enqueue(userId: string, message: Message) {
       if (!this.queues.has(userId)) {
         this.queues.set(userId, []);
       }
       this.queues.get(userId)!.push(message);
     }
     
     dequeue(userId: string): Message[] {
       const messages = this.queues.get(userId) || [];
       this.queues.set(userId, []);
       return messages;
     }
   }
   ```

## Deployment Issues

### Docker Build Failures

**Error:** Docker build failing or containers not starting

**Solutions:**

1. **Check Dockerfile**
   ```dockerfile
   # Ensure proper Node.js version
   FROM node:18-alpine
   
   # Install dependencies first (for better caching)
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy source code
   COPY . .
   
   # Build application
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Verify Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - REDIS_HOST=redis
       depends_on:
         - redis
     
     redis:
       image: redis/redis-stack:latest
       ports:
         - "6379:6379"
   ```

3. **Check build context**
   ```bash
   # Ensure .dockerignore is configured
   echo "node_modules" > .dockerignore
   echo ".git" >> .dockerignore
   echo "*.log" >> .dockerignore
   ```

### Kubernetes Deployment Issues

**Error:** Pods failing to start or crashing

**Solutions:**

1. **Check pod logs**
   ```bash
   # View pod logs
   kubectl logs -f deployment/redis-ai-platform
   
   # Check pod status
   kubectl describe pod <pod-name>
   ```

2. **Verify resource limits**
   ```yaml
   # k8s/api-deployment.yaml
   resources:
     requests:
       memory: "512Mi"
       cpu: "250m"
     limits:
       memory: "1Gi"
       cpu: "500m"
   ```

3. **Check configuration**
   ```bash
   # Verify ConfigMap
   kubectl get configmap redis-ai-config -o yaml
   
   # Check secrets
   kubectl get secret redis-ai-secrets -o yaml
   ```

## Monitoring and Debugging

### Enable Debug Logging

```bash
# Enable all debug logs
DEBUG=* npm run dev

# Enable specific module logs
DEBUG=redis-ai-platform:search npm run dev
DEBUG=redis-ai-platform:cache npm run dev
DEBUG=redis-ai-platform:auth npm run dev
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Detailed health check
curl http://localhost:3000/api/health/detailed

# Component-specific health
curl http://localhost:3000/api/health/redis
curl http://localhost:3000/api/health/search
```

### Performance Monitoring

```bash
# View real-time metrics
curl http://localhost:3000/api/metrics

# Performance dashboard
npm run monitor

# Generate performance report
npm run report:performance
```

### Log Analysis

```bash
# View application logs
tail -f logs/app.log

# Search for errors
grep "ERROR" logs/app.log

# Analyze performance logs
grep "SLOW_QUERY" logs/performance.log
```

### Database Debugging

```bash
# Redis CLI debugging
redis-cli monitor

# Check Redis memory usage
redis-cli info memory

# Analyze slow queries
redis-cli slowlog get 10

# Check index statistics
redis-cli FT.INFO search-index
```

## Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check the logs** for detailed error messages
2. **Search existing issues** on GitHub
3. **Create a new issue** with:
   - Detailed error description
   - Steps to reproduce
   - Environment information
   - Relevant log excerpts
4. **Join our Discord** for community support
5. **Contact support** for enterprise customers

### Useful Commands for Issue Reports

```bash
# System information
npm run system-info

# Generate debug bundle
npm run debug-bundle

# Export configuration (sanitized)
npm run export-config

# Performance snapshot
npm run perf-snapshot
```