# Developer Tools

This directory contains interactive tools and utilities to help developers work with the Redis AI Platform.

## Available Tools

### 🎮 Interactive Demo (`interactive-demo.ts`)

A comprehensive interactive demonstration of all platform features.

```bash
npm run demo
```

**Features:**
- Multi-modal search demonstrations
- AI model routing examples
- Collaborative workspace simulations
- Code intelligence showcases
- Performance optimization demos
- Real-time benchmarking
- Developer utilities

**Usage:**
```bash
# Run interactive demo
npm run demo

# Run specific feature demos
npm run demo:search
npm run demo:routing
npm run demo:workspace
npm run demo:performance
```

### 🧪 API Tester (`api-tester.ts`)

Comprehensive API testing tool with interactive interface.

```bash
npm run api-test
```

**Features:**
- Test all API endpoints
- Custom request builder
- Performance benchmarking
- Response validation
- Automated test suites
- Results analysis

**Test Suites:**
- Search API tests
- AI Routing API tests
- Workspace API tests
- Code Intelligence API tests
- Monitoring API tests
- Authentication API tests

### 📚 Documentation Generator (`documentation-generator.ts`)

Automated documentation generation from source code.

```bash
npm run docs:generate
```

**Generated Documentation:**
- API reference documentation
- Service documentation
- Schema definitions
- Usage examples
- OpenAPI specifications
- Postman collections

**Commands:**
```bash
# Generate all documentation
npm run docs:all

# Generate specific documentation
npm run docs:api
npm run docs:services
npm run docs:examples
```

## Tool Configuration

### Environment Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start Redis (required for demos)
docker-compose up -d redis
```

### Interactive Demo Configuration

The interactive demo can be configured by modifying the service initialization in `interactive-demo.ts`:

```typescript
// Customize demo configurations
const demoConfig = {
  search: {
    redis: { host: 'localhost', port: 6379 },
    embeddings: { provider: 'openai', model: 'text-embedding-ada-002' }
  },
  routing: {
    models: ['gpt-4', 'claude-3-opus', 'local-model'],
    redis: { host: 'localhost', port: 6379 }
  },
  // ... other configurations
};
```

### API Tester Configuration

Configure the API tester by setting the base URL and authentication:

```typescript
// Default configuration
const config = {
  baseUrl: 'http://localhost:3000/api',
  timeout: 30000,
  retries: 3
};

// Authentication token (optional)
const authToken = 'your-jwt-token';
```

### Documentation Generator Configuration

Customize documentation generation:

```typescript
// Output directory
private outputDir: string = 'docs/generated';

// Source directory
private sourceDir: string = 'src';

// File patterns
const patterns = {
  routes: `${this.sourceDir}/api/rest/routes/*.ts`,
  services: `${this.sourceDir}/services/**/*.ts`,
  types: `${this.sourceDir}/**/types.ts`
};
```

## Usage Examples

### Running Interactive Demos

```bash
# Start the interactive demo system
npm run demo

# Follow the prompts to explore different features:
# 1. Multi-Modal Search Demo
# 2. AI Model Routing Demo
# 3. Collaborative Workspace Demo
# 4. Code Intelligence Demo
# 5. Performance Optimization Demo
# 6. Complete Workflow Demo
# 7. Interactive Benchmarks
# 8. Developer Tools
```

### API Testing Workflow

```bash
# Start API tester
npm run api-test

# Configure base URL and authentication
# Select test suite or create custom tests
# View results and performance metrics
```

### Documentation Generation Workflow

```bash
# Generate all documentation
npm run docs:all

# Generated files will be in docs/generated/:
# - api-reference.md
# - services.md
# - schemas.md
# - examples.md
# - openapi.json
# - postman-collection.json
```

## Tool Development

### Adding New Demo Features

1. **Create demo function:**
   ```typescript
   private async runNewFeatureDemo() {
     console.log(chalk.blue.bold('\n🆕 New Feature Demo\n'));
     
     // Demo implementation
     const result = await this.simulateNewFeature();
     
     // Display results
     console.log(chalk.green('✅ Demo completed!'));
   }
   ```

2. **Add to demo choices:**
   ```typescript
   const DEMO_CHOICES: DemoChoice[] = [
     // ... existing choices
     {
       name: '🆕 New Feature Demo',
       value: 'new-feature',
       description: 'Demonstration of the new feature'
     }
   ];
   ```

3. **Add to switch statement:**
   ```typescript
   switch (choice) {
     // ... existing cases
     case 'new-feature':
       await this.runNewFeatureDemo();
       break;
   }
   ```

### Adding New API Tests

1. **Create test suite:**
   ```typescript
   private async testNewAPI() {
     const testSuite: TestSuite = {
       name: 'New API',
       tests: [
         {
           name: 'Test new endpoint',
           method: 'POST',
           endpoint: '/new-endpoint',
           body: { test: 'data' },
           expectedStatus: 200
         }
       ]
     };

     await this.runTestSuite(testSuite);
   }
   ```

2. **Add to action handler:**
   ```typescript
   case 'new-api':
     await this.testNewAPI();
     break;
   ```

### Extending Documentation Generator

1. **Add new extraction method:**
   ```typescript
   private async extractNewDocType(filePath: string): Promise<NewDocType[]> {
     const content = await fs.readFile(filePath, 'utf-8');
     // Extraction logic
     return extractedDocs;
   }
   ```

2. **Add generation method:**
   ```typescript
   private generateNewDocMarkdown(docs: NewDocType[]): string {
     let markdown = '# New Documentation\n\n';
     // Generation logic
     return markdown;
   }
   ```

3. **Add to main generation:**
   ```typescript
   case 'new-docs':
     await this.generateNewDocumentation();
     break;
   ```

## Best Practices

### Demo Development

1. **Use realistic data:** Provide meaningful examples that showcase real-world usage
2. **Include error scenarios:** Demonstrate error handling and edge cases
3. **Progressive complexity:** Start with simple examples and build up to complex scenarios
4. **Interactive feedback:** Provide clear feedback and progress indicators
5. **Cleanup resources:** Ensure demos clean up after themselves

### API Testing

1. **Comprehensive coverage:** Test all endpoints, methods, and scenarios
2. **Validation logic:** Include response validation beyond status codes
3. **Performance tracking:** Monitor response times and identify slow endpoints
4. **Error handling:** Test error conditions and edge cases
5. **Authentication:** Test both authenticated and unauthenticated scenarios

### Documentation Generation

1. **Accurate extraction:** Ensure code analysis accurately reflects the source
2. **Clear formatting:** Generate well-formatted, readable documentation
3. **Complete coverage:** Include all public APIs and important internal components
4. **Examples inclusion:** Provide practical usage examples
5. **Regular updates:** Keep generated documentation in sync with code changes

## Troubleshooting

### Common Issues

1. **Demo fails to start:**
   ```bash
   # Check Redis connection
   docker-compose ps redis
   
   # Verify environment variables
   cat .env
   
   # Check Node.js version
   node --version  # Should be 18+
   ```

2. **API tests fail:**
   ```bash
   # Verify API server is running
   curl http://localhost:3000/api/health
   
   # Check authentication token
   echo $API_TOKEN
   
   # Verify network connectivity
   ping localhost
   ```

3. **Documentation generation fails:**
   ```bash
   # Check file permissions
   ls -la docs/generated/
   
   # Verify source files exist
   find src -name "*.ts" | head -5
   
   # Check TypeScript compilation
   npm run type-check
   ```

### Debug Mode

Enable debug logging for tools:

```bash
# Set debug environment variable
DEBUG=tools:* npm run demo

# Or for specific tools
DEBUG=tools:demo npm run demo
DEBUG=tools:api-test npm run api-test
DEBUG=tools:docs npm run docs:generate
```

### Performance Issues

If tools are running slowly:

1. **Reduce demo data size**
2. **Limit API test concurrency**
3. **Use incremental documentation generation**
4. **Check system resources**

## Contributing

When contributing new tools or improvements:

1. **Follow TypeScript best practices**
2. **Include comprehensive error handling**
3. **Add progress indicators for long-running operations**
4. **Provide clear user feedback**
5. **Include documentation and examples**
6. **Test thoroughly across different environments**

## Support

For tool-related issues:

- 📖 Check the [main documentation](../docs/README.md)
- 🐛 Report issues on [GitHub](https://github.com/your-org/redis-ai-platform/issues)
- 💬 Ask questions in [Discord](https://discord.gg/redis-ai-platform)
- 📧 Email: tools-support@redis-ai-platform.com