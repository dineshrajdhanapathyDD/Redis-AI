import { Redis } from 'ioredis';
import { CodeIntelligenceService, CodeFile, CodeGenerationRequest, GenerationType, QualityGateConfig } from '../services/code-intelligence';
import { EmbeddingManager } from '../services/embedding-manager';
import { logger } from '../utils/logger';

export class CodeIntelligenceDemo {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private codeIntelligenceService: CodeIntelligenceService;

  constructor(redis: Redis, embeddingManager: EmbeddingManager) {
    this.redis = redis;
    this.embeddingManager = embeddingManager;
    this.codeIntelligenceService = new CodeIntelligenceService(redis, embeddingManager);
  }

  async runDemo(): Promise<void> {
    logger.info('🔧 Starting Code Intelligence Engine Demo');

    try {
      // Demo 1: Code analysis and pattern detection
      await this.demoCodeAnalysis();

      // Demo 2: Code generation
      await this.demoCodeGeneration();

      // Demo 3: Code similarity search
      await this.demoCodeSimilaritySearch();

      // Demo 4: Quality analysis and reporting
      await this.demoQualityAnalysis();

      // Demo 5: Code suggestions and refactoring
      await this.demoCodeSuggestions();

      logger.info('✅ Code Intelligence Engine Demo completed successfully');
    } catch (error) {
      logger.error(`❌ Demo failed: ${error.message}`);
      throw error;
    }
  }

  private async demoCodeAnalysis(): Promise<void> {
    logger.info('\n🔍 Demo 1: Code Analysis and Pattern Detection');

    // Sample TypeScript code with various patterns and issues
    const sampleCode = `
      import { Component } from 'react';
      import { UserService } from './services/user.service';
      
      /**
       * User management component with various code patterns
       */
      export class UserManager extends Component {
        private userService: UserService;
        private users: User[] = [];
        private isLoading: boolean = false;
        
        constructor(props: any) {
          super(props);
          this.userService = new UserService(); // Direct instantiation - could use DI
        }
        
        // Long method with high complexity
        public async processUsers(filters: any): Promise<void> {
          this.isLoading = true;
          
          try {
            const allUsers = await this.userService.getAllUsers();
            
            for (const user of allUsers) {
              if (user.isActive) {
                if (user.role === 'admin') {
                  if (user.permissions.includes('read')) {
                    if (user.lastLogin) {
                      const daysSinceLogin = (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
                      if (daysSinceLogin < 30) {
                        if (filters.includeRecentAdmins) {
                          this.users.push(user);
                        }
                      } else {
                        if (filters.includeInactiveAdmins) {
                          this.users.push(user);
                        }
                      }
                    }
                  }
                } else if (user.role === 'user') {
                  if (user.isVerified) {
                    if (filters.includeVerifiedUsers) {
                      this.users.push(user);
                    }
                  } else {
                    if (filters.includeUnverifiedUsers) {
                      this.users.push(user);
                    }
                  }
                }
              }
            }
            
            // Duplicate code block
            for (const user of this.users) {
              user.displayName = user.firstName + ' ' + user.lastName;
              user.initials = user.firstName.charAt(0) + user.lastName.charAt(0);
            }
            
          } catch (error) {
            console.error('Error processing users:', error);
            throw error;
          } finally {
            this.isLoading = false;
          }
        }
        
        // Another method with similar duplicate code
        public formatUserNames(): void {
          for (const user of this.users) {
            user.displayName = user.firstName + ' ' + user.lastName;
            user.initials = user.firstName.charAt(0) + user.lastName.charAt(0);
          }
        }
        
        // Method with poor naming
        public doStuff(x: any): any {
          return x ? x.data : null;
        }
        
        // God method - does too many things
        public handleUserAction(action: string, userId: string, data: any): void {
          // Validation
          if (!action || !userId) {
            throw new Error('Invalid parameters');
          }
          
          // Logging
          console.log(\`Handling action: \${action} for user: \${userId}\`);
          
          // Business logic
          switch (action) {
            case 'create':
              this.createUser(data);
              this.sendWelcomeEmail(data.email);
              this.logUserActivity(userId, 'created');
              this.updateStatistics('user_created');
              break;
            case 'update':
              this.updateUser(userId, data);
              this.validateUserData(data);
              this.logUserActivity(userId, 'updated');
              this.updateStatistics('user_updated');
              break;
            case 'delete':
              this.deleteUser(userId);
              this.cleanupUserData(userId);
              this.logUserActivity(userId, 'deleted');
              this.updateStatistics('user_deleted');
              break;
          }
          
          // Notification
          this.notifyAdmins(action, userId);
          
          // Cache invalidation
          this.invalidateUserCache(userId);
        }
        
        private createUser(data: any): void { /* implementation */ }
        private updateUser(userId: string, data: any): void { /* implementation */ }
        private deleteUser(userId: string): void { /* implementation */ }
        private sendWelcomeEmail(email: string): void { /* implementation */ }
        private logUserActivity(userId: string, action: string): void { /* implementation */ }
        private updateStatistics(metric: string): void { /* implementation */ }
        private validateUserData(data: any): void { /* implementation */ }
        private cleanupUserData(userId: string): void { /* implementation */ }
        private notifyAdmins(action: string, userId: string): void { /* implementation */ }
        private invalidateUserCache(userId: string): void { /* implementation */ }
      }
      
      interface User {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'admin' | 'user';
        isActive: boolean;
        isVerified: boolean;
        permissions: string[];
        lastLogin?: Date;
        displayName?: string;
        initials?: string;
      }
    `;

    const codeFile: CodeFile = {
      id: 'user-manager-demo',
      path: 'src/components/UserManager.tsx',
      content: sampleCode,
      language: 'typescript',
      size: sampleCode.length,
      lastModified: new Date(),
      hash: 'demo-hash-123',
      metadata: {} as any
    };

    // Analyze the code
    const analysisResult = await this.codeIntelligenceService.analyzer.analyzeCodeFile(codeFile);

    logger.info(`Code Analysis Results for ${codeFile.path}:`);
    logger.info(`  - Lines of Code: ${analysisResult.metrics.linesOfCode}`);
    logger.info(`  - Functions: ${analysisResult.metrics.functionCount}`);
    logger.info(`  - Classes: ${analysisResult.metrics.classCount}`);
    logger.info(`  - Cyclomatic Complexity: ${analysisResult.metrics.cyclomaticComplexity}`);
    logger.info(`  - Maintainability Index: ${analysisResult.metrics.maintainabilityIndex.toFixed(3)}`);
    logger.info(`  - Technical Debt: ${analysisResult.metrics.technicalDebt.toFixed(2)} hours`);

    logger.info(`Quality Scores:`);
    logger.info(`  - Overall: ${analysisResult.quality.overall.toFixed(3)}`);
    logger.info(`  - Maintainability: ${analysisResult.quality.maintainability.toFixed(3)}`);
    logger.info(`  - Reliability: ${analysisResult.quality.reliability.toFixed(3)}`);
    logger.info(`  - Security: ${analysisResult.quality.security.toFixed(3)}`);
    logger.info(`  - Performance: ${analysisResult.quality.performance.toFixed(3)}`);
    logger.info(`  - Readability: ${analysisResult.quality.readability.toFixed(3)}`);

    logger.info(`Detected Patterns (${analysisResult.patterns.length}):`);
    analysisResult.patterns.forEach((pattern, index) => {
      logger.info(`  ${index + 1}. [${pattern.severity}] ${pattern.name}`);
      logger.info(`     ${pattern.description}`);
      logger.info(`     Location: Lines ${pattern.location.startLine}-${pattern.location.endLine}`);
      logger.info(`     Suggestion: ${pattern.suggestion}`);
    });

    // Detect code smells specifically
    const codeSmells = await this.codeIntelligenceService.analyzer.detectCodeSmells(codeFile);
    logger.info(`Code Smells Detected (${codeSmells.length}):`);
    codeSmells.forEach((smell, index) => {
      logger.info(`  ${index + 1}. ${smell.name} (${smell.severity})`);
      logger.info(`     ${smell.description}`);
    });

    // Generate suggestions
    const suggestions = await this.codeIntelligenceService.analyzer.generateCodeSuggestions(codeFile, analysisResult);
    logger.info(`Generated Suggestions (${suggestions.length}):`);
    suggestions.slice(0, 5).forEach((suggestion, index) => {
      logger.info(`  ${index + 1}. [${suggestion.type}] ${suggestion.title}`);
      logger.info(`     ${suggestion.description}`);
      logger.info(`     Priority: ${suggestion.priority}`);
      logger.info(`     Auto-fixable: ${suggestion.autoFixable ? 'Yes' : 'No'}`);
    });
  }

  private async demoCodeGeneration(): Promise<void> {
    logger.info('\n🏗️ Demo 2: Code Generation');

    // Generate a utility function
    const functionRequest: CodeGenerationRequest = {
      id: 'demo-function-gen',
      type: GenerationType.FUNCTION,
      description: 'Create a function called validateEmail that takes an email string and returns true if it\'s a valid email format, false otherwise. Include proper error handling and documentation.',
      context: {
        language: 'typescript',
        codeStyle: {
          indentation: 'spaces' as any,
          indentSize: 2,
          lineLength: 100,
          bracketStyle: 'same_line' as any,
          namingConvention: {
            functions: 'camelCase' as any,
            variables: 'camelCase' as any,
            classes: 'PascalCase' as any,
            constants: 'SCREAMING_SNAKE_CASE' as any,
            files: 'kebab-case' as any
          },
          commentStyle: {
            singleLine: '//',
            multiLineStart: '/*',
            multiLineEnd: '*/',
            documentation: 'jsdoc' as any
          },
          importStyle: {
            grouping: 'by_type' as any,
            sorting: 'alphabetical' as any,
            spacing: true
          }
        }
      },
      constraints: {
        maxLines: 30,
        maxComplexity: 5,
        securityRequirements: {
          inputValidation: true,
          outputSanitization: false,
          authenticationRequired: false,
          encryptionRequired: false,
          auditLogging: false
        }
      },
      preferences: {
        verbosity: 'detailed' as any,
        includeComments: true,
        includeDocumentation: true,
        includeExamples: false,
        optimizeForReadability: true,
        optimizeForPerformance: false,
        followBestPractices: true
      }
    };

    const functionResult = await this.codeIntelligenceService.generator.generateCode(functionRequest);
    
    logger.info('Generated Function:');
    logger.info('```typescript');
    logger.info(functionResult.generatedCode);
    logger.info('```');
    
    logger.info(`Generation Metadata:`);
    logger.info(`  - Lines Generated: ${functionResult.metadata.linesGenerated}`);
    logger.info(`  - Complexity: ${functionResult.metadata.complexity}`);
    logger.info(`  - Confidence: ${functionResult.metadata.confidence.toFixed(3)}`);
    logger.info(`  - Dependencies: ${functionResult.metadata.dependencies.join(', ') || 'None'}`);

    // Generate a class
    const classRequest: CodeGenerationRequest = {
      id: 'demo-class-gen',
      type: GenerationType.CLASS,
      description: 'Create a TaskManager class that can add, remove, and list tasks. Each task should have an id, title, description, status (pending/completed), and created date. Include methods for marking tasks as complete and filtering by status.',
      context: {
        language: 'typescript'
      },
      constraints: {
        maxLines: 100
      },
      preferences: {
        verbosity: 'standard' as any,
        includeComments: true,
        includeDocumentation: true,
        includeExamples: false,
        optimizeForReadability: true,
        optimizeForPerformance: false,
        followBestPractices: true
      }
    };

    const classResult = await this.codeIntelligenceService.generator.generateCode(classRequest);
    
    logger.info('\nGenerated Class:');
    logger.info('```typescript');
    logger.info(classResult.generatedCode);
    logger.info('```');

    // Generate tests for the function
    const testRequest: CodeGenerationRequest = {
      id: 'demo-test-gen',
      type: GenerationType.TEST,
      description: 'Generate comprehensive unit tests for the validateEmail function',
      context: {
        language: 'typescript',
        existingCode: functionResult.generatedCode,
        targetFile: 'validateEmail.ts'
      },
      constraints: {
        testRequirements: {
          unitTests: true,
          integrationTests: false,
          coverageThreshold: 90,
          testFramework: 'jest',
          mockingStrategy: 'manual' as any
        }
      },
      preferences: {
        verbosity: 'detailed' as any,
        includeComments: true,
        includeDocumentation: false,
        includeExamples: true,
        optimizeForReadability: true,
        optimizeForPerformance: false,
        followBestPractices: true
      }
    };

    const testResult = await this.codeIntelligenceService.generator.generateCode(testRequest);
    
    logger.info('\nGenerated Tests:');
    logger.info('```typescript');
    logger.info(testResult.generatedCode);
    logger.info('```');

    // Show quality scores and suggestions
    logger.info(`\nGenerated Code Quality:`);
    logger.info(`  Function Quality: ${functionResult.quality.overall.toFixed(3)}`);
    logger.info(`  Class Quality: ${classResult.quality.overall.toFixed(3)}`);
    logger.info(`  Test Quality: ${testResult.quality.overall.toFixed(3)}`);

    if (functionResult.suggestions.length > 0) {
      logger.info(`\nSuggestions for Function:`);
      functionResult.suggestions.forEach((suggestion, index) => {
        logger.info(`  ${index + 1}. ${suggestion.description}`);
      });
    }

    if (functionResult.alternatives.length > 0) {
      logger.info(`\nAlternative Implementations:`);
      functionResult.alternatives.forEach((alt, index) => {
        logger.info(`  ${index + 1}. ${alt.description} (Score: ${alt.score.toFixed(3)})`);
        alt.tradeoffs.forEach(tradeoff => {
          logger.info(`     - ${tradeoff.aspect}: ${tradeoff.description}`);
        });
      });
    }
  }

  private async demoCodeSimilaritySearch(): Promise<void> {
    logger.info('\n🔍 Demo 3: Code Similarity Search');

    // First, let's "index" some sample functions by analyzing them
    const sampleFunctions = [
      {
        id: 'func1',
        code: `
          function calculateSum(numbers: number[]): number {
            return numbers.reduce((sum, num) => sum + num, 0);
          }
        `,
        path: 'src/math/sum.ts'
      },
      {
        id: 'func2',
        code: `
          function findAverage(values: number[]): number {
            if (values.length === 0) return 0;
            const total = values.reduce((acc, val) => acc + val, 0);
            return total / values.length;
          }
        `,
        path: 'src/math/average.ts'
      },
      {
        id: 'func3',
        code: `
          function validateUser(user: User): boolean {
            return user && user.email && user.name && user.email.includes('@');
          }
        `,
        path: 'src/validation/user.ts'
      },
      {
        id: 'func4',
        code: `
          function sortNumbers(nums: number[]): number[] {
            return [...nums].sort((a, b) => a - b);
          }
        `,
        path: 'src/utils/sort.ts'
      }
    ];

    // Simulate indexing these functions
    for (const func of sampleFunctions) {
      const codeFile: CodeFile = {
        id: func.id,
        path: func.path,
        content: func.code,
        language: 'typescript',
        size: func.code.length,
        lastModified: new Date(),
        hash: `hash-${func.id}`,
        metadata: {} as any
      };

      await this.codeIntelligenceService.analyzer.analyzeCodeFile(codeFile);
    }

    // Now search for similar code
    const searchQueries = [
      'function that adds numbers together',
      'calculate total of array elements',
      'function to validate email format',
      'sort array in ascending order'
    ];

    for (const query of searchQueries) {
      logger.info(`\nSearching for: "${query}"`);
      
      const similarCode = await this.codeIntelligenceService.analyzer.findSimilarCode(query, 'typescript', 3);
      
      if (similarCode.length > 0) {
        logger.info(`Found ${similarCode.length} similar code snippets:`);
        similarCode.forEach((result, index) => {
          logger.info(`  ${index + 1}. ${result.path} (Similarity: ${result.similarity.toFixed(3)})`);
          logger.info(`     Function: ${result.functionName || 'N/A'}`);
          logger.info(`     Lines: ${result.startLine}-${result.endLine}`);
          logger.info(`     Complexity: ${result.complexity}`);
          logger.info(`     Code: ${result.content.substring(0, 100)}...`);
        });
      } else {
        logger.info('  No similar code found');
      }
    }

    // Demonstrate finding duplicate code patterns
    const duplicateTestCode = `
      function processUserData(users: User[]): ProcessedUser[] {
        const processed = [];
        for (const user of users) {
          user.displayName = user.firstName + ' ' + user.lastName;
          user.initials = user.firstName.charAt(0) + user.lastName.charAt(0);
          processed.push(user);
        }
        return processed;
      }
      
      function formatUserList(userList: User[]): FormattedUser[] {
        const formatted = [];
        for (const user of userList) {
          user.displayName = user.firstName + ' ' + user.lastName;
          user.initials = user.firstName.charAt(0) + user.lastName.charAt(0);
          formatted.push(user);
        }
        return formatted;
      }
    `;

    const duplicateFile: CodeFile = {
      id: 'duplicate-demo',
      path: 'src/duplicate-example.ts',
      content: duplicateTestCode,
      language: 'typescript',
      size: duplicateTestCode.length,
      lastModified: new Date(),
      hash: 'duplicate-hash',
      metadata: {} as any
    };

    const duplicateAnalysis = await this.codeIntelligenceService.analyzer.analyzeCodeFile(duplicateFile);
    const duplicateSmells = duplicateAnalysis.patterns.filter(p => p.patternId === 'duplicate-code');
    
    if (duplicateSmells.length > 0) {
      logger.info(`\nDuplicate Code Detection:`);
      duplicateSmells.forEach((smell, index) => {
        logger.info(`  ${index + 1}. ${smell.description}`);
        logger.info(`     Suggestion: ${smell.suggestion}`);
      });
    }
  }

  private async demoQualityAnalysis(): Promise<void> {
    logger.info('\n📊 Demo 4: Quality Analysis and Reporting');

    // Create sample project files with varying quality
    const projectFiles: CodeFile[] = [
      {
        id: 'high-quality-file',
        path: 'src/services/user.service.ts',
        content: `
          import { Injectable } from '@nestjs/common';
          import { User } from '../entities/user.entity';
          import { UserRepository } from '../repositories/user.repository';
          
          /**
           * Service for managing user operations
           */
          @Injectable()
          export class UserService {
            constructor(private readonly userRepository: UserRepository) {}
            
            /**
             * Retrieves a user by ID
             * @param id - The user ID
             * @returns Promise resolving to user or null
             */
            async findById(id: string): Promise<User | null> {
              if (!id) {
                throw new Error('User ID is required');
              }
              
              return this.userRepository.findById(id);
            }
            
            /**
             * Creates a new user
             * @param userData - User data to create
             * @returns Promise resolving to created user
             */
            async create(userData: Partial<User>): Promise<User> {
              this.validateUserData(userData);
              return this.userRepository.create(userData);
            }
            
            private validateUserData(userData: Partial<User>): void {
              if (!userData.email || !userData.name) {
                throw new Error('Email and name are required');
              }
            }
          }
        `,
        language: 'typescript',
        size: 1200,
        lastModified: new Date(),
        hash: 'high-quality-hash',
        metadata: {} as any
      },
      {
        id: 'medium-quality-file',
        path: 'src/utils/helpers.ts',
        content: `
          export function processData(data: any): any {
            if (data) {
              if (data.items) {
                const result = [];
                for (let i = 0; i < data.items.length; i++) {
                  if (data.items[i].active) {
                    result.push(data.items[i]);
                  }
                }
                return result;
              }
            }
            return null;
          }
          
          export function formatDate(d: Date): string {
            return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
          }
          
          export function calc(a: number, b: number, op: string): number {
            if (op === 'add') return a + b;
            if (op === 'sub') return a - b;
            if (op === 'mul') return a * b;
            if (op === 'div') return a / b;
            return 0;
          }
        `,
        language: 'typescript',
        size: 800,
        lastModified: new Date(),
        hash: 'medium-quality-hash',
        metadata: {} as any
      },
      {
        id: 'low-quality-file',
        path: 'src/legacy/old-code.ts',
        content: `
          var x = 1;
          var y = 2;
          
          function doEverything(input) {
            var result;
            if (input) {
              if (input.type == 'user') {
                if (input.data) {
                  if (input.data.name) {
                    if (input.data.email) {
                      if (input.data.age) {
                        if (input.data.age > 18) {
                          result = processUser(input.data);
                          logActivity('user_processed', input.data.id);
                          sendNotification(input.data.email);
                          updateDatabase(input.data);
                          generateReport(input.data);
                          cleanupTempFiles();
                          validatePermissions(input.data);
                          auditLog(input.data);
                        }
                      }
                    }
                  }
                }
              } else if (input.type == 'admin') {
                // Similar nested structure...
                result = processAdmin(input.data);
              }
            }
            return result;
          }
          
          function processUser(data) { return data; }
          function processAdmin(data) { return data; }
          function logActivity(action, id) { console.log(action, id); }
          function sendNotification(email) { console.log('notify', email); }
          function updateDatabase(data) { console.log('update', data); }
          function generateReport(data) { console.log('report', data); }
          function cleanupTempFiles() { console.log('cleanup'); }
          function validatePermissions(data) { console.log('validate', data); }
          function auditLog(data) { console.log('audit', data); }
        `,
        language: 'typescript',
        size: 1500,
        lastModified: new Date(),
        hash: 'low-quality-hash',
        metadata: {} as any
      }
    ];

    // Analyze project quality
    const qualityReport = await this.codeIntelligenceService.qualityAnalyzer.analyzeProjectQuality('demo-project', projectFiles);

    logger.info(`Project Quality Report:`);
    logger.info(`  - Overall Score: ${qualityReport.overallScore.toFixed(3)} (${this.getGradeDescription(qualityReport.overallScore)})`);
    logger.info(`  - Generated: ${qualityReport.generatedAt.toISOString()}`);

    logger.info(`\nQuality Metrics:`);
    logger.info(`  - Maintainability: ${qualityReport.metrics.maintainability.score.toFixed(3)} (${qualityReport.metrics.maintainability.grade})`);
    logger.info(`  - Reliability: ${qualityReport.metrics.reliability.score.toFixed(3)} (${qualityReport.metrics.reliability.grade})`);
    logger.info(`  - Security: ${qualityReport.metrics.security.score.toFixed(3)} (${qualityReport.metrics.security.grade})`);
    logger.info(`  - Performance: ${qualityReport.metrics.performance.score.toFixed(3)} (${qualityReport.metrics.performance.grade})`);
    logger.info(`  - Testability: ${qualityReport.metrics.testability.score.toFixed(3)} (${qualityReport.metrics.testability.grade})`);
    logger.info(`  - Readability: ${qualityReport.metrics.readability.score.toFixed(3)} (${qualityReport.metrics.readability.grade})`);

    logger.info(`\nComplexity Metrics:`);
    logger.info(`  - Average Cyclomatic Complexity: ${qualityReport.metrics.complexity.cyclomaticComplexity.toFixed(2)}`);
    logger.info(`  - Average Function Length: ${qualityReport.metrics.complexity.functionLength.toFixed(1)} lines`);
    logger.info(`  - Average Class Size: ${qualityReport.metrics.complexity.classSize.toFixed(1)} lines`);

    logger.info(`\nCode Issues (${qualityReport.issues.length}):`);
    qualityReport.issues.slice(0, 10).forEach((issue, index) => {
      logger.info(`  ${index + 1}. [${issue.severity}] ${issue.title}`);
      logger.info(`     ${issue.description}`);
      logger.info(`     File: ${issue.location.file} (Lines ${issue.location.startLine}-${issue.location.endLine})`);
      logger.info(`     Effort: ${issue.effort.hours.toFixed(1)} hours`);
      logger.info(`     Technical Debt: ${issue.debt.amount} ${issue.debt.unit}`);
    });

    logger.info(`\nRecommendations (${qualityReport.recommendations.length}):`);
    qualityReport.recommendations.forEach((rec, index) => {
      logger.info(`  ${index + 1}. [${rec.priority}] ${rec.title}`);
      logger.info(`     ${rec.description}`);
      logger.info(`     Impact: Quality +${(rec.impact.qualityImprovement * 100).toFixed(1)}%`);
      logger.info(`     Effort: ${rec.effort.hours.toFixed(1)} hours`);
    });

    // Demonstrate quality gate
    const qualityGate: QualityGateConfig = {
      name: 'Production Gate',
      conditions: [
        { metric: 'overall', operator: 'gt' as any, threshold: 0.7 },
        { metric: 'security', operator: 'gt' as any, threshold: 0.8 },
        { metric: 'maintainability', operator: 'gt' as any, threshold: 0.6 }
      ]
    };

    const gateResult = await this.codeIntelligenceService.qualityAnalyzer.getQualityGate('demo-project', qualityGate);
    
    logger.info(`\nQuality Gate: ${gateResult.gateName}`);
    logger.info(`  - Status: ${gateResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    logger.info(`  - Overall Score: ${gateResult.overallScore.toFixed(3)}`);
    
    if (gateResult.conditions) {
      logger.info(`  - Conditions:`);
      gateResult.conditions.forEach((condition, index) => {
        const status = condition.passed ? '✅' : '❌';
        logger.info(`    ${index + 1}. ${status} ${condition.metric} ${condition.operator} ${condition.threshold} (actual: ${condition.actualValue.toFixed(3)})`);
      });
    }
  }

  private async demoCodeSuggestions(): Promise<void> {
    logger.info('\n💡 Demo 5: Code Suggestions and Refactoring');

    // Code with various improvement opportunities
    const improvableCode = `
      class DataProcessor {
        private data: any[];
        
        constructor() {
          this.data = [];
        }
        
        // Poor method naming and implementation
        public doStuff(input: any): any {
          let result = null;
          
          if (input) {
            if (input.type === 'process') {
              if (input.data) {
                if (Array.isArray(input.data)) {
                  for (let i = 0; i < input.data.length; i++) {
                    if (input.data[i]) {
                      if (input.data[i].valid) {
                        result = this.processItem(input.data[i]);
                      }
                    }
                  }
                }
              }
            }
          }
          
          return result;
        }
        
        // Duplicate logic
        public processItems(items: any[]): any[] {
          const results = [];
          for (let i = 0; i < items.length; i++) {
            if (items[i]) {
              if (items[i].valid) {
                results.push(this.processItem(items[i]));
              }
            }
          }
          return results;
        }
        
        // Long parameter list
        public createReport(title: string, subtitle: string, author: string, date: Date, 
                          format: string, includeCharts: boolean, includeData: boolean, 
                          includeMetadata: boolean, outputPath: string, compress: boolean): void {
          // Implementation...
        }
        
        // Magic numbers and poor error handling
        public validateData(data: any): boolean {
          if (data.length > 100) { // Magic number
            throw new Error('Too much data');
          }
          
          if (data.length < 5) { // Magic number
            return false;
          }
          
          return true;
        }
        
        private processItem(item: any): any {
          return { ...item, processed: true };
        }
      }
    `;

    const codeFile: CodeFile = {
      id: 'improvable-code',
      path: 'src/processors/DataProcessor.ts',
      content: improvableCode,
      language: 'typescript',
      size: improvableCode.length,
      lastModified: new Date(),
      hash: 'improvable-hash',
      metadata: {} as any
    };

    // Analyze the code
    const analysis = await this.codeIntelligenceService.analyzer.analyzeCodeFile(codeFile);
    
    // Generate suggestions
    const suggestions = await this.codeIntelligenceService.analyzer.generateCodeSuggestions(codeFile, analysis);

    logger.info(`Code Improvement Suggestions (${suggestions.length}):`);
    suggestions.forEach((suggestion, index) => {
      logger.info(`  ${index + 1}. [${suggestion.type.toUpperCase()}] ${suggestion.title}`);
      logger.info(`     Priority: ${suggestion.priority}`);
      logger.info(`     Description: ${suggestion.description}`);
      logger.info(`     Auto-fixable: ${suggestion.autoFixable ? 'Yes' : 'No'}`);
      logger.info(`     Location: Lines ${suggestion.location.startLine}-${suggestion.location.endLine}`);
      logger.info(`     Reasoning: ${suggestion.reasoning}`);
      
      if (suggestion.beforeCode && suggestion.afterCode) {
        logger.info(`     Before: ${suggestion.beforeCode}`);
        logger.info(`     After: ${suggestion.afterCode}`);
      }
    });

    // Generate refactored version
    const refactorRequest: CodeGenerationRequest = {
      id: 'refactor-demo',
      type: GenerationType.REFACTOR,
      description: 'Refactor this code to improve readability, reduce complexity, and follow best practices. Extract methods, improve naming, and eliminate code duplication.',
      context: {
        language: 'typescript',
        existingCode: improvableCode,
        targetFile: 'src/processors/DataProcessor.ts'
      },
      constraints: {
        maxComplexity: 5,
        maxLines: 150
      },
      preferences: {
        verbosity: 'standard' as any,
        includeComments: true,
        includeDocumentation: true,
        includeExamples: false,
        optimizeForReadability: true,
        optimizeForPerformance: false,
        followBestPractices: true
      }
    };

    const refactoredResult = await this.codeIntelligenceService.generator.generateCode(refactorRequest);
    
    logger.info('\nRefactored Code:');
    logger.info('```typescript');
    logger.info(refactoredResult.generatedCode);
    logger.info('```');

    logger.info(`\nRefactoring Quality Improvement:`);
    logger.info(`  - Original Quality: ${analysis.quality.overall.toFixed(3)}`);
    logger.info(`  - Refactored Quality: ${refactoredResult.quality.overall.toFixed(3)}`);
    logger.info(`  - Improvement: +${((refactoredResult.quality.overall - analysis.quality.overall) * 100).toFixed(1)}%`);

    // Show specific improvements
    const improvements = [
      { metric: 'Maintainability', original: analysis.quality.maintainability, refactored: refactoredResult.quality.maintainability },
      { metric: 'Readability', original: analysis.quality.readability, refactored: refactoredResult.quality.readability },
      { metric: 'Testability', original: analysis.quality.testability, refactored: refactoredResult.quality.testability }
    ];

    logger.info(`\nDetailed Improvements:`);
    improvements.forEach(improvement => {
      const delta = improvement.refactored - improvement.original;
      const deltaPercent = (delta * 100).toFixed(1);
      const arrow = delta > 0 ? '↗️' : delta < 0 ? '↘️' : '→';
      logger.info(`  - ${improvement.metric}: ${improvement.original.toFixed(3)} → ${improvement.refactored.toFixed(3)} (${arrow} ${deltaPercent}%)`);
    });
  }

  private getGradeDescription(score: number): string {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Good';
    if (score >= 0.6) return 'Acceptable';
    if (score >= 0.4) return 'Poor';
    return 'Critical';
  }
}

// Example usage
export async function runCodeIntelligenceDemo(): Promise<void> {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  });

  const embeddingManager = new EmbeddingManager(redis);
  const demo = new CodeIntelligenceDemo(redis, embeddingManager);

  try {
    await demo.runDemo();
  } finally {
    await redis.quit();
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  runCodeIntelligenceDemo().catch(console.error);
}