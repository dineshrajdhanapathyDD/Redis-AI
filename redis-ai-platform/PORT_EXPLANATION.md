# Port Configuration Explanation

## Simple Server Port Change

The Redis AI Platform simple server (`simple-server.js`) has been configured to use **port 3001** instead of the default port 3000.

### Why Port 3001?

1. **Avoid Conflicts**: Port 3000 is commonly used by many development servers (React, Next.js, Express defaults), which can cause conflicts during development.

2. **Clear Separation**: Using port 3001 for the simple demo server helps distinguish it from the main development server that typically runs on port 3000.

3. **Documentation Consistency**: All documentation now consistently references port 3001 for the simple server demo.

### Port Usage Summary

| Service | Port | Purpose |
|---------|------|---------|
| Simple Server (Demo) | 3001 | Web dashboard and API demo |
| Main Development Server | 3000 | Full application development |
| Redis Stack | 6379 | Redis database |
| Redis Insight (optional) | 8001 | Redis GUI management |

### Accessing the Simple Server

After running `node simple-server.js`, access the web dashboard at:
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **API Documentation**: Available through the web interface

### Configuration

The port is configured in `simple-server.js`:

```javascript
const PORT = 3001;
```

To change the port, modify this value and restart the server. Remember to update any documentation or scripts that reference the port number.

### Development Workflow

1. **Simple Demo**: `node simple-server.js` → http://localhost:3001
2. **Full Development**: `npm run dev` → http://localhost:3000
3. **Redis Management**: Redis Insight → http://localhost:8001 (if configured)

This port configuration ensures a smooth development experience without conflicts between different services.