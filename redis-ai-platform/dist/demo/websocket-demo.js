"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWebSocketDemo = runWebSocketDemo;
const http_1 = require("http");
const ioredis_1 = require("ioredis");
const websocket_1 = require("../api/websocket");
const embedding_manager_1 = require("../services/embedding-manager");
const vector_storage_1 = require("../services/vector-storage");
const search_1 = require("../services/search");
const workspace_1 = require("../services/workspace");
const ai_routing_1 = require("../services/ai-routing");
const learning_1 = require("../services/learning");
const code_intelligence_1 = require("../services/code-intelligence");
const content_consistency_1 = require("../services/content-consistency");
const optimization_1 = require("../services/optimization");
const adaptive_ui_1 = require("../services/adaptive-ui");
async function runWebSocketDemo() {
    console.log('🔌 Starting WebSocket Gateway Demo...\n');
    // Initialize Redis connection
    const redis = new ioredis_1.Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
    });
    try {
        // Initialize all services
        console.log('📦 Initializing services...');
        const embeddingManager = new embedding_manager_1.EmbeddingManager(redis);
        await embeddingManager.initialize();
        const vectorStorage = new vector_storage_1.VectorStorage(redis);
        await vectorStorage.initialize();
        const services = {
            embeddingManager,
            vectorStorage,
            multiModalSearch: new search_1.MultiModalSearch(embeddingManager, vectorStorage),
            workspaceService: new workspace_1.WorkspaceService(redis, embeddingManager),
            aiRoutingService: new ai_routing_1.AIRoutingService(redis),
            learningService: new learning_1.LearningService(redis),
            codeIntelligenceService: new code_intelligence_1.CodeIntelligenceService(redis, embeddingManager),
            contentConsistencyService: new content_consistency_1.ContentConsistencyService(redis, embeddingManager),
            optimizationService: new optimization_1.OptimizationService(redis),
            adaptiveUIService: new adaptive_ui_1.AdaptiveUIService(redis)
        };
        // Initialize all services
        await services.multiModalSearch.initialize();
        await services.workspaceService.initialize();
        await services.aiRoutingService.initialize();
        await services.learningService.initialize();
        await services.codeIntelligenceService.initialize();
        await services.contentConsistencyService.initialize();
        await services.optimizationService.initialize();
        await services.adaptiveUIService.initialize();
        console.log('✅ All services initialized successfully\n');
        // Create HTTP server
        console.log('🌐 Setting up WebSocket server...');
        const httpServer = (0, http_1.createServer)();
        // Create WebSocket gateway
        const gateway = new websocket_1.WebSocketGateway(httpServer, redis, services, {
            ...websocket_1.defaultWebSocketConfig,
            enableAuth: false, // Disable auth for demo
            enableRateLimit: false, // Disable rate limiting for demo
            maxConnections: 1000
        });
        // Start the server
        const PORT = 3001;
        httpServer.listen(PORT, () => {
            console.log('\n🎉 WebSocket Demo Server is running!');
            console.log('=====================================');
            console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
            console.log(`📊 Connection URL: ws://localhost:${PORT}/socket.io/`);
            console.log('\n🔧 Available Event Categories:');
            console.log('=====================================');
            console.log('📋 System Events:');
            console.log('   • system:subscribe_alerts - Subscribe to system alerts');
            console.log('   • system:subscribe_metrics - Subscribe to system metrics');
            console.log('   • system:get_health - Get system health status');
            console.log('   • system:get_stats - Get system statistics');
            console.log('   • system:report_issue - Report system issues');
            console.log('\n🏢 Workspace Events:');
            console.log('   • workspace:join - Join a workspace');
            console.log('   • workspace:leave - Leave a workspace');
            console.log('   • workspace:add_knowledge - Add knowledge to workspace');
            console.log('   • workspace:search_knowledge - Search workspace knowledge');
            console.log('   • workspace:cursor_update - Update cursor position');
            console.log('   • workspace:acquire_lock - Acquire resource lock');
            console.log('   • workspace:send_message - Send message to workspace');
            console.log('\n🤖 AI Routing Events:');
            console.log('   • ai_routing:subscribe_updates - Subscribe to routing updates');
            console.log('   • ai_routing:route_request - Route AI request');
            console.log('   • ai_routing:get_model_metrics - Get model performance metrics');
            console.log('   • ai_routing:test_model - Test model connectivity');
            console.log('   • ai_routing:get_analytics - Get routing analytics');
            console.log('\n🧠 Learning Events:');
            console.log('   • learning:track_behavior - Track user behavior');
            console.log('   • learning:subscribe_recommendations - Subscribe to recommendations');
            console.log('   • learning:get_patterns - Get user patterns');
            console.log('   • learning:update_preferences - Update user preferences');
            console.log('   • learning:provide_feedback - Provide recommendation feedback');
            console.log('\n🎨 Adaptive UI Events:');
            console.log('   • adaptive_ui:track_interaction - Track UI interactions');
            console.log('   • adaptive_ui:subscribe_personalization - Subscribe to personalization');
            console.log('   • adaptive_ui:request_adaptation - Request UI adaptation');
            console.log('   • adaptive_ui:get_assistance - Get contextual assistance');
            console.log('   • adaptive_ui:check_feature_readiness - Check feature readiness');
            console.log('\n🔧 General Events:');
            console.log('   • subscribe - Subscribe to a channel');
            console.log('   • unsubscribe - Unsubscribe from a channel');
            console.log('   • ping - Ping the server');
            console.log('   • get_info - Get connection information');
            console.log('\n📖 Example Client Code:');
            console.log('=====================================');
            console.log('```javascript');
            console.log('// Using socket.io-client');
            console.log('const io = require("socket.io-client");');
            console.log('const socket = io("ws://localhost:3001");');
            console.log('');
            console.log('// Connection events');
            console.log('socket.on("connect", () => {');
            console.log('  console.log("Connected to WebSocket server");');
            console.log('});');
            console.log('');
            console.log('socket.on("connected", (data) => {');
            console.log('  console.log("Server welcome:", data);');
            console.log('});');
            console.log('');
            console.log('// Subscribe to system alerts');
            console.log('socket.emit("system:subscribe_alerts", {');
            console.log('  alertTypes: ["error", "warning", "info"]');
            console.log('});');
            console.log('');
            console.log('socket.on("system:alerts_subscribed", (data) => {');
            console.log('  console.log("Subscribed to alerts:", data);');
            console.log('});');
            console.log('');
            console.log('// Track user behavior');
            console.log('socket.emit("learning:track_behavior", {');
            console.log('  action: "page_view",');
            console.log('  context: { page: "dashboard" },');
            console.log('  metadata: { duration: 5000 }');
            console.log('});');
            console.log('');
            console.log('// Join a workspace');
            console.log('socket.emit("workspace:join", {');
            console.log('  workspaceId: "workspace_123"');
            console.log('});');
            console.log('');
            console.log('socket.on("workspace:joined", (data) => {');
            console.log('  console.log("Joined workspace:", data);');
            console.log('});');
            console.log('```');
            console.log('\n🌐 Browser Example:');
            console.log('=====================================');
            console.log('```html');
            console.log('<!DOCTYPE html>');
            console.log('<html>');
            console.log('<head>');
            console.log('  <title>WebSocket Demo</title>');
            console.log('  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>');
            console.log('</head>');
            console.log('<body>');
            console.log('  <h1>WebSocket Demo</h1>');
            console.log('  <div id="status">Connecting...</div>');
            console.log('  <div id="messages"></div>');
            console.log('  ');
            console.log('  <script>');
            console.log('    const socket = io("ws://localhost:3001");');
            console.log('    const status = document.getElementById("status");');
            console.log('    const messages = document.getElementById("messages");');
            console.log('    ');
            console.log('    socket.on("connect", () => {');
            console.log('      status.textContent = "Connected";');
            console.log('      status.style.color = "green";');
            console.log('    });');
            console.log('    ');
            console.log('    socket.on("connected", (data) => {');
            console.log('      messages.innerHTML += `<p>Welcome: ${JSON.stringify(data)}</p>`;');
            console.log('    });');
            console.log('    ');
            console.log('    socket.on("disconnect", () => {');
            console.log('      status.textContent = "Disconnected";');
            console.log('      status.style.color = "red";');
            console.log('    });');
            console.log('    ');
            console.log('    // Subscribe to system metrics');
            console.log('    socket.emit("system:subscribe_metrics", {');
            console.log('      interval: 5000,');
            console.log('      metrics: ["cpu", "memory"]');
            console.log('    });');
            console.log('    ');
            console.log('    socket.on("system:metrics_update", (data) => {');
            console.log('      messages.innerHTML += `<p>Metrics: ${JSON.stringify(data)}</p>`;');
            console.log('    });');
            console.log('  </script>');
            console.log('</body>');
            console.log('</html>');
            console.log('```');
            console.log('\n📊 Real-time Features:');
            console.log('=====================================');
            console.log('• Real-time workspace collaboration with cursor tracking');
            console.log('• Live system metrics and health monitoring');
            console.log('• Instant AI routing updates and model status changes');
            console.log('• Personalized learning recommendations');
            console.log('• Adaptive UI changes based on user behavior');
            console.log('• System alerts and anomaly notifications');
            console.log('• Cross-instance message broadcasting via Redis');
            console.log('\n🔍 Monitoring:');
            console.log('=====================================');
            // Display initial stats
            const stats = gateway.getStats();
            console.log(`• Total Connections: ${stats.totalConnections}`);
            console.log(`• Authenticated Users: ${stats.authenticatedUsers}`);
            console.log(`• Anonymous Connections: ${stats.anonymousConnections}`);
            console.log(`• Total Subscriptions: ${stats.totalSubscriptions}`);
            console.log(`• Server Uptime: ${Math.floor(stats.uptime)}s`);
            console.log(`• Memory Usage: ${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)}MB`);
            // Start periodic stats display
            setInterval(() => {
                const currentStats = gateway.getStats();
                if (currentStats.totalConnections > 0) {
                    console.log(`\n📈 Live Stats: ${currentStats.totalConnections} connections, ${currentStats.totalSubscriptions} subscriptions`);
                }
            }, 30000); // Every 30 seconds
            // Simulate some system events for demo
            setTimeout(() => {
                console.log('\n🎭 Simulating system events...');
                // Simulate system alert
                gateway.broadcast('system:alert', {
                    type: 'info',
                    message: 'Demo system alert - everything is working normally',
                    timestamp: Date.now()
                });
                // Simulate AI routing update
                gateway.broadcast('ai_routing:model_status_changed', {
                    modelId: 'demo-model',
                    status: 'active',
                    performance: { latency: 150, successRate: 0.98 },
                    timestamp: Date.now()
                });
                // Simulate learning update
                gateway.broadcast('learning:pattern_discovered', {
                    userId: 'demo-user',
                    pattern: {
                        type: 'navigation',
                        description: 'User frequently accesses dashboard in the morning',
                        confidence: 0.85
                    },
                    timestamp: Date.now()
                });
            }, 5000); // After 5 seconds
            console.log('\n🛑 To stop the server, press Ctrl+C');
            console.log('=====================================\n');
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            await gateway.shutdown();
            httpServer.close(() => {
                console.log('✅ WebSocket server closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            await gateway.shutdown();
            httpServer.close(() => {
                console.log('✅ WebSocket server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('❌ Failed to start WebSocket demo server:', error);
        process.exit(1);
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    runWebSocketDemo().catch(console.error);
}
//# sourceMappingURL=websocket-demo.js.map