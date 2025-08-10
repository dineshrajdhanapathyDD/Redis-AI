import { Redis } from 'ioredis';
import { CodeIntelligenceService, CodeFile, CodeGenerationRequest, GenerationType } from '../../src/services/code-intelligence';
import { EmbeddingManager } from '../../src/services/embedding-manager';

describe('Code Intelligence System Integration', () => {
  let redis: Redis;
  let embeddingManager: EmbeddingManager;
  let codeIntelligenceService: CodeIntelligenceService;

  beforeAll(async () => {
    // Use test Redis instance
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 15, // Use separate database for tests
    });

    embeddingManager = new EmbeddingManager(redis);
    codeIntelligenceService = new CodeIntelligenceService(redis, embeddingManager);

    // Clear test database
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.flushdb();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await redis.flushdb();
  });

  describe('Complete Code Intelligence Workflow', () => {
    it('should handle complete code analysis and improvement workflow', async () => {
      // Step 1: Analyze existing code
      const sampleCode = `
        class UserService {
          private users: User[] = [];
          
          // Long method with high complexity
          public processUsers(filters: any): User[] {
            const result = [];
            for (const user of this.users) {
              if (user.isActive) {
                if (user.role === 'admin') {
                  if (user.permissions.includes('read')) {
                    if (user.lastLogin) {
                      const daysSinceLogin = (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
                      if (daysSinceLogin < 30) {
                        if (filters.includeRecentAdmins) {
                          result.push(user);
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
          public getActiveAdmins(): User[] {
            const result = [];
            for (const user of this.users) {
              if (user.isActive) {
                if (user.role === 'admin') {
                  result.push(user);
                }
              }
            }
            return result;
          }
        }
        
        interface User {
          id: string;
          name: string;
          role: string;
          isActive: boolean;
          permissions: string[];
          lastLogin?: Date;
        }
      `;

      const codeFile: CodeFile = {
        id: 'integration-test-file',
        path: 'src/services/user.service.ts',
        content: sampleCode,
        language: 'typescript',
        size: sampleCode.length,
        lastModified: new Date(),
        hash: 'integration-hash',
        metadata: {} as any
      };

      const analysisResult = await codeIntelligenceService.analyzer.analyzeCodeFile(codeFile);

      expect(analysisResult).toBeDefined();
      expect(analysisResult.fileId).toBe('integration-test-file');
      expect(analysisResult.metrics.linesOfCode).toBeGreaterThan(0);
      expect(analysisResult.metrics.functionCount).toBeGreaterThan(0);
      expect(analysisResult.metrics.classCount).toBe(1);

      // Should detect code smells
      expect(analysisResult.patterns.length).toBeGreaterThan(0);
      
      // Should have quality scores
      expect(analysisResult.quality.overall).toBeGreaterThanOrEqual(0);
      expect(analysisResult.quality.overall).toBeLessThanOrEqual(1);

      // Step 2: Generate suggestions
      const suggestions = await codeIntelligenceService.analyzer.generateCodeSuggestions(codeFile, analysisResult);
      expect(suggestions.length).toBeGreaterThan(0);

      // Step 3: Generate improved version
      const refactorRequest: CodeGenerationRequest = {
        id: 'integration-refactor',
        type: GenerationType.REFACTOR,
        description: 'Refactor this code to improve readability and reduce complexity',
        context: {
          language: 'typescript',
          existingCode: sampleCode,
          targetFile: 'src/services/user.service.ts'
        },
        constraints: {
          maxComplexity: 5
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

      const refactoredResult = await codeIntelligenceService.generator.generateCode(refactorRequest);
      
      expect(refactoredResult).toBeDefined();
      expect(refactoredResult.generatedCode).toBeDefined();
      expect(refactoredResult.quality.overall).toBeGreaterThanOrEqual(0);

      // Step 4: Generate tests for the refactored code
      const testRequest: CodeGenerationRequest = {
        id: 'integration-test-gen',
        type: GenerationType.TEST,
        description: 'Generate unit tests for the refactored UserService',
        context: {
          language: 'typescript',
          existingCode: refactoredResult.generatedCode,
          targetFile: 'user.service.ts'
        },
        constraints: {
          testRequirements: {
            unitTests: true,
            integrationTests: false,
            coverageThreshold: 80,
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

      const testResult = await codeIntelligenceService.generator.generateCode(testRequest);
      
      expect(testResult).toBeDefined();
      expect(testResult.generatedCode).toContain('describe');
      expect(testResult.generatedCode).toContain('it');
      expect(testResult.generatedCode).toContain('UserService');

      // Step 5: Analyze project quality
      const projectFiles = [
        codeFile,
        {
          ...codeFile,
          id: 'refactored-file',
          content: refactoredResult.generatedCode,
          path: 'src/services/user.service.refactored.ts'
        }
      ];

      const qualityReport = await codeIntelligenceService.qualityAnalyzer.analyzeProjectQuality('integration-test-project', projectFiles);
      
      expect(qualityReport).toBeDefined();
      expect(qualityReport.projectId).toBe('integration-test-project');
      expect(qualityReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(qualityReport.overallScore).toBeLessThanOrEqual(1);
      expect(qualityReport.metrics).toBeDefined();
      expect(qualityReport.issues.length).toBeGreaterThanOrEqual(0);
      expect(qualityReport.recommendations.length).toBeGreaterThanOrEqual(0);
    }, 60000); // 60 second timeout for integration test

    it('should handle code similarity search across multiple files', async () => {
      // Create multiple code files with similar patterns
      const codeFiles = [
        {
          id: 'math-utils-1',
          path: 'src/utils/math1.ts',
          content: `
            export function calculateSum(numbers: number[]): number {
              return numbers.reduce((sum, num) => sum + num, 0);
            }
            
            export function calculateAverage(numbers: number[]): number {
              if (numbers.length === 0) return 0;
              return calculateSum(numbers) / numbers.length;
            }
          `
        },
        {
          id: 'math-utils-2',
          path: 'src/utils/math2.ts',
          content: `
            export function addNumbers(values: number[]): number {
              let total = 0;
              for (const value of values) {
                total += value;
              }
              return total;
            }
            
            export function findMean(values: number[]): number {
              return values.length > 0 ? addNumbers(values) / values.length : 0;
            }
          `
        },
        {
          id: 'string-utils',
          path: 'src/utils/string.ts',
          content: `
            export function capitalizeString(str: string): string {
              return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            }
            
            export function reverseString(str: string): string {
              return str.split('').reverse().join('');
            }
          `
        }
      ];

      // Analyze all files to index them
      for (const fileData of codeFiles) {
        const codeFile: CodeFile = {
          id: fileData.id,
          path: fileData.path,
          content: fileData.content,
          language: 'typescript',
          size: fileData.content.length,
          lastModified: new Date(),
          hash: `hash-${fileData.id}`,
          metadata: {} as any
        };

        await codeIntelligenceService.analyzer.analyzeCodeFile(codeFile);
      }

      // Search for similar code
      const searchResults = await codeIntelligenceService.analyzer.findSimilarCode(
        'function that sums array of numbers',
        'typescript',
        5
      );

      expect(searchResults.length).toBeGreaterThan(0);
      
      // Should find both sum functions
      const mathResults = searchResults.filter(result => 
        result.path.includes('math') && 
        (result.content.includes('sum') || result.content.includes('add'))
      );
      expect(mathResults.length).toBeGreaterThan(0);

      // Results should be sorted by similarity
      for (let i = 1; i < searchResults.length; i++) {
        expect(searchResults[i].similarity).toBeLessThanOrEqual(searchResults[i - 1].similarity);
      }
    });

    it('should generate different types of code correctly', async () => {
      // Test function generation
      const functionRequest: CodeGenerationRequest = {
        id: 'func-gen-test',
        type: GenerationType.FUNCTION,
        description: 'Create a function to validate email addresses',
        context: {
          language: 'typescript'
        },
        constraints: {},
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

      const functionResult = await codeIntelligenceService.generator.generateCode(functionRequest);
      
      expect(functionResult.type).toBe(GenerationType.FUNCTION);
      expect(functionResult.generatedCode).toContain('function');
      expect(functionResult.generatedCode).toContain('email');

      // Test class generation
      const classRequest: CodeGenerationRequest = {
        id: 'class-gen-test',
        type: GenerationType.CLASS,
        description: 'Create a Task class with id, title, and completed properties',
        context: {
          language: 'typescript'
        },
        constraints: {},
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

      const classResult = await codeIntelligenceService.generator.generateCode(classRequest);
      
      expect(classResult.type).toBe(GenerationType.CLASS);
      expect(classResult.generatedCode).toContain('class');
      expect(classResult.generatedCode).toContain('Task');

      // Test boilerplate generation
      const boilerplateRequest: CodeGenerationRequest = {
        id: 'boilerplate-gen-test',
        type: GenerationType.BOILERPLATE,
        description: 'Create a React component boilerplate',
        context: {
          language: 'typescript',
          framework: 'react'
        },
        constraints: {},
        preferences: {
          verbosity: 'minimal' as any,
          includeComments: false,
          includeDocumentation: false,
          includeExamples: false,
          optimizeForReadability: true,
          optimizeForPerformance: false,
          followBestPractices: true
        }
      };

      const boilerplateResult = await codeIntelligenceService.generator.generateCode(boilerplateRequest);
      
      expect(boilerplateResult.type).toBe(GenerationType.BOILERPLATE);
      expect(boilerplateResult.generatedCode).toContain('React');
      expect(boilerplateResult.generatedCode).toContain('Component');
    });

    it('should provide comprehensive quality analysis', async () => {
      // Create files with different quality levels
      const highQualityCode = `
        /**
         * Service for managing user authentication
         */
        export class AuthService {
          private readonly tokenExpiry = 3600000; // 1 hour
          
          /**
           * Authenticates a user with email and password
           * @param email - User email address
           * @param password - User password
           * @returns Promise resolving to authentication result
           */
          async authenticate(email: string, password: string): Promise<AuthResult> {
            this.validateInput(email, password);
            
            const user = await this.findUserByEmail(email);
            if (!user) {
              throw new AuthError('User not found');
            }
            
            const isValidPassword = await this.verifyPassword(password, user.passwordHash);
            if (!isValidPassword) {
              throw new AuthError('Invalid password');
            }
            
            return this.createAuthResult(user);
          }
          
          private validateInput(email: string, password: string): void {
            if (!email || !password) {
              throw new AuthError('Email and password are required');
            }
          }
          
          private async findUserByEmail(email: string): Promise<User | null> {
            // Implementation would query database
            return null;
          }
          
          private async verifyPassword(password: string, hash: string): Promise<boolean> {
            // Implementation would verify password hash
            return false;
          }
          
          private createAuthResult(user: User): AuthResult {
            return {
              user,
              token: this.generateToken(user),
              expiresAt: new Date(Date.now() + this.tokenExpiry)
            };
          }
          
          private generateToken(user: User): string {
            // Implementation would generate JWT token
            return 'token';
          }
        }
      `;

      const lowQualityCode = `
        function doAuth(e, p) {
          if (e && p) {
            var u = getUser(e);
            if (u) {
              if (checkPwd(p, u.pwd)) {
                return { user: u, token: makeToken(u) };
              } else {
                throw new Error('bad pwd');
              }
            } else {
              throw new Error('no user');
            }
          } else {
            throw new Error('need email and pwd');
          }
        }
        
        function getUser(email) { return null; }
        function checkPwd(pwd, hash) { return false; }
        function makeToken(user) { return 'token'; }
      `;

      const projectFiles: CodeFile[] = [
        {
          id: 'high-quality',
          path: 'src/services/auth.service.ts',
          content: highQualityCode,
          language: 'typescript',
          size: highQualityCode.length,
          lastModified: new Date(),
          hash: 'high-quality-hash',
          metadata: {} as any
        },
        {
          id: 'low-quality',
          path: 'src/legacy/auth.js',
          content: lowQualityCode,
          language: 'javascript',
          size: lowQualityCode.length,
          lastModified: new Date(),
          hash: 'low-quality-hash',
          metadata: {} as any
        }
      ];

      const qualityReport = await codeIntelligenceService.qualityAnalyzer.analyzeProjectQuality('quality-test-project', projectFiles);

      expect(qualityReport).toBeDefined();
      expect(qualityReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(qualityReport.overallScore).toBeLessThanOrEqual(1);

      // Should have metrics for all quality dimensions
      expect(qualityReport.metrics.maintainability.score).toBeGreaterThanOrEqual(0);
      expect(qualityReport.metrics.reliability.score).toBeGreaterThanOrEqual(0);
      expect(qualityReport.metrics.security.score).toBeGreaterThanOrEqual(0);
      expect(qualityReport.metrics.performance.score).toBeGreaterThanOrEqual(0);
      expect(qualityReport.metrics.testability.score).toBeGreaterThanOrEqual(0);
      expect(qualityReport.metrics.readability.score).toBeGreaterThanOrEqual(0);

      // Should identify issues in low-quality code
      expect(qualityReport.issues.length).toBeGreaterThan(0);
      
      // Should provide recommendations
      expect(qualityReport.recommendations.length).toBeGreaterThan(0);

      // Test quality gate
      const qualityGate = {
        name: 'Test Gate',
        conditions: [
          { metric: 'overall', operator: 'gt' as any, threshold: 0.5 },
          { metric: 'readability', operator: 'gt' as any, threshold: 0.6 }
        ]
      };

      const gateResult = await codeIntelligenceService.qualityAnalyzer.getQualityGate('quality-test-project', qualityGate);
      
      expect(gateResult).toBeDefined();
      expect(gateResult.gateName).toBe('Test Gate');
      expect(typeof gateResult.passed).toBe('boolean');
      expect(gateResult.conditions).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent code analyses', async () => {
      const codeFiles = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-file-${i}`,
        path: `src/test${i}.ts`,
        content: `
          export function testFunction${i}(param: string): string {
            return param.toUpperCase();
          }
          
          export class TestClass${i} {
            private value: string;
            
            constructor(value: string) {
              this.value = value;
            }
            
            getValue(): string {
              return this.value;
            }
          }
        `,
        language: 'typescript',
        size: 200,
        lastModified: new Date(),
        hash: `hash-${i}`,
        metadata: {} as any
      }));

      // Analyze all files concurrently
      const analysisPromises = codeFiles.map(fileData => 
        codeIntelligenceService.analyzer.analyzeCodeFile(fileData as CodeFile)
      );

      const results = await Promise.all(analysisPromises);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.fileId).toBe(`concurrent-file-${index}`);
        expect(result.metrics.functionCount).toBeGreaterThan(0);
        expect(result.metrics.classCount).toBe(1);
      });
    });

    it('should handle large code files efficiently', async () => {
      // Generate a large code file
      const largeCodeParts = [];
      for (let i = 0; i < 100; i++) {
        largeCodeParts.push(`
          export function generatedFunction${i}(param${i}: string): string {
            if (param${i}) {
              return param${i}.toLowerCase();
            }
            return '';
          }
        `);
      }

      const largeCode = largeCodeParts.join('\n');
      const largeCodeFile: CodeFile = {
        id: 'large-file',
        path: 'src/large-file.ts',
        content: largeCode,
        language: 'typescript',
        size: largeCode.length,
        lastModified: new Date(),
        hash: 'large-file-hash',
        metadata: {} as any
      };

      const startTime = Date.now();
      const result = await codeIntelligenceService.analyzer.analyzeCodeFile(largeCodeFile);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.metrics.functionCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed code gracefully', async () => {
      const malformedCode = `
        function incomplete(param {
          if (param
            return param
        }
        
        class MissingBrace {
          method() {
            console.log('missing closing brace'
        
        export { incomplete, MissingBrace
      `;

      const codeFile: CodeFile = {
        id: 'malformed-file',
        path: 'src/malformed.ts',
        content: malformedCode,
        language: 'typescript',
        size: malformedCode.length,
        lastModified: new Date(),
        hash: 'malformed-hash',
        metadata: {} as any
      };

      // Should not throw an error, but handle gracefully
      const result = await codeIntelligenceService.analyzer.analyzeCodeFile(codeFile);
      
      expect(result).toBeDefined();
      expect(result.fileId).toBe('malformed-file');
      // May have lower quality scores due to parsing issues
      expect(result.quality.overall).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty code files', async () => {
      const emptyCodeFile: CodeFile = {
        id: 'empty-file',
        path: 'src/empty.ts',
        content: '',
        language: 'typescript',
        size: 0,
        lastModified: new Date(),
        hash: 'empty-hash',
        metadata: {} as any
      };

      const result = await codeIntelligenceService.analyzer.analyzeCodeFile(emptyCodeFile);
      
      expect(result).toBeDefined();
      expect(result.metrics.linesOfCode).toBe(0);
      expect(result.metrics.functionCount).toBe(0);
      expect(result.metrics.classCount).toBe(0);
    });

    it('should handle unsupported programming languages', async () => {
      const unsupportedCode = `
        (defn hello-world []
          (println "Hello, World!"))
      `;

      const codeFile: CodeFile = {
        id: 'unsupported-file',
        path: 'src/test.clj',
        content: unsupportedCode,
        language: 'clojure',
        size: unsupportedCode.length,
        lastModified: new Date(),
        hash: 'unsupported-hash',
        metadata: {} as any
      };

      // Should handle gracefully even for unsupported languages
      const result = await codeIntelligenceService.analyzer.analyzeCodeFile(codeFile);
      
      expect(result).toBeDefined();
      expect(result.fileId).toBe('unsupported-file');
    });
  });
});