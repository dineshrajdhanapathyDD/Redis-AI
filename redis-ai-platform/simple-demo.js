// Simple Redis AI Platform Demo
const redis = require('redis');

async function runSimpleDemo() {
    console.log('🚀 Redis AI Platform - Simple Demo\n');
    
    try {
        // Connect to Redis
        const client = redis.createClient({
            host: 'localhost',
            port: 6379
        });
        
        await client.connect();
        console.log('✅ Connected to Redis');
        
        // Demo 1: Basic Key-Value Operations
        console.log('\n📝 Demo 1: Basic Operations');
        await client.set('demo:user:1', JSON.stringify({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            created: new Date().toISOString()
        }));
        
        const user = JSON.parse(await client.get('demo:user:1'));
        console.log('   Stored user:', user.name, user.email);
        
        // Demo 2: Vector Search Simulation
        console.log('\n🔍 Demo 2: Search Index Creation');
        try {
            // Create a search index for documents
            await client.sendCommand([
                'FT.CREATE', 'demo:docs',
                'ON', 'HASH',
                'PREFIX', '1', 'doc:',
                'SCHEMA',
                'title', 'TEXT', 'WEIGHT', '2.0',
                'content', 'TEXT',
                'category', 'TAG',
                'timestamp', 'NUMERIC', 'SORTABLE'
            ]);
            console.log('   ✅ Search index created');
        } catch (error) {
            if (error.message.includes('Index already exists')) {
                console.log('   ✅ Search index already exists');
            } else {
                throw error;
            }
        }
        
        // Add some sample documents
        const docs = [
            {
                key: 'doc:1',
                title: 'Redis AI Platform Introduction',
                content: 'Redis AI Platform is a powerful system for building AI applications with real-time data processing.',
                category: 'tutorial',
                timestamp: Date.now()
            },
            {
                key: 'doc:2', 
                title: 'Vector Search with Redis',
                content: 'Learn how to implement vector search capabilities using Redis and AI embeddings.',
                category: 'guide',
                timestamp: Date.now() + 1000
            },
            {
                key: 'doc:3',
                title: 'Real-time AI Applications',
                content: 'Building scalable AI applications that process data in real-time using Redis as the backbone.',
                category: 'advanced',
                timestamp: Date.now() + 2000
            }
        ];
        
        for (const doc of docs) {
            await client.hSet(doc.key, {
                title: doc.title,
                content: doc.content,
                category: doc.category,
                timestamp: doc.timestamp.toString()
            });
        }
        console.log('   📄 Added', docs.length, 'sample documents');
        
        // Demo 3: Search Operations
        console.log('\n🔎 Demo 3: Search Operations');
        
        // Search for AI-related content
        const searchResults = await client.sendCommand([
            'FT.SEARCH', 'demo:docs', 'AI', 'LIMIT', '0', '10'
        ]);
        
        console.log('   Search results for "AI":');
        for (let i = 1; i < searchResults.length; i += 2) {
            const docKey = searchResults[i];
            const fields = searchResults[i + 1];
            const title = fields[fields.indexOf('title') + 1];
            console.log('   -', title, `(${docKey})`);
        }
        
        // Demo 4: Time Series Data
        console.log('\n📊 Demo 4: Time Series Metrics');
        
        const tsKey = 'demo:metrics:cpu';
        try {
            await client.sendCommand(['TS.CREATE', tsKey, 'LABELS', 'server', 'demo', 'metric', 'cpu']);
            console.log('   ✅ Time series created');
        } catch (error) {
            if (error.message.includes('key already exists')) {
                console.log('   ✅ Time series already exists');
            } else {
                throw error;
            }
        }
        
        // Add some sample metrics
        const now = Date.now();
        const metrics = [
            { timestamp: now - 60000, value: 45.2 },
            { timestamp: now - 30000, value: 52.1 },
            { timestamp: now, value: 38.7 }
        ];
        
        for (const metric of metrics) {
            await client.sendCommand(['TS.ADD', tsKey, metric.timestamp.toString(), metric.value.toString()]);
        }
        console.log('   📈 Added', metrics.length, 'CPU metrics');
        
        // Query recent metrics
        const recentMetrics = await client.sendCommand([
            'TS.RANGE', tsKey, (now - 120000).toString(), now.toString()
        ]);
        console.log('   Recent CPU usage:');
        for (const [timestamp, value] of recentMetrics) {
            const date = new Date(parseInt(timestamp)).toLocaleTimeString();
            console.log('   -', date, ':', parseFloat(value).toFixed(1) + '%');
        }
        
        // Demo 5: Probabilistic Data Structures
        console.log('\n🎲 Demo 5: Bloom Filter');
        
        const bloomKey = 'demo:users:visited';
        try {
            await client.sendCommand(['BF.RESERVE', bloomKey, '0.01', '1000']);
            console.log('   ✅ Bloom filter created');
        } catch (error) {
            if (error.message.includes('key already exists')) {
                console.log('   ✅ Bloom filter already exists');
            } else {
                throw error;
            }
        }
        
        // Add some users to the bloom filter
        const users = ['user123', 'user456', 'user789'];
        for (const user of users) {
            await client.sendCommand(['BF.ADD', bloomKey, user]);
        }
        console.log('   👥 Added', users.length, 'users to bloom filter');
        
        // Check if users exist
        for (const user of [...users, 'user999']) {
            const exists = await client.sendCommand(['BF.EXISTS', bloomKey, user]);
            const status = exists ? '✅ exists' : '❌ not found';
            console.log('   -', user, ':', status);
        }
        
        await client.disconnect();
        
        console.log('\n🎉 Demo completed successfully!');
        console.log('\n📋 What we demonstrated:');
        console.log('   ✅ Basic Redis operations');
        console.log('   ✅ Full-text search with RedisSearch');
        console.log('   ✅ Time series data with RedisTimeSeries');
        console.log('   ✅ Probabilistic data structures with RedisBloom');
        console.log('\n🚀 Your Redis AI Platform is ready for advanced AI workloads!');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    }
}

runSimpleDemo();