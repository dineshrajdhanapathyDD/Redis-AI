"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAPIDemo = runAPIDemo;
const ioredis_1 = require("ioredis");
const http_1 = require("http");
const rest_1 = require("../api/rest");
const graphql_1 = require("../api/graphql");
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
async function runAPIDemo() {
    console.log('🚀 Starting API Demo Server...\n');
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
        // Create REST API
        console.log('🌐 Setting up REST API...');
        const restAPI = new rest_1.RestAPI(redis, services, {
            ...rest_1.defaultAPIConfig,
            port: 3000,
            enableLogging: true
        });
        // Create GraphQL API
        console.log('🔮 Setting up GraphQL API...');
        const graphqlAPI = new graphql_1.GraphQLAPI(redis, services, graphql_1.defaultGraphQLConfig);
        // Get Express app and apply GraphQL middleware
        const app = restAPI.getApp();
        await graphqlAPI.start();
        await graphqlAPI.applyMiddleware(app);
        // Create HTTP server for both REST and GraphQL
        const httpServer = (0, http_1.createServer)(app);
        // Setup GraphQL subscriptions
        await graphqlAPI.createSubscriptionServer(httpServer);
        // Start the server
        const PORT = 3000;
        httpServer.listen(PORT, () => {
            console.log('\n🎉 API Demo Server is running!');
            console.log('=====================================');
            console.log(`🌐 REST API: http://localhost:${PORT}/api`);
            console.log(`🔮 GraphQL: http://localhost:${PORT}/graphql`);
            console.log(`📡 GraphQL Subscriptions: ws://localhost:${PORT}/graphql-subscriptions`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
            console.log(`📊 API Info: http://localhost:${PORT}/api/info`);
            console.log('\n📚 Available REST Endpoints:');
            console.log('   • POST /api/search/multi-modal - Multi-modal search');
            console.log('   • POST /api/search/text - Text search');
            console.log('   • POST /api/search/image - Image search');
            console.log('   • POST /api/search/code - Code search');
            console.log('   • POST /api/workspace - Create workspace');
            console.log('   • GET  /api/workspace/:id - Get workspace');
            console.log('   • POST /api/workspace/:id/knowledge - Add knowledge');
            console.log('   • POST /api/ai-routing/route - Route AI request');
            console.log('   • GET  /api/ai-routing/models - Get available models');
            console.log('   • POST /api/learning/behavior - Track behavior');
            console.log('   • GET  /api/learning/patterns/:userId - Get user patterns');
            console.log('   • POST /api/code-intelligence/analyze - Analyze code');
            console.log('   • POST /api/code-intelligence/generate - Generate code');
            console.log('   • POST /api/adaptive-ui/interactions - Track interaction');
            console.log('   • GET  /api/adaptive-ui/personalization/:userId - Get personalization');
            console.log('\n🔮 GraphQL Features:');
            console.log('   • Queries: search, workspace, models, patterns, etc.');
            console.log('   • Mutations: createWorkspace, routeAIRequest, trackBehavior, etc.');
            console.log('   • Subscriptions: workspaceUpdates, systemAlert, etc.');
            console.log('   • Playground: http://localhost:3000/graphql (development only)');
            console.log('\n📖 Example API Calls:');
            console.log('=====================================');
            // REST API Examples
            console.log('\n🌐 REST API Examples:');
            console.log('```bash');
            console.log('# Multi-modal search');
            console.log('curl -X POST http://localhost:3000/api/search/multi-modal \\');
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -d \'{"query": "machine learning", "contentTypes": ["TEXT", "CODE"], "limit": 5}\'');
            console.log('');
            console.log('# Create workspace');
            console.log('curl -X POST http://localhost:3000/api/workspace \\');
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -d \'{"name": "AI Research", "description": "Workspace for AI research", "ownerId": "user123"}\'');
            console.log('');
            console.log('# Route AI request');
            console.log('curl -X POST http://localhost:3000/api/ai-routing/route \\');
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -d \'{"prompt": "Explain quantum computing", "userId": "user123"}\'');
            console.log('```');
            // GraphQL Examples
            console.log('\n🔮 GraphQL Examples:');
            console.log('```graphql');
            console.log('# Search query');
            console.log('query SearchContent {');
            console.log('  search(input: {');
            console.log('    query: "neural networks"');
            console.log('    contentTypes: [TEXT, CODE]');
            console.log('    limit: 5');
            console.log('  }) {');
            console.log('    query');
            console.log('    totalResults');
            console.log('    results {');
            console.log('      id');
            console.log('      content');
            console.log('      contentType');
            console.log('      score');
            console.log('    }');
            console.log('  }');
            console.log('}');
            console.log('');
            console.log('# Create workspace mutation');
            console.log('mutation CreateWorkspace {');
            console.log('  createWorkspace(input: {');
            console.log('    name: "ML Research"');
            console.log('    description: "Machine Learning Research Workspace"');
            console.log('    ownerId: "user123"');
            console.log('  }) {');
            console.log('    id');
            console.log('    name');
            console.log('    createdAt');
            console.log('  }');
            console.log('}');
            console.log('');
            console.log('# Subscribe to workspace updates');
            console.log('subscription WorkspaceUpdates {');
            console.log('  workspaceUpdates(workspaceId: "workspace123")');
            console.log('}');
            console.log('```');
            console.log('\n🧪 Testing the APIs:');
            console.log('=====================================');
            console.log('1. Visit http://localhost:3000/health to check server health');
            console.log('2. Visit http://localhost:3000/api/info to see API information');
            console.log('3. Visit http://localhost:3000/graphql to access GraphQL Playground (dev mode)');
            console.log('4. Use curl, Postman, or any HTTP client to test REST endpoints');
            console.log('5. Use GraphQL clients like Apollo Client or GraphiQL for GraphQL testing');
            console.log('\n🔧 Configuration:');
            console.log('=====================================');
            console.log(`• CORS Origins: ${rest_1.defaultAPIConfig.corsOrigins.join(', ')}`);
            console.log(`• Rate Limit: ${rest_1.defaultAPIConfig.rateLimitMaxRequests} requests per ${rest_1.defaultAPIConfig.rateLimitWindowMs / 1000}s`);
            console.log(`• GraphQL Playground: ${graphql_1.defaultGraphQLConfig.playground ? 'Enabled' : 'Disabled'}`);
            console.log(`• GraphQL Introspection: ${graphql_1.defaultGraphQLConfig.introspection ? 'Enabled' : 'Disabled'}`);
            console.log('\n📈 Monitoring:');
            console.log('=====================================');
            console.log('• All API requests are logged with timing information');
            console.log('• GraphQL operations are tracked with operation names');
            console.log('• Rate limiting is enforced per IP address');
            console.log('• Error handling includes detailed error messages in development');
            console.log('\n🛑 To stop the server, press Ctrl+C');
            console.log('=====================================\n');
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            await graphqlAPI.stop();
            httpServer.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            await graphqlAPI.stop();
            httpServer.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('❌ Failed to start API demo server:', error);
        process.exit(1);
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    runAPIDemo().catch(console.error);
}
//# sourceMappingURL=api-demo.js.map