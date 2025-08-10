#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { MultiModalSearch } from '../src/services/search/multi-modal-search';
import { AIModelRouter } from '../src/services/ai-routing/routing-engine';
import { WorkspaceManager } from '../src/services/workspace/workspace-manager';
import { CodeIntelligence } from '../src/services/code-intelligence/code-analyzer';
import { PerformanceMonitor } from '../src/services/performance/performance-monitor';
import { logger } from '../src/utils/logger';

interface DemoChoice {
  name: string;
  value: string;
  description: string;
}

const DEMO_CHOICES: DemoChoice[] = [
  {
    name: '🔍 Multi-Modal Search Demo',
    value: 'search',
    description: 'Search across text, images, audio, and code using natural language'
  },
  {
    name: '🤖 AI Model Routing Demo',
    value: 'routing',
    description: 'Intelligent routing to optimal AI models based on real-time metrics'
  },
  {
    name: '👥 Collaborative Workspace Demo',
    value: 'workspace',
    description: 'Real-time collaboration with shared AI contexts and knowledge'
  },
  {
    name: '💡 Code Intelligence Demo',
    value: 'code',
    description: 'AI-powered code analysis, generation, and optimization'
  },
  {
    name: '⚡ Performance Optimization Demo',
    value: 'performance',
    description: 'Connection pooling, batching, caching, and query optimization'
  },
  {
    name: '🎯 Complete Workflow Demo',
    value: 'workflow',
    description: 'End-to-end demonstration of all platform features'
  },
  {
    name: '📊 Interactive Benchmarks',
    value: 'benchmarks',
    description: 'Run performance benchmarks and compare results'
  },
  {
    name: '🛠️ Developer Tools',
    value: 'tools',
    description: 'Access developer utilities and debugging tools'
  }
];

class InteractiveDemo {
  private searchEngine: MultiModalSearch;
  private aiRouter: AIModelRouter;
  private workspaceManager: WorkspaceManager;
  private codeIntelligence: CodeIntelligence;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    // Initialize services with demo configurations
    this.initializeServices();
  }

  private initializeServices() {
    // Mock configurations for demo purposes
    this.searchEngine = new MultiModalSearch({
      redis: { host: 'localhost', port: 6379 },
      embeddings: { provider: 'openai', model: 'text-embedding-ada-002' }
    });

    this.aiRouter = new AIModelRouter({
      models: ['gpt-4', 'claude-3-opus', 'local-model'],
      redis: { host: 'localhost', port: 6379 }
    });

    this.workspaceManager = new WorkspaceManager({
      redis: { host: 'localhost', port: 6379 }
    });

    this.codeIntelligence = new CodeIntelligence({
      models: ['gpt-4', 'claude-3-opus'],
      redis: { host: 'localhost', port: 6379 }
    });

    this.performanceMonitor = new PerformanceMonitor();
  }

  async start() {
    console.log(chalk.blue.bold('\n🚀 Redis AI Platform - Interactive Demo\n'));
    console.log(chalk.gray('Welcome to the interactive demonstration of the Redis AI Platform.'));
    console.log(chalk.gray('This demo showcases all the key features and capabilities.\n'));

    while (true) {
      try {
        const { choice } = await inquirer.prompt([
          {
            type: 'list',
            name: 'choice',
            message: 'What would you like to explore?',
            choices: [
              ...DEMO_CHOICES,
              new inquirer.Separator(),
              { name: '❌ Exit Demo', value: 'exit' }
            ],
            pageSize: 12
          }
        ]);

        if (choice === 'exit') {
          console.log(chalk.green('\nThank you for exploring the Redis AI Platform! 🎉'));
          process.exit(0);
        }

        await this.runDemo(choice);
        
        // Ask if user wants to continue
        const { continue: shouldContinue } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continue',
            message: 'Would you like to try another demo?',
            default: true
          }
        ]);

        if (!shouldContinue) {
          console.log(chalk.green('\nThank you for exploring the Redis AI Platform! 🎉'));
          break;
        }

        console.log('\n' + '='.repeat(60) + '\n');
      } catch (error) {
        console.error(chalk.red('Demo error:'), error.message);
        
        const { retry } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'retry',
            message: 'Would you like to try again?',
            default: true
          }
        ]);

        if (!retry) break;
      }
    }
  }

  private async runDemo(choice: string) {
    switch (choice) {
      case 'search':
        await this.runSearchDemo();
        break;
      case 'routing':
        await this.runRoutingDemo();
        break;
      case 'workspace':
        await this.runWorkspaceDemo();
        break;
      case 'code':
        await this.runCodeDemo();
        break;
      case 'performance':
        await this.runPerformanceDemo();
        break;
      case 'workflow':
        await this.runWorkflowDemo();
        break;
      case 'benchmarks':
        await this.runBenchmarks();
        break;
      case 'tools':
        await this.runDeveloperTools();
        break;
      default:
        console.log(chalk.red('Unknown demo choice'));
    }
  }

  private async runSearchDemo() {
    console.log(chalk.blue.bold('\n🔍 Multi-Modal Search Demo\n'));
    
    const { query, modalities } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'Enter your search query:',
        default: 'machine learning algorithms'
      },
      {
        type: 'checkbox',
        name: 'modalities',
        message: 'Select content types to search:',
        choices: [
          { name: 'Text documents', value: 'text', checked: true },
          { name: 'Images', value: 'image', checked: true },
          { name: 'Audio files', value: 'audio', checked: false },
          { name: 'Code repositories', value: 'code', checked: true }
        ]
      }
    ]);

    console.log(chalk.yellow('\n⏳ Searching across selected modalities...\n'));

    try {
      // Simulate search with mock data
      const results = await this.simulateSearch(query, modalities);
      
      console.log(chalk.green(`✅ Found ${results.total} results in ${results.queryTime}ms\n`));
      
      results.results.forEach((result, index) => {
        console.log(chalk.cyan(`${index + 1}. ${result.title}`));
        console.log(chalk.gray(`   Type: ${result.type} | Score: ${result.score.toFixed(3)}`));
        console.log(chalk.white(`   ${result.content.substring(0, 100)}...`));
        if (result.highlights) {
          console.log(chalk.yellow(`   Highlights: ${result.highlights.join(', ')}`));
        }
        console.log();
      });

      // Show facets
      if (results.facets) {
        console.log(chalk.blue('📊 Search Facets:'));
        Object.entries(results.facets).forEach(([key, values]) => {
          console.log(chalk.gray(`   ${key}:`), values);
        });
      }

    } catch (error) {
      console.error(chalk.red('Search failed:'), error.message);
    }
  }

  private async runRoutingDemo() {
    console.log(chalk.blue.bold('\n🤖 AI Model Routing Demo\n'));
    
    const { requestType, complexity, context } = await inquirer.prompt([
      {
        type: 'list',
        name: 'requestType',
        message: 'What type of AI request?',
        choices: [
          'text-generation',
          'code-generation',
          'image-analysis',
          'question-answering',
          'summarization'
        ]
      },
      {
        type: 'list',
        name: 'complexity',
        message: 'Request complexity:',
        choices: ['low', 'medium', 'high']
      },
      {
        type: 'input',
        name: 'context',
        message: 'Context (optional):',
        default: 'general'
      }
    ]);

    console.log(chalk.yellow('\n⏳ Finding optimal AI model...\n'));

    try {
      const routing = await this.simulateRouting({
        type: requestType,
        complexity,
        context
      });

      console.log(chalk.green('✅ Optimal model selected!\n'));
      console.log(chalk.cyan(`🎯 Selected Model: ${routing.selectedModel.id}`));
      console.log(chalk.gray(`   Provider: ${routing.selectedModel.provider}`));
      console.log(chalk.gray(`   Confidence: ${(routing.selectedModel.confidence * 100).toFixed(1)}%`));
      console.log(chalk.gray(`   Estimated Cost: $${routing.estimatedCost.toFixed(4)}`));
      console.log(chalk.gray(`   Estimated Latency: ${routing.estimatedLatency}ms\n`));

      console.log(chalk.blue('🤔 Routing Reasoning:'));
      routing.reasoning.factors.forEach(factor => {
        console.log(chalk.gray(`   • ${factor}`));
      });

      if (routing.alternatives.length > 0) {
        console.log(chalk.blue('\n🔄 Alternative Models:'));
        routing.alternatives.forEach(alt => {
          console.log(chalk.gray(`   • ${alt.id} (confidence: ${(alt.confidence * 100).toFixed(1)}%)`));
        });
      }

    } catch (error) {
      console.error(chalk.red('Routing failed:'), error.message);
    }
  }

  private async runWorkspaceDemo() {
    console.log(chalk.blue.bold('\n👥 Collaborative Workspace Demo\n'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Create a new workspace', value: 'create' },
          { name: 'Add knowledge to workspace', value: 'add-knowledge' },
          { name: 'Search workspace knowledge', value: 'search-knowledge' },
          { name: 'View knowledge graph', value: 'knowledge-graph' },
          { name: 'Simulate real-time collaboration', value: 'realtime' }
        ]
      }
    ]);

    switch (action) {
      case 'create':
        await this.createWorkspaceDemo();
        break;
      case 'add-knowledge':
        await this.addKnowledgeDemo();
        break;
      case 'search-knowledge':
        await this.searchKnowledgeDemo();
        break;
      case 'knowledge-graph':
        await this.knowledgeGraphDemo();
        break;
      case 'realtime':
        await this.realtimeCollaborationDemo();
        break;
    }
  }

  private async createWorkspaceDemo() {
    const { name, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Workspace name:',
        default: 'AI Research Project'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: 'Collaborative space for AI research and development'
      }
    ]);

    console.log(chalk.yellow('\n⏳ Creating workspace...\n'));

    const workspace = await this.simulateWorkspaceCreation(name, description);
    
    console.log(chalk.green('✅ Workspace created successfully!\n'));
    console.log(chalk.cyan(`📁 Workspace: ${workspace.name}`));
    console.log(chalk.gray(`   ID: ${workspace.id}`));
    console.log(chalk.gray(`   Created: ${workspace.createdAt}`));
    console.log(chalk.gray(`   Members: ${workspace.members.length}`));
    console.log(chalk.gray(`   Invite Code: ${workspace.inviteCode}`));
  }

  private async runCodeDemo() {
    console.log(chalk.blue.bold('\n💡 Code Intelligence Demo\n'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Analyze code for issues', value: 'analyze' },
          { name: 'Generate code from description', value: 'generate' },
          { name: 'Get optimization suggestions', value: 'optimize' },
          { name: 'Generate unit tests', value: 'test' }
        ]
      }
    ]);

    switch (action) {
      case 'analyze':
        await this.analyzeCodeDemo();
        break;
      case 'generate':
        await this.generateCodeDemo();
        break;
      case 'optimize':
        await this.optimizeCodeDemo();
        break;
      case 'test':
        await this.generateTestsDemo();
        break;
    }
  }

  private async analyzeCodeDemo() {
    const { code, language } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'code',
        message: 'Enter code to analyze:',
        default: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}`
      },
      {
        type: 'list',
        name: 'language',
        message: 'Programming language:',
        choices: ['javascript', 'typescript', 'python', 'java', 'go']
      }
    ]);

    console.log(chalk.yellow('\n⏳ Analyzing code...\n'));

    const analysis = await this.simulateCodeAnalysis(code, language);
    
    console.log(chalk.green('✅ Code analysis complete!\n'));
    
    // Performance analysis
    console.log(chalk.blue('🚀 Performance Analysis:'));
    console.log(chalk.gray(`   Score: ${analysis.performance.score}/10`));
    analysis.performance.issues.forEach(issue => {
      const color = issue.severity === 'high' ? chalk.red : issue.severity === 'medium' ? chalk.yellow : chalk.gray;
      console.log(color(`   ${issue.severity.toUpperCase()}: ${issue.message}`));
      console.log(chalk.gray(`   Suggestion: ${issue.suggestion}`));
    });

    // Security analysis
    console.log(chalk.blue('\n🔒 Security Analysis:'));
    console.log(chalk.gray(`   Score: ${analysis.security.score}/10`));
    if (analysis.security.issues.length === 0) {
      console.log(chalk.green('   No security issues found'));
    }

    // Suggestions
    if (analysis.suggestions.length > 0) {
      console.log(chalk.blue('\n💡 Optimization Suggestions:'));
      analysis.suggestions.forEach(suggestion => {
        console.log(chalk.cyan(`   ${suggestion.title}`));
        console.log(chalk.gray(`   ${suggestion.explanation}`));
      });
    }
  }

  private async runPerformanceDemo() {
    console.log(chalk.blue.bold('\n⚡ Performance Optimization Demo\n'));
    
    const { feature } = await inquirer.prompt([
      {
        type: 'list',
        name: 'feature',
        message: 'Which performance feature would you like to explore?',
        choices: [
          { name: 'Connection Pooling', value: 'pooling' },
          { name: 'Request Batching', value: 'batching' },
          { name: 'Intelligent Prefetching', value: 'prefetching' },
          { name: 'Query Optimization', value: 'optimization' },
          { name: 'Performance Monitoring', value: 'monitoring' },
          { name: 'Load Testing', value: 'load-test' }
        ]
      }
    ]);

    switch (feature) {
      case 'pooling':
        await this.connectionPoolingDemo();
        break;
      case 'batching':
        await this.requestBatchingDemo();
        break;
      case 'prefetching':
        await this.prefetchingDemo();
        break;
      case 'optimization':
        await this.queryOptimizationDemo();
        break;
      case 'monitoring':
        await this.performanceMonitoringDemo();
        break;
      case 'load-test':
        await this.loadTestingDemo();
        break;
    }
  }

  private async performanceMonitoringDemo() {
    console.log(chalk.yellow('\n⏳ Collecting performance metrics...\n'));

    const metrics = this.performanceMonitor.getMetrics();
    
    console.log(chalk.green('✅ Performance metrics collected!\n'));
    
    console.log(chalk.blue('📊 Current Performance Metrics:'));
    console.log(chalk.gray(`   Memory Usage: ${(metrics.memoryUsage.heap / 1024 / 1024).toFixed(1)}MB`));
    console.log(chalk.gray(`   Connection Pool Utilization: ${(metrics.connectionPoolUtilization * 100).toFixed(1)}%`));
    console.log(chalk.gray(`   Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`));
    console.log(chalk.gray(`   Query Latency P95: ${metrics.queryLatency.p95}ms`));

    const recommendations = this.performanceMonitor.generateOptimizationRecommendations();
    
    if (recommendations.length > 0) {
      console.log(chalk.blue('\n🎯 Optimization Recommendations:'));
      recommendations.forEach((rec, index) => {
        const severityColor = rec.severity === 'high' ? chalk.red : rec.severity === 'medium' ? chalk.yellow : chalk.gray;
        console.log(severityColor(`   ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.description}`));
        console.log(chalk.gray(`      Action: ${rec.action}`));
        console.log(chalk.gray(`      Expected improvement: ${rec.expectedImprovement}`));
      });
    } else {
      console.log(chalk.green('\n✅ No performance issues detected!'));
    }
  }

  private async runBenchmarks() {
    console.log(chalk.blue.bold('\n📊 Interactive Benchmarks\n'));
    
    const { benchmark } = await inquirer.prompt([
      {
        type: 'list',
        name: 'benchmark',
        message: 'Which benchmark would you like to run?',
        choices: [
          { name: 'Search Performance', value: 'search' },
          { name: 'Connection Pool Performance', value: 'pool' },
          { name: 'Caching Efficiency', value: 'cache' },
          { name: 'End-to-End Latency', value: 'e2e' },
          { name: 'Concurrent Users', value: 'concurrent' }
        ]
      }
    ]);

    console.log(chalk.yellow('\n⏳ Running benchmark...\n'));

    const results = await this.runBenchmark(benchmark);
    
    console.log(chalk.green('✅ Benchmark completed!\n'));
    console.log(chalk.blue('📈 Results:'));
    Object.entries(results).forEach(([key, value]) => {
      console.log(chalk.gray(`   ${key}: ${value}`));
    });
  }

  private async runDeveloperTools() {
    console.log(chalk.blue.bold('\n🛠️ Developer Tools\n'));
    
    const { tool } = await inquirer.prompt([
      {
        type: 'list',
        name: 'tool',
        message: 'Which developer tool would you like to use?',
        choices: [
          { name: 'System Health Check', value: 'health' },
          { name: 'Configuration Validator', value: 'config' },
          { name: 'Redis Connection Test', value: 'redis' },
          { name: 'API Endpoint Test', value: 'api' },
          { name: 'Performance Profiler', value: 'profiler' },
          { name: 'Log Analyzer', value: 'logs' }
        ]
      }
    ]);

    switch (tool) {
      case 'health':
        await this.systemHealthCheck();
        break;
      case 'config':
        await this.configurationValidator();
        break;
      case 'redis':
        await this.redisConnectionTest();
        break;
      case 'api':
        await this.apiEndpointTest();
        break;
      case 'profiler':
        await this.performanceProfiler();
        break;
      case 'logs':
        await this.logAnalyzer();
        break;
    }
  }

  // Simulation methods (mock implementations for demo purposes)
  private async simulateSearch(query: string, modalities: string[]) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      total: 42,
      queryTime: 87,
      results: [
        {
          id: '1',
          title: 'Introduction to Machine Learning Algorithms',
          type: 'text',
          content: 'Machine learning algorithms are computational methods that enable systems to learn and improve from experience...',
          score: 0.95,
          highlights: ['machine learning', 'algorithms']
        },
        {
          id: '2',
          title: 'Neural Network Architecture Diagram',
          type: 'image',
          content: 'Visual representation of a deep neural network with multiple hidden layers...',
          score: 0.89,
          highlights: []
        },
        {
          id: '3',
          title: 'ML Algorithm Implementation',
          type: 'code',
          content: 'def gradient_descent(X, y, learning_rate=0.01): # Implementation of gradient descent algorithm...',
          score: 0.82,
          highlights: ['gradient_descent', 'algorithm']
        }
      ],
      facets: {
        modalities: { text: 25, image: 12, code: 5 },
        categories: { technology: 35, research: 7 }
      }
    };
  }

  private async simulateRouting(request: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      selectedModel: {
        id: 'gpt-4-turbo',
        provider: 'openai',
        confidence: 0.94
      },
      alternatives: [
        { id: 'claude-3-opus', provider: 'anthropic', confidence: 0.87 },
        { id: 'local-model', provider: 'local', confidence: 0.72 }
      ],
      reasoning: {
        factors: [
          'High complexity requires advanced model capabilities',
          'Code generation context favors GPT-4 architecture',
          'Current latency metrics are within acceptable range',
          'Cost optimization not prioritized for this request'
        ]
      },
      estimatedCost: 0.0023,
      estimatedLatency: 1250
    };
  }

  private async simulateWorkspaceCreation(name: string, description: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: 'workspace-' + Math.random().toString(36).substr(2, 9),
      name,
      description,
      createdAt: new Date().toISOString(),
      members: [
        { id: 'user-1', name: 'Demo User', role: 'owner' }
      ],
      inviteCode: Math.random().toString(36).substr(2, 8).toUpperCase()
    };
  }

  private async simulateCodeAnalysis(code: string, language: string) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      performance: {
        score: 3,
        issues: [
          {
            type: 'inefficient-recursion',
            line: 3,
            severity: 'high',
            message: 'Recursive fibonacci has exponential time complexity O(2^n)',
            suggestion: 'Use dynamic programming or iterative approach for O(n) complexity'
          }
        ]
      },
      security: {
        score: 8,
        issues: []
      },
      style: {
        score: 9,
        issues: []
      },
      suggestions: [
        {
          title: 'Optimize Fibonacci Implementation',
          explanation: 'Replace recursive approach with memoization to improve performance from O(2^n) to O(n)',
          code: 'function fibonacci(n, memo = {}) {\n  if (n <= 1) return n;\n  if (memo[n]) return memo[n];\n  memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo);\n  return memo[n];\n}'
        }
      ]
    };
  }

  private async runBenchmark(type: string) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const benchmarks = {
      search: {
        'Average Latency': '87ms',
        'P95 Latency': '156ms',
        'Throughput': '1,247 queries/sec',
        'Cache Hit Rate': '89.3%'
      },
      pool: {
        'Connection Acquisition': '2.3ms',
        'Pool Utilization': '67%',
        'Active Connections': '12/20',
        'Connection Reuse Rate': '94.2%'
      },
      cache: {
        'Hit Rate': '91.7%',
        'Miss Penalty': '45ms',
        'Eviction Rate': '2.1%',
        'Memory Usage': '156MB/200MB'
      },
      e2e: {
        'Total Request Time': '234ms',
        'Network Latency': '12ms',
        'Processing Time': '198ms',
        'Queue Time': '24ms'
      },
      concurrent: {
        'Max Concurrent Users': '1,000',
        'Average Response Time': '145ms',
        'Error Rate': '0.02%',
        'Throughput': '2,340 req/sec'
      }
    };

    return benchmarks[type] || {};
  }

  private async systemHealthCheck() {
    console.log(chalk.yellow('\n⏳ Running system health check...\n'));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const checks = [
      { name: 'Redis Connection', status: 'healthy', latency: '2ms' },
      { name: 'API Endpoints', status: 'healthy', latency: '45ms' },
      { name: 'Search Indices', status: 'healthy', count: '12 indices' },
      { name: 'Memory Usage', status: 'warning', usage: '78%' },
      { name: 'Disk Space', status: 'healthy', usage: '34%' },
      { name: 'Background Jobs', status: 'healthy', active: '3 jobs' }
    ];

    console.log(chalk.green('✅ Health check completed!\n'));
    
    checks.forEach(check => {
      const statusColor = check.status === 'healthy' ? chalk.green : 
                         check.status === 'warning' ? chalk.yellow : chalk.red;
      console.log(`${statusColor('●')} ${check.name}: ${statusColor(check.status)}`);
      if (check.latency) console.log(chalk.gray(`   Latency: ${check.latency}`));
      if (check.usage) console.log(chalk.gray(`   Usage: ${check.usage}`));
      if (check.count) console.log(chalk.gray(`   Count: ${check.count}`));
      if (check.active) console.log(chalk.gray(`   Active: ${check.active}`));
    });
  }

  // Additional demo methods would be implemented here...
  private async addKnowledgeDemo() { /* Implementation */ }
  private async searchKnowledgeDemo() { /* Implementation */ }
  private async knowledgeGraphDemo() { /* Implementation */ }
  private async realtimeCollaborationDemo() { /* Implementation */ }
  private async generateCodeDemo() { /* Implementation */ }
  private async optimizeCodeDemo() { /* Implementation */ }
  private async generateTestsDemo() { /* Implementation */ }
  private async connectionPoolingDemo() { /* Implementation */ }
  private async requestBatchingDemo() { /* Implementation */ }
  private async prefetchingDemo() { /* Implementation */ }
  private async queryOptimizationDemo() { /* Implementation */ }
  private async loadTestingDemo() { /* Implementation */ }
  private async runWorkflowDemo() { /* Implementation */ }
  private async configurationValidator() { /* Implementation */ }
  private async redisConnectionTest() { /* Implementation */ }
  private async apiEndpointTest() { /* Implementation */ }
  private async performanceProfiler() { /* Implementation */ }
  private async logAnalyzer() { /* Implementation */ }
}

// Run the interactive demo if this file is executed directly
if (require.main === module) {
  const demo = new InteractiveDemo();
  demo.start().catch(error => {
    console.error(chalk.red('Demo failed:'), error);
    process.exit(1);
  });
}

export { InteractiveDemo };