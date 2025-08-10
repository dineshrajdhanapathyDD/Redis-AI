#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { glob } from 'glob';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Parameter[];
  requestBody?: any;
  responses?: Response[];
  examples?: Example[];
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

interface Response {
  status: number;
  description: string;
  schema?: any;
  example?: any;
}

interface Example {
  title: string;
  request: any;
  response: any;
}

interface ServiceDoc {
  name: string;
  description: string;
  methods: MethodDoc[];
}

interface MethodDoc {
  name: string;
  description: string;
  parameters: Parameter[];
  returns: string;
  examples: string[];
}

class DocumentationGenerator {
  private outputDir: string = 'docs/generated';
  private sourceDir: string = 'src';

  async start() {
    console.log(chalk.blue.bold('\n📚 Redis AI Platform - Documentation Generator\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to generate?',
        choices: [
          { name: '📖 API Documentation', value: 'api' },
          { name: '🔧 Service Documentation', value: 'services' },
          { name: '📊 Schema Documentation', value: 'schemas' },
          { name: '🎯 Usage Examples', value: 'examples' },
          { name: '📋 Changelog', value: 'changelog' },
          { name: '🚀 Getting Started Guide', value: 'getting-started' },
          { name: '📈 All Documentation', value: 'all' },
          new inquirer.Separator(),
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') return;

    try {
      await this.ensureOutputDir();
      
      switch (action) {
        case 'api':
          await this.generateAPIDocumentation();
          break;
        case 'services':
          await this.generateServiceDocumentation();
          break;
        case 'schemas':
          await this.generateSchemaDocumentation();
          break;
        case 'examples':
          await this.generateExamples();
          break;
        case 'changelog':
          await this.generateChangelog();
          break;
        case 'getting-started':
          await this.generateGettingStarted();
          break;
        case 'all':
          await this.generateAllDocumentation();
          break;
      }

      console.log(chalk.green(`\n✅ Documentation generated successfully in ${this.outputDir}/`));
      
    } catch (error) {
      console.error(chalk.red('Documentation generation failed:'), error.message);
    }
  }

  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  private async generateAPIDocumentation() {
    console.log(chalk.yellow('📖 Generating API documentation...\n'));

    // Scan API routes
    const routeFiles = await glob(`${this.sourceDir}/api/rest/routes/*.ts`);
    const endpoints: APIEndpoint[] = [];

    for (const file of routeFiles) {
      const routeEndpoints = await this.extractEndpointsFromFile(file);
      endpoints.push(...routeEndpoints);
    }

    // Generate OpenAPI specification
    const openApiSpec = this.generateOpenAPISpec(endpoints);
    await fs.writeFile(
      path.join(this.outputDir, 'openapi.json'),
      JSON.stringify(openApiSpec, null, 2)
    );

    // Generate Markdown documentation
    const markdownDoc = this.generateAPIMarkdown(endpoints);
    await fs.writeFile(
      path.join(this.outputDir, 'api-reference.md'),
      markdownDoc
    );

    // Generate Postman collection
    const postmanCollection = this.generatePostmanCollection(endpoints);
    await fs.writeFile(
      path.join(this.outputDir, 'postman-collection.json'),
      JSON.stringify(postmanCollection, null, 2)
    );

    console.log(chalk.green('✅ API documentation generated'));
    console.log(chalk.gray(`   - OpenAPI spec: ${this.outputDir}/openapi.json`));
    console.log(chalk.gray(`   - Markdown docs: ${this.outputDir}/api-reference.md`));
    console.log(chalk.gray(`   - Postman collection: ${this.outputDir}/postman-collection.json`));
  }

  private async generateServiceDocumentation() {
    console.log(chalk.yellow('🔧 Generating service documentation...\n'));

    const serviceFiles = await glob(`${this.sourceDir}/services/**/*.ts`);
    const services: ServiceDoc[] = [];

    for (const file of serviceFiles) {
      if (file.includes('.test.') || file.includes('/types.ts')) continue;
      
      const serviceDoc = await this.extractServiceDoc(file);
      if (serviceDoc) {
        services.push(serviceDoc);
      }
    }

    // Generate service documentation
    const serviceMarkdown = this.generateServiceMarkdown(services);
    await fs.writeFile(
      path.join(this.outputDir, 'services.md'),
      serviceMarkdown
    );

    // Generate individual service files
    for (const service of services) {
      const individualDoc = this.generateIndividualServiceDoc(service);
      await fs.writeFile(
        path.join(this.outputDir, `service-${service.name.toLowerCase()}.md`),
        individualDoc
      );
    }

    console.log(chalk.green('✅ Service documentation generated'));
    console.log(chalk.gray(`   - Overview: ${this.outputDir}/services.md`));
    console.log(chalk.gray(`   - Individual services: ${this.outputDir}/service-*.md`));
  }

  private async generateSchemaDocumentation() {
    console.log(chalk.yellow('📊 Generating schema documentation...\n'));

    const typeFiles = await glob(`${this.sourceDir}/**/types.ts`);
    const schemas: any[] = [];

    for (const file of typeFiles) {
      const fileSchemas = await this.extractSchemasFromFile(file);
      schemas.push(...fileSchemas);
    }

    const schemaDoc = this.generateSchemaMarkdown(schemas);
    await fs.writeFile(
      path.join(this.outputDir, 'schemas.md'),
      schemaDoc
    );

    // Generate JSON Schema files
    const jsonSchemas = this.generateJSONSchemas(schemas);
    await fs.writeFile(
      path.join(this.outputDir, 'schemas.json'),
      JSON.stringify(jsonSchemas, null, 2)
    );

    console.log(chalk.green('✅ Schema documentation generated'));
    console.log(chalk.gray(`   - Markdown: ${this.outputDir}/schemas.md`));
    console.log(chalk.gray(`   - JSON schemas: ${this.outputDir}/schemas.json`));
  }

  private async generateExamples() {
    console.log(chalk.yellow('🎯 Generating usage examples...\n'));

    const examples = [
      {
        title: 'Multi-Modal Search',
        category: 'Search',
        code: this.getSearchExample()
      },
      {
        title: 'AI Model Routing',
        category: 'AI Routing',
        code: this.getRoutingExample()
      },
      {
        title: 'Collaborative Workspace',
        category: 'Workspace',
        code: this.getWorkspaceExample()
      },
      {
        title: 'Code Intelligence',
        category: 'Code Intelligence',
        code: this.getCodeIntelligenceExample()
      },
      {
        title: 'Performance Optimization',
        category: 'Performance',
        code: this.getPerformanceExample()
      }
    ];

    const examplesDoc = this.generateExamplesMarkdown(examples);
    await fs.writeFile(
      path.join(this.outputDir, 'examples.md'),
      examplesDoc
    );

    // Generate individual example files
    for (const example of examples) {
      await fs.writeFile(
        path.join(this.outputDir, `example-${example.title.toLowerCase().replace(/\s+/g, '-')}.md`),
        this.generateIndividualExample(example)
      );
    }

    console.log(chalk.green('✅ Usage examples generated'));
    console.log(chalk.gray(`   - Overview: ${this.outputDir}/examples.md`));
    console.log(chalk.gray(`   - Individual examples: ${this.outputDir}/example-*.md`));
  }

  private async generateChangelog() {
    console.log(chalk.yellow('📋 Generating changelog...\n'));

    // This would typically read from git commits, package.json, or a changelog file
    const changelog = this.generateChangelogContent();
    
    await fs.writeFile(
      path.join(this.outputDir, 'CHANGELOG.md'),
      changelog
    );

    console.log(chalk.green('✅ Changelog generated'));
    console.log(chalk.gray(`   - File: ${this.outputDir}/CHANGELOG.md`));
  }

  private async generateGettingStarted() {
    console.log(chalk.yellow('🚀 Generating getting started guide...\n'));

    const gettingStarted = this.generateGettingStartedContent();
    
    await fs.writeFile(
      path.join(this.outputDir, 'getting-started.md'),
      gettingStarted
    );

    console.log(chalk.green('✅ Getting started guide generated'));
    console.log(chalk.gray(`   - File: ${this.outputDir}/getting-started.md`));
  }

  private async generateAllDocumentation() {
    console.log(chalk.yellow('📈 Generating all documentation...\n'));

    await this.generateAPIDocumentation();
    await this.generateServiceDocumentation();
    await this.generateSchemaDocumentation();
    await this.generateExamples();
    await this.generateChangelog();
    await this.generateGettingStarted();

    // Generate index file
    const indexContent = this.generateIndexContent();
    await fs.writeFile(
      path.join(this.outputDir, 'README.md'),
      indexContent
    );

    console.log(chalk.green('✅ All documentation generated'));
  }

  // Helper methods for extracting information from source files
  private async extractEndpointsFromFile(filePath: string): Promise<APIEndpoint[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const endpoints: APIEndpoint[] = [];

    // This is a simplified extraction - in practice, you'd use AST parsing
    const routeMatches = content.match(/router\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g);
    
    if (routeMatches) {
      for (const match of routeMatches) {
        const [, method, path] = match.match(/router\.(\w+)\(['"`]([^'"`]+)['"`]/) || [];
        if (method && path) {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            description: `${method.toUpperCase()} ${path}`,
            parameters: [],
            responses: [
              { status: 200, description: 'Success' },
              { status: 400, description: 'Bad Request' },
              { status: 500, description: 'Internal Server Error' }
            ]
          });
        }
      }
    }

    return endpoints;
  }

  private async extractServiceDoc(filePath: string): Promise<ServiceDoc | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.ts');
    
    // Extract class name and methods (simplified)
    const classMatch = content.match(/export class (\w+)/);
    if (!classMatch) return null;

    const className = classMatch[1];
    const methods: MethodDoc[] = [];

    // Extract public methods
    const methodMatches = content.match(/(?:public\s+)?async\s+(\w+)\([^)]*\)(?:\s*:\s*[^{]+)?/g);
    if (methodMatches) {
      for (const match of methodMatches) {
        const methodName = match.match(/(\w+)\(/)?.[1];
        if (methodName && !methodName.startsWith('_')) {
          methods.push({
            name: methodName,
            description: `${methodName} method`,
            parameters: [],
            returns: 'Promise<any>',
            examples: []
          });
        }
      }
    }

    return {
      name: className,
      description: `${className} service`,
      methods
    };
  }

  private async extractSchemasFromFile(filePath: string): Promise<any[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const schemas: any[] = [];

    // Extract interfaces (simplified)
    const interfaceMatches = content.match(/export interface (\w+) \{[^}]+\}/g);
    if (interfaceMatches) {
      for (const match of interfaceMatches) {
        const nameMatch = match.match(/interface (\w+)/);
        if (nameMatch) {
          schemas.push({
            name: nameMatch[1],
            type: 'interface',
            definition: match
          });
        }
      }
    }

    return schemas;
  }

  // Documentation generation methods
  private generateOpenAPISpec(endpoints: APIEndpoint[]): any {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Redis AI Platform API',
        version: '1.0.0',
        description: 'API for the Redis AI Platform'
      },
      servers: [
        { url: 'http://localhost:3000/api', description: 'Development server' },
        { url: 'https://api.redis-ai-platform.com', description: 'Production server' }
      ],
      paths: {} as any
    };

    for (const endpoint of endpoints) {
      if (!spec.paths[endpoint.path]) {
        spec.paths[endpoint.path] = {};
      }

      spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        description: endpoint.description,
        parameters: endpoint.parameters || [],
        responses: endpoint.responses?.reduce((acc, resp) => {
          acc[resp.status] = {
            description: resp.description,
            content: resp.schema ? {
              'application/json': {
                schema: resp.schema
              }
            } : undefined
          };
          return acc;
        }, {} as any) || {
          '200': { description: 'Success' }
        }
      };
    }

    return spec;
  }

  private generateAPIMarkdown(endpoints: APIEndpoint[]): string {
    let markdown = '# API Reference\n\n';
    markdown += 'This document provides detailed information about all available API endpoints.\n\n';

    const groupedEndpoints = this.groupEndpointsByPath(endpoints);

    for (const [group, groupEndpoints] of Object.entries(groupedEndpoints)) {
      markdown += `## ${group}\n\n`;

      for (const endpoint of groupEndpoints) {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `${endpoint.description}\n\n`;

        if (endpoint.parameters && endpoint.parameters.length > 0) {
          markdown += '#### Parameters\n\n';
          markdown += '| Name | Type | Required | Description |\n';
          markdown += '|------|------|----------|-------------|\n';
          
          for (const param of endpoint.parameters) {
            markdown += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
          }
          markdown += '\n';
        }

        if (endpoint.examples && endpoint.examples.length > 0) {
          markdown += '#### Example\n\n';
          const example = endpoint.examples[0];
          markdown += '```bash\n';
          markdown += `curl -X ${endpoint.method} \\\n`;
          markdown += `  http://localhost:3000/api${endpoint.path} \\\n`;
          markdown += `  -H "Content-Type: application/json" \\\n`;
          if (example.request) {
            markdown += `  -d '${JSON.stringify(example.request, null, 2)}'\n`;
          }
          markdown += '```\n\n';
        }
      }
    }

    return markdown;
  }

  private generatePostmanCollection(endpoints: APIEndpoint[]): any {
    return {
      info: {
        name: 'Redis AI Platform API',
        description: 'Postman collection for Redis AI Platform API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: endpoints.map(endpoint => ({
        name: `${endpoint.method} ${endpoint.path}`,
        request: {
          method: endpoint.method,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json'
            }
          ],
          url: {
            raw: `{{baseUrl}}${endpoint.path}`,
            host: ['{{baseUrl}}'],
            path: endpoint.path.split('/').filter(p => p)
          },
          body: endpoint.requestBody ? {
            mode: 'raw',
            raw: JSON.stringify(endpoint.requestBody, null, 2)
          } : undefined
        }
      })),
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3000/api'
        }
      ]
    };
  }

  private generateServiceMarkdown(services: ServiceDoc[]): string {
    let markdown = '# Service Documentation\n\n';
    markdown += 'This document provides information about all available services in the Redis AI Platform.\n\n';

    for (const service of services) {
      markdown += `## ${service.name}\n\n`;
      markdown += `${service.description}\n\n`;

      if (service.methods.length > 0) {
        markdown += '### Methods\n\n';
        
        for (const method of service.methods) {
          markdown += `#### ${method.name}\n\n`;
          markdown += `${method.description}\n\n`;
          
          if (method.parameters.length > 0) {
            markdown += '**Parameters:**\n\n';
            for (const param of method.parameters) {
              markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
            }
            markdown += '\n';
          }
          
          markdown += `**Returns:** ${method.returns}\n\n`;
        }
      }
    }

    return markdown;
  }

  private generateIndividualServiceDoc(service: ServiceDoc): string {
    let markdown = `# ${service.name} Service\n\n`;
    markdown += `${service.description}\n\n`;

    markdown += '## Overview\n\n';
    markdown += `The ${service.name} service provides functionality for...\n\n`;

    markdown += '## Usage\n\n';
    markdown += '```typescript\n';
    markdown += `import { ${service.name} } from '../services/${service.name.toLowerCase()}';\n\n`;
    markdown += `const ${service.name.toLowerCase()} = new ${service.name}(config);\n`;
    markdown += '```\n\n';

    if (service.methods.length > 0) {
      markdown += '## Methods\n\n';
      
      for (const method of service.methods) {
        markdown += `### ${method.name}\n\n`;
        markdown += `${method.description}\n\n`;
        
        markdown += '```typescript\n';
        markdown += `await ${service.name.toLowerCase()}.${method.name}();\n`;
        markdown += '```\n\n';
      }
    }

    return markdown;
  }

  private generateSchemaMarkdown(schemas: any[]): string {
    let markdown = '# Schema Documentation\n\n';
    markdown += 'This document describes all data schemas used in the Redis AI Platform.\n\n';

    for (const schema of schemas) {
      markdown += `## ${schema.name}\n\n`;
      markdown += '```typescript\n';
      markdown += schema.definition;
      markdown += '\n```\n\n';
    }

    return markdown;
  }

  private generateJSONSchemas(schemas: any[]): any {
    const jsonSchemas: any = {};

    for (const schema of schemas) {
      jsonSchemas[schema.name] = {
        type: 'object',
        title: schema.name,
        description: `${schema.name} schema`,
        properties: {}
      };
    }

    return jsonSchemas;
  }

  private generateExamplesMarkdown(examples: any[]): string {
    let markdown = '# Usage Examples\n\n';
    markdown += 'This document provides practical examples of using the Redis AI Platform.\n\n';

    const categories = [...new Set(examples.map(e => e.category))];

    for (const category of categories) {
      markdown += `## ${category}\n\n`;
      
      const categoryExamples = examples.filter(e => e.category === category);
      for (const example of categoryExamples) {
        markdown += `### ${example.title}\n\n`;
        markdown += '```typescript\n';
        markdown += example.code;
        markdown += '\n```\n\n';
      }
    }

    return markdown;
  }

  private generateIndividualExample(example: any): string {
    let markdown = `# ${example.title} Example\n\n`;
    markdown += `This example demonstrates how to use ${example.title.toLowerCase()}.\n\n`;
    
    markdown += '## Code\n\n';
    markdown += '```typescript\n';
    markdown += example.code;
    markdown += '\n```\n\n';

    markdown += '## Explanation\n\n';
    markdown += 'This example shows...\n\n';

    return markdown;
  }

  private generateChangelogContent(): string {
    return `# Changelog

All notable changes to the Redis AI Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Multi-modal search engine with vector similarity
- AI model routing with real-time performance metrics
- Collaborative workspace management
- Adaptive learning and personalization
- Code intelligence with analysis and generation
- Content consistency management
- Predictive optimization engine
- Adaptive UI system
- Performance optimization features
- Comprehensive monitoring and observability
- Security and authentication layer
- Complete testing suite
- Deployment and DevOps infrastructure

### Changed
- Initial release

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- Implemented JWT-based authentication
- Added role-based access control
- Input validation and sanitization
- Rate limiting and DDoS protection

## [Unreleased]

### Added
- Documentation generation tools
- Interactive demo system
- API testing utilities

### Changed
- Improved performance optimization algorithms
- Enhanced error handling and logging

### Fixed
- Minor bug fixes and improvements
`;
  }

  private generateGettingStartedContent(): string {
    return `# Getting Started with Redis AI Platform

Welcome to the Redis AI Platform! This guide will help you get up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18 or higher
- Redis 7.0+ with RedisSearch and RedisTimeSeries modules
- Docker and Docker Compose (optional, for local development)

## Quick Start

### 1. Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/your-org/redis-ai-platform.git
cd redis-ai-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 2. Start Redis

\`\`\`bash
# Using Docker Compose
docker-compose up -d redis

# Or start Redis manually with required modules
redis-server --loadmodule /path/to/redisearch.so --loadmodule /path/to/redistimeseries.so
\`\`\`

### 3. Run the Application

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
\`\`\`

### 4. Verify Installation

\`\`\`bash
# Health check
curl http://localhost:3000/api/health

# Should return: {"status": "healthy"}
\`\`\`

## First Steps

### 1. Multi-Modal Search

\`\`\`typescript
import { MultiModalSearch } from '@redis-ai-platform/sdk';

const search = new MultiModalSearch({
  apiKey: 'your-api-key'
});

const results = await search.search({
  query: 'machine learning algorithms',
  modalities: ['text', 'image'],
  limit: 10
});

console.log(\`Found \${results.total} results\`);
\`\`\`

### 2. AI Model Routing

\`\`\`typescript
import { AIModelRouter } from '@redis-ai-platform/sdk';

const router = new AIModelRouter({
  apiKey: 'your-api-key'
});

const routing = await router.route({
  type: 'text-generation',
  complexity: 'medium'
});

console.log(\`Selected model: \${routing.selectedModel.id}\`);
\`\`\`

### 3. Collaborative Workspace

\`\`\`typescript
import { WorkspaceManager } from '@redis-ai-platform/sdk';

const workspace = new WorkspaceManager({
  apiKey: 'your-api-key'
});

const newWorkspace = await workspace.create({
  name: 'My AI Project',
  description: 'Collaborative AI workspace'
});

console.log(\`Workspace created: \${newWorkspace.id}\`);
\`\`\`

## Next Steps

- Read the [API Documentation](./api-reference.md)
- Explore [Usage Examples](./examples.md)
- Check out the [Service Documentation](./services.md)
- Join our [Discord Community](https://discord.gg/redis-ai-platform)

## Need Help?

- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/your-org/redis-ai-platform/issues)
- 💬 [Community Support](https://discord.gg/redis-ai-platform)
- 📧 [Email Support](mailto:support@redis-ai-platform.com)
`;
  }

  private generateIndexContent(): string {
    return `# Generated Documentation

This directory contains automatically generated documentation for the Redis AI Platform.

## Contents

- [API Reference](./api-reference.md) - Complete API documentation
- [Service Documentation](./services.md) - Service layer documentation
- [Schema Documentation](./schemas.md) - Data schema definitions
- [Usage Examples](./examples.md) - Practical code examples
- [Getting Started](./getting-started.md) - Quick start guide
- [Changelog](./CHANGELOG.md) - Version history

## API Specifications

- [OpenAPI Specification](./openapi.json) - Machine-readable API spec
- [Postman Collection](./postman-collection.json) - Import into Postman
- [JSON Schemas](./schemas.json) - Data validation schemas

## Individual Service Documentation

${this.getServiceFilesList()}

## Individual Examples

${this.getExampleFilesList()}

---

*This documentation was automatically generated on ${new Date().toISOString()}*
`;
  }

  // Utility methods
  private groupEndpointsByPath(endpoints: APIEndpoint[]): Record<string, APIEndpoint[]> {
    return endpoints.reduce((groups, endpoint) => {
      const group = endpoint.path.split('/')[1] || 'root';
      if (!groups[group]) groups[group] = [];
      groups[group].push(endpoint);
      return groups;
    }, {} as Record<string, APIEndpoint[]>);
  }

  private getServiceFilesList(): string {
    // This would be dynamically generated based on actual service files
    return `- [Multi-Modal Search Service](./service-multimodalsearch.md)
- [AI Model Router Service](./service-aimodelrouter.md)
- [Workspace Manager Service](./service-workspacemanager.md)
- [Code Intelligence Service](./service-codeintelligence.md)
- [Performance Monitor Service](./service-performancemonitor.md)`;
  }

  private getExampleFilesList(): string {
    return `- [Multi-Modal Search Example](./example-multi-modal-search.md)
- [AI Model Routing Example](./example-ai-model-routing.md)
- [Collaborative Workspace Example](./example-collaborative-workspace.md)
- [Code Intelligence Example](./example-code-intelligence.md)
- [Performance Optimization Example](./example-performance-optimization.md)`;
  }

  // Example code generators
  private getSearchExample(): string {
    return `import { MultiModalSearch } from '@redis-ai-platform/sdk';

const searchEngine = new MultiModalSearch({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.redis-ai-platform.com'
});

// Basic search
const results = await searchEngine.search({
  query: 'machine learning algorithms',
  modalities: ['text', 'image'],
  limit: 10
});

console.log(\`Found \${results.total} results\`);

// Advanced search with filters
const advancedResults = await searchEngine.search({
  query: 'neural networks',
  modalities: ['text', 'image', 'code'],
  limit: 20,
  filters: {
    category: 'technology',
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    }
  },
  options: {
    includeMetadata: true,
    highlightMatches: true
  }
});`;
  }

  private getRoutingExample(): string {
    return `import { AIModelRouter } from '@redis-ai-platform/sdk';

const router = new AIModelRouter({
  apiKey: 'your-api-key'
});

// Route request to optimal model
const routing = await router.route({
  type: 'text-generation',
  complexity: 'high',
  context: 'code-generation',
  requirements: {
    maxLatency: 2000,
    minAccuracy: 0.9
  }
});

console.log(\`Selected model: \${routing.selectedModel.id}\`);
console.log(\`Estimated cost: $\${routing.estimatedCost}\`);

// Execute with routing
const response = await router.executeWithRouting({
  request: routing,
  prompt: 'Write a function to calculate fibonacci numbers',
  parameters: {
    temperature: 0.7,
    maxTokens: 500
  }
});`;
  }

  private getWorkspaceExample(): string {
    return `import { WorkspaceManager } from '@redis-ai-platform/sdk';

const workspaceManager = new WorkspaceManager({
  apiKey: 'your-api-key'
});

// Create workspace
const workspace = await workspaceManager.create({
  name: 'AI Research Project',
  description: 'Collaborative space for AI research'
});

// Add knowledge
const knowledge = await workspaceManager.addKnowledge(workspace.id, {
  type: 'insight',
  title: 'Key Finding',
  content: 'We discovered that...',
  tags: ['research', 'breakthrough']
});

// Search knowledge
const results = await workspaceManager.searchKnowledge(workspace.id, {
  query: 'neural architecture',
  limit: 10
});`;
  }

  private getCodeIntelligenceExample(): string {
    return `import { CodeIntelligence } from '@redis-ai-platform/sdk';

const codeIntel = new CodeIntelligence({
  apiKey: 'your-api-key'
});

// Analyze code
const analysis = await codeIntel.analyze({
  code: \`
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n-1) + fibonacci(n-2);
    }
  \`,
  language: 'javascript',
  analysisTypes: ['performance', 'security', 'style']
});

console.log(\`Performance score: \${analysis.performance.score}/10\`);

// Generate code
const generated = await codeIntel.generate({
  description: 'Create a React hook for managing user authentication',
  language: 'typescript',
  framework: 'react'
});

console.log('Generated code:', generated.code);`;
  }

  private getPerformanceExample(): string {
    return `import { 
  ConnectionPool, 
  RequestBatcher, 
  PrefetchService 
} from '@redis-ai-platform/performance';

// Connection pooling
const pool = new ConnectionPool({
  minConnections: 5,
  maxConnections: 20
});

// Request batching
const batcher = new RequestBatcher({
  maxBatchSize: 100,
  maxWaitTimeMs: 50
});

// Intelligent prefetching
const prefetch = new PrefetchService({
  enabled: true,
  maxCacheSize: 10000000
});

// Use optimized operations
const redis = await pool.acquire();
try {
  const value = await prefetch.get(redis, 'user:123');
  console.log('Cached value:', value);
} finally {
  pool.release(redis);
}`;
  }
}

// Run the documentation generator if this file is executed directly
if (require.main === module) {
  const generator = new DocumentationGenerator();
  generator.start().catch(error => {
    console.error(chalk.red('Documentation generation failed:'), error);
    process.exit(1);
  });
}

export { DocumentationGenerator };