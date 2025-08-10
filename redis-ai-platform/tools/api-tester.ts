#!/usr/bin/env node

import axios, { AxiosResponse } from 'axios';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { performance } from 'perf_hooks';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
  data?: any;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
}

interface TestCase {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number;
  validate?: (response: any) => boolean;
}

class APITester {
  private baseUrl: string;
  private authToken?: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  async start() {
    console.log(chalk.blue.bold('\n🧪 Redis AI Platform - API Tester\n'));
    
    // Get configuration
    await this.configure();
    
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🔍 Test Search API', value: 'search' },
            { name: '🤖 Test AI Routing API', value: 'routing' },
            { name: '👥 Test Workspace API', value: 'workspace' },
            { name: '💡 Test Code Intelligence API', value: 'code' },
            { name: '📊 Test Monitoring API', value: 'monitoring' },
            { name: '🔐 Test Authentication API', value: 'auth' },
            { name: '⚡ Run All Tests', value: 'all' },
            { name: '📈 Custom Test', value: 'custom' },
            { name: '📋 View Results', value: 'results' },
            new inquirer.Separator(),
            { name: '❌ Exit', value: 'exit' }
          ]
        }
      ]);

      if (action === 'exit') break;

      try {
        await this.runAction(action);
      } catch (error) {
        console.error(chalk.red('Test failed:'), error.message);
      }

      console.log('\n' + '='.repeat(60) + '\n');
    }
  }

  private async configure() {
    const config = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'API Base URL:',
        default: this.baseUrl
      },
      {
        type: 'input',
        name: 'authToken',
        message: 'Authentication Token (optional):',
        when: () => true
      }
    ]);

    this.baseUrl = config.baseUrl;
    this.authToken = config.authToken;

    console.log(chalk.green(`✅ Configuration set: ${this.baseUrl}\n`));
  }

  private async runAction(action: string) {
    switch (action) {
      case 'search':
        await this.testSearchAPI();
        break;
      case 'routing':
        await this.testRoutingAPI();
        break;
      case 'workspace':
        await this.testWorkspaceAPI();
        break;
      case 'code':
        await this.testCodeAPI();
        break;
      case 'monitoring':
        await this.testMonitoringAPI();
        break;
      case 'auth':
        await this.testAuthAPI();
        break;
      case 'all':
        await this.runAllTests();
        break;
      case 'custom':
        await this.runCustomTest();
        break;
      case 'results':
        this.showResults();
        break;
    }
  }

  private async testSearchAPI() {
    console.log(chalk.blue.bold('🔍 Testing Search API\n'));

    const testSuite: TestSuite = {
      name: 'Search API',
      tests: [
        {
          name: 'Basic text search',
          method: 'POST',
          endpoint: '/search',
          body: {
            query: 'machine learning',
            modalities: ['text'],
            limit: 10
          },
          expectedStatus: 200,
          validate: (response) => response.data.total >= 0 && Array.isArray(response.data.results)
        },
        {
          name: 'Multi-modal search',
          method: 'POST',
          endpoint: '/search',
          body: {
            query: 'artificial intelligence',
            modalities: ['text', 'image', 'code'],
            limit: 20,
            filters: {
              category: 'technology'
            }
          },
          expectedStatus: 200
        },
        {
          name: 'Search with invalid query',
          method: 'POST',
          endpoint: '/search',
          body: {
            query: '',
            modalities: ['text']
          },
          expectedStatus: 400
        },
        {
          name: 'Search index status',
          method: 'GET',
          endpoint: '/search/indices',
          expectedStatus: 200
        }
      ]
    };

    await this.runTestSuite(testSuite);
  }

  private async testRoutingAPI() {
    console.log(chalk.blue.bold('🤖 Testing AI Routing API\n'));

    const testSuite: TestSuite = {
      name: 'AI Routing API',
      tests: [
        {
          name: 'Route text generation request',
          method: 'POST',
          endpoint: '/ai-routing/route',
          body: {
            request: {
              type: 'text-generation',
              complexity: 'medium',
              context: 'general'
            }
          },
          expectedStatus: 200,
          validate: (response) => response.data.selectedModel && response.data.selectedModel.id
        },
        {
          name: 'Route code generation request',
          method: 'POST',
          endpoint: '/ai-routing/route',
          body: {
            request: {
              type: 'code-generation',
              complexity: 'high',
              context: 'typescript-react',
              requirements: {
                maxLatency: 2000,
                minAccuracy: 0.9
              }
            }
          },
          expectedStatus: 200
        },
        {
          name: 'Get model metrics',
          method: 'GET',
          endpoint: '/ai-routing/metrics',
          expectedStatus: 200,
          validate: (response) => Array.isArray(response.data.models)
        },
        {
          name: 'Invalid routing request',
          method: 'POST',
          endpoint: '/ai-routing/route',
          body: {
            request: {
              type: 'invalid-type'
            }
          },
          expectedStatus: 400
        }
      ]
    };

    await this.runTestSuite(testSuite);
  }

  private async testWorkspaceAPI() {
    console.log(chalk.blue.bold('👥 Testing Workspace API\n'));

    let workspaceId: string;

    const testSuite: TestSuite = {
      name: 'Workspace API',
      tests: [
        {
          name: 'Create workspace',
          method: 'POST',
          endpoint: '/workspace',
          body: {
            name: 'Test Workspace',
            description: 'API testing workspace',
            settings: {
              visibility: 'private'
            }
          },
          expectedStatus: 201,
          validate: (response) => {
            workspaceId = response.data.id;
            return response.data.id && response.data.name === 'Test Workspace';
          }
        },
        {
          name: 'Get workspace',
          method: 'GET',
          endpoint: `/workspace/${workspaceId}`,
          expectedStatus: 200
        },
        {
          name: 'Add knowledge to workspace',
          method: 'POST',
          endpoint: `/workspace/${workspaceId}/knowledge`,
          body: {
            type: 'insight',
            title: 'Test Knowledge',
            content: 'This is test knowledge for API testing',
            tags: ['test', 'api']
          },
          expectedStatus: 201
        },
        {
          name: 'Search workspace knowledge',
          method: 'POST',
          endpoint: `/workspace/${workspaceId}/knowledge/search`,
          body: {
            query: 'test knowledge',
            limit: 10
          },
          expectedStatus: 200
        }
      ]
    };

    await this.runTestSuite(testSuite);
  }

  private async testCodeAPI() {
    console.log(chalk.blue.bold('💡 Testing Code Intelligence API\n'));

    const testSuite: TestSuite = {
      name: 'Code Intelligence API',
      tests: [
        {
          name: 'Analyze JavaScript code',
          method: 'POST',
          endpoint: '/code-intelligence/analyze',
          body: {
            code: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
            language: 'javascript',
            analysisTypes: ['performance', 'security', 'style']
          },
          expectedStatus: 200,
          validate: (response) => response.data.analysis && response.data.analysis.performance
        },
        {
          name: 'Generate code from description',
          method: 'POST',
          endpoint: '/code-intelligence/generate',
          body: {
            description: 'Create a function to calculate the factorial of a number',
            language: 'javascript',
            style: 'functional'
          },
          expectedStatus: 200,
          validate: (response) => response.data.code && response.data.explanation
        },
        {
          name: 'Invalid code analysis',
          method: 'POST',
          endpoint: '/code-intelligence/analyze',
          body: {
            code: '',
            language: 'javascript'
          },
          expectedStatus: 400
        }
      ]
    };

    await this.runTestSuite(testSuite);
  }

  private async testMonitoringAPI() {
    console.log(chalk.blue.bold('📊 Testing Monitoring API\n'));

    const testSuite: TestSuite = {
      name: 'Monitoring API',
      tests: [
        {
          name: 'Health check',
          method: 'GET',
          endpoint: '/health',
          expectedStatus: 200,
          validate: (response) => response.data.status === 'healthy'
        },
        {
          name: 'Detailed health check',
          method: 'GET',
          endpoint: '/health/detailed',
          expectedStatus: 200,
          validate: (response) => response.data.components && typeof response.data.components === 'object'
        },
        {
          name: 'Performance metrics',
          method: 'GET',
          endpoint: '/metrics',
          expectedStatus: 200,
          validate: (response) => response.data.memory && response.data.performance
        },
        {
          name: 'System status',
          method: 'GET',
          endpoint: '/monitoring/status',
          expectedStatus: 200
        }
      ]
    };

    await this.runTestSuite(testSuite);
  }

  private async testAuthAPI() {
    console.log(chalk.blue.bold('🔐 Testing Authentication API\n'));

    const testSuite: TestSuite = {
      name: 'Authentication API',
      tests: [
        {
          name: 'Login with valid credentials',
          method: 'POST',
          endpoint: '/auth/login',
          body: {
            email: 'test@example.com',
            password: 'testpassword'
          },
          expectedStatus: 200,
          validate: (response) => response.data.token && response.data.user
        },
        {
          name: 'Login with invalid credentials',
          method: 'POST',
          endpoint: '/auth/login',
          body: {
            email: 'invalid@example.com',
            password: 'wrongpassword'
          },
          expectedStatus: 401
        },
        {
          name: 'Get user profile',
          method: 'GET',
          endpoint: '/auth/profile',
          expectedStatus: 200
        },
        {
          name: 'Refresh token',
          method: 'POST',
          endpoint: '/auth/refresh',
          body: {
            refreshToken: 'mock-refresh-token'
          },
          expectedStatus: 200
        }
      ]
    };

    await this.runTestSuite(testSuite);
  }

  private async runAllTests() {
    console.log(chalk.blue.bold('⚡ Running All API Tests\n'));

    const testSuites = [
      'search',
      'routing',
      'workspace',
      'code',
      'monitoring',
      'auth'
    ];

    for (const suite of testSuites) {
      await this.runAction(suite);
      console.log();
    }

    this.showSummary();
  }

  private async runCustomTest() {
    console.log(chalk.blue.bold('📈 Custom API Test\n'));

    const customTest = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: 'HTTP Method:',
        choices: ['GET', 'POST', 'PUT', 'DELETE']
      },
      {
        type: 'input',
        name: 'endpoint',
        message: 'Endpoint (without base URL):',
        validate: (input) => input.startsWith('/') || 'Endpoint must start with /'
      },
      {
        type: 'editor',
        name: 'body',
        message: 'Request Body (JSON):',
        when: (answers) => ['POST', 'PUT'].includes(answers.method),
        default: '{}'
      },
      {
        type: 'input',
        name: 'expectedStatus',
        message: 'Expected Status Code:',
        default: '200',
        validate: (input) => !isNaN(parseInt(input)) || 'Must be a number'
      }
    ]);

    const testCase: TestCase = {
      name: 'Custom Test',
      method: customTest.method,
      endpoint: customTest.endpoint,
      expectedStatus: parseInt(customTest.expectedStatus)
    };

    if (customTest.body) {
      try {
        testCase.body = JSON.parse(customTest.body);
      } catch (error) {
        console.error(chalk.red('Invalid JSON in request body'));
        return;
      }
    }

    await this.runTestSuite({
      name: 'Custom Test',
      tests: [testCase]
    });
  }

  private async runTestSuite(testSuite: TestSuite) {
    console.log(chalk.cyan(`Running ${testSuite.name} tests...\n`));

    for (const test of testSuite.tests) {
      const result = await this.runTest(test);
      this.results.push(result);
      this.displayTestResult(result);
    }

    const passed = this.results.filter(r => r.success).length;
    const total = testSuite.tests.length;
    
    console.log(chalk.blue(`\n${testSuite.name} Summary: ${passed}/${total} tests passed`));
  }

  private async runTest(test: TestCase): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const config: any = {
        method: test.method,
        url: `${this.baseUrl}${test.endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      };

      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }

      if (test.body) {
        config.data = test.body;
      }

      const response: AxiosResponse = await axios(config);
      const responseTime = performance.now() - startTime;

      const success = test.expectedStatus ? 
        response.status === test.expectedStatus : 
        response.status >= 200 && response.status < 300;

      const validationSuccess = test.validate ? test.validate(response) : true;

      return {
        endpoint: test.endpoint,
        method: test.method,
        status: response.status,
        responseTime: Math.round(responseTime),
        success: success && validationSuccess,
        data: response.data
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        endpoint: test.endpoint,
        method: test.method,
        status: error.response?.status || 0,
        responseTime: Math.round(responseTime),
        success: false,
        error: error.message,
        data: error.response?.data
      };
    }
  }

  private displayTestResult(result: TestResult) {
    const statusColor = result.success ? chalk.green : chalk.red;
    const statusIcon = result.success ? '✅' : '❌';
    
    console.log(`${statusIcon} ${result.method} ${result.endpoint}`);
    console.log(chalk.gray(`   Status: ${statusColor(result.status)} | Time: ${result.responseTime}ms`));
    
    if (result.error) {
      console.log(chalk.red(`   Error: ${result.error}`));
    }
    
    if (result.data && !result.success) {
      console.log(chalk.gray(`   Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`));
    }
    
    console.log();
  }

  private showResults() {
    console.log(chalk.blue.bold('📋 Test Results Summary\n'));

    if (this.results.length === 0) {
      console.log(chalk.gray('No tests have been run yet.'));
      return;
    }

    const passed = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(chalk.green(`✅ Passed: ${passed.length}`));
    console.log(chalk.red(`❌ Failed: ${failed.length}`));
    console.log(chalk.blue(`📊 Total: ${this.results.length}`));
    
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    console.log(chalk.cyan(`⏱️  Average Response Time: ${Math.round(avgResponseTime)}ms`));

    if (failed.length > 0) {
      console.log(chalk.red('\n❌ Failed Tests:'));
      failed.forEach(result => {
        console.log(chalk.red(`   ${result.method} ${result.endpoint} - ${result.status}`));
        if (result.error) {
          console.log(chalk.gray(`      ${result.error}`));
        }
      });
    }

    // Performance analysis
    const slowTests = this.results.filter(r => r.responseTime > 1000);
    if (slowTests.length > 0) {
      console.log(chalk.yellow('\n⚠️  Slow Tests (>1000ms):'));
      slowTests.forEach(result => {
        console.log(chalk.yellow(`   ${result.method} ${result.endpoint} - ${result.responseTime}ms`));
      });
    }
  }

  private showSummary() {
    console.log(chalk.blue.bold('\n📊 Complete Test Summary\n'));
    
    const groupedResults = this.groupResultsByEndpoint();
    
    Object.entries(groupedResults).forEach(([endpoint, results]) => {
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const avgTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / total);
      
      const statusColor = passed === total ? chalk.green : passed > 0 ? chalk.yellow : chalk.red;
      console.log(`${statusColor('●')} ${endpoint}: ${passed}/${total} passed (avg: ${avgTime}ms)`);
    });

    this.showResults();
  }

  private groupResultsByEndpoint(): Record<string, TestResult[]> {
    return this.results.reduce((groups, result) => {
      const key = result.endpoint.split('/')[1] || 'root';
      if (!groups[key]) groups[key] = [];
      groups[key].push(result);
      return groups;
    }, {} as Record<string, TestResult[]>);
  }
}

// Run the API tester if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.start().catch(error => {
    console.error(chalk.red('API Tester failed:'), error);
    process.exit(1);
  });
}

export { APITester };