// Simple Express server for Redis AI Platform
const express = require('express');
const cors = require('cors');
const redis = require('redis');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Redis client
let redisClient;

async function initRedis() {
    redisClient = redis.createClient({
        host: 'localhost',
        port: 6379
    });
    
    await redisClient.connect();
    console.log('✅ Connected to Redis');
}

// API Routes
app.get('/api/health', async (req, res) => {
    try {
        const ping = await redisClient.ping();
        res.json({
            status: 'healthy',
            redis: ping === 'PONG' ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const info = await redisClient.info();
        const lines = info.split('\\r\\n');
        const stats = {};
        
        lines.forEach(line => {
            if (line.includes(':') && !line.startsWith('#')) {
                const [key, value] = line.split(':');
                stats[key] = value;
            }
        });
        
        res.json({
            connected_clients: stats.connected_clients || '0',
            used_memory_human: stats.used_memory_human || '0B',
            total_commands_processed: stats.total_commands_processed || '0',
            keyspace_hits: stats.keyspace_hits || '0',
            keyspace_misses: stats.keyspace_misses || '0',
            uptime_in_seconds: stats.uptime_in_seconds || '0'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        const { query, limit = 10 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        
        const searchResults = await redisClient.sendCommand([
            'FT.SEARCH', 'demo:docs', query, 'LIMIT', '0', limit.toString()
        ]);
        
        const results = [];
        for (let i = 1; i < searchResults.length; i += 2) {
            const docKey = searchResults[i];
            const fields = searchResults[i + 1];
            
            const doc = {};
            for (let j = 0; j < fields.length; j += 2) {
                doc[fields[j]] = fields[j + 1];
            }
            
            results.push({
                key: docKey,
                ...doc
            });
        }
        
        res.json({
            query,
            total: Math.floor(searchResults[0]),
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/documents', async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        const docId = `doc:${Date.now()}`;
        
        await redisClient.hSet(docId, {
            title,
            content,
            category: category || 'general',
            timestamp: Date.now().toString(),
            created: new Date().toISOString()
        });
        
        res.json({
            success: true,
            id: docId,
            message: 'Document added successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/metrics', async (req, res) => {
    try {
        const tsKey = 'demo:metrics:cpu';
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        const metrics = await redisClient.sendCommand([
            'TS.RANGE', tsKey, oneHourAgo.toString(), now.toString()
        ]);
        
        const formattedMetrics = metrics.map(([timestamp, value]) => ({
            timestamp: parseInt(timestamp),
            value: parseFloat(value),
            date: new Date(parseInt(timestamp)).toISOString()
        }));
        
        res.json({
            metric: 'cpu_usage',
            timeRange: '1h',
            data: formattedMetrics
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
    try {
        await initRedis();
        
        app.listen(PORT, () => {
            console.log(`🚀 Redis AI Platform Server running on http://localhost:${PORT}`);
            console.log(`📊 API endpoints available:`);
            console.log(`   GET  /api/health     - Health check`);
            console.log(`   GET  /api/stats      - Redis statistics`);
            console.log(`   POST /api/search     - Search documents`);
            console.log(`   POST /api/documents  - Add new document`);
            console.log(`   GET  /api/metrics    - Time series metrics`);
            console.log(`\n🌐 Open http://localhost:${PORT} to access the web interface`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();