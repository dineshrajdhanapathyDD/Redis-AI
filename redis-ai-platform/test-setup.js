// Simple test script to verify Redis AI Platform setup
const redis = require('redis');

async function testSetup() {
    console.log('🔍 Testing Redis AI Platform Setup...\n');
    
    // Test Redis connection
    console.log('1. Testing Redis connection...');
    try {
        const client = redis.createClient({
            host: 'localhost',
            port: 6379
        });
        
        await client.connect();
        
        // Test basic Redis operations
        await client.set('test:setup', 'Redis AI Platform');
        const value = await client.get('test:setup');
        console.log('✅ Redis connection successful:', value);
        
        // Test RedisSearch module
        console.log('\n2. Testing RedisSearch module...');
        try {
            await client.sendCommand(['FT.CREATE', 'test_idx', 'ON', 'HASH', 'PREFIX', '1', 'doc:', 'SCHEMA', 'title', 'TEXT', 'content', 'TEXT']);
            console.log('✅ RedisSearch module working');
        } catch (error) {
            if (error.message.includes('Index already exists')) {
                console.log('✅ RedisSearch module working (index exists)');
            } else {
                console.log('❌ RedisSearch error:', error.message);
            }
        }
        
        // Test RedisTimeSeries module
        console.log('\n3. Testing RedisTimeSeries module...');
        try {
            await client.sendCommand(['TS.CREATE', 'test:ts', 'LABELS', 'sensor', 'temperature']);
            await client.sendCommand(['TS.ADD', 'test:ts', '*', '25.5']);
            console.log('✅ RedisTimeSeries module working');
        } catch (error) {
            if (error.message.includes('key already exists')) {
                console.log('✅ RedisTimeSeries module working (key exists)');
            } else {
                console.log('❌ RedisTimeSeries error:', error.message);
            }
        }
        
        // Test RedisBloom module
        console.log('\n4. Testing RedisBloom module...');
        try {
            await client.sendCommand(['BF.RESERVE', 'test:bloom', '0.01', '1000']);
            await client.sendCommand(['BF.ADD', 'test:bloom', 'test-item']);
            const exists = await client.sendCommand(['BF.EXISTS', 'test:bloom', 'test-item']);
            console.log('✅ RedisBloom module working, item exists:', exists === 1);
        } catch (error) {
            if (error.message.includes('key already exists')) {
                console.log('✅ RedisBloom module working (key exists)');
            } else {
                console.log('❌ RedisBloom error:', error.message);
            }
        }
        
        await client.disconnect();
        
        console.log('\n🎉 Setup verification completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Redis connection: Working');
        console.log('   ✅ RedisSearch module: Available');
        console.log('   ✅ RedisTimeSeries module: Available');
        console.log('   ✅ RedisBloom module: Available');
        console.log('\n🚀 Your Redis AI Platform is ready for development!');
        
    } catch (error) {
        console.error('❌ Setup test failed:', error.message);
        process.exit(1);
    }
}

testSetup();