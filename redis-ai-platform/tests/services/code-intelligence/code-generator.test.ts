import { Redis } from 'ioredis';
import { CodeGenerator, CodeGenerationRequest, GenerationType, GenerationContext } from '../../../src/services/code-intelligence/code-generator';
import { EmbeddingManager } from '../../../src/services/embedding-manager';
import { CodeAnalyzer } from '../../../src/services/code-intelligence/code-analyzer';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../../src/services/embedding-manager');
jest.mock('../../../src/services/code-intelligence/code-analyzer');

const MockedRedis = Redis as jest.MockedClass<typeof Redis>;
const MockedEmbeddingManager = EmbeddingManager as jest.MockedClass<typeof EmbeddingManager>;
const MockedCodeAnalyzer = CodeAnalyzer as jest.MockedClass<typeof CodeAnalyzer>;

describe('CodeGenerator', () => {
  let redis: jest.Mocked<Redis>;
  let embeddingManager: jest.Mocked<EmbeddingManager>;
  let codeAnalyzer: jest.Mocked<CodeAnalyzer>;
  let codeGenerator: CodeGenerator;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    embeddingManager = new MockedEmbeddingManager(redis) as jest.Mocked<EmbeddingManager>;
    codeAnalyzer = new MockedCodeAnalyzer(redis, embeddingManager) as jest.Mocked<CodeAnalyzer>;
    codeGenerator = new CodeGenerator(redis, embeddingManager, codeAnalyzer);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    embeddingManager.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
    codeAnalyzer.analyzeCodeFile = jest.fn().mockResolvedValue({
      fileId: 'test',
      analysisDate: new Date(),
      metrics: {
        linesOfCode: 10,
        cyclomaticComplexity: 2,
        maintainabilityIndex: 0.8,
        technicalDebt: 0.1,
        testCoverage: 0.9,
        duplicateLines: 0,
        functionCount: 1,
        classCount: 0
      },
      patterns: [],
      suggestions: [],
      dependencies: [],
      quality: {
        overall: 0.8,
        maintainability: 0.8,
        reliability: 0.9,
        security: 0.8,
        performance: 0.7,
        readability: 0.8,
        testability: 0.8
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCode', () => {
    it('should generate a function successfully', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-request-1',
        type: GenerationType.FUNCTION,
        description: 'Create a function called calculateSum that takes an array of numbers and returns their sum',
        context: {
          language: 'typescript',
          codeStyle: {
            indentation: 'spaces' as any,
            indentSize: 2,
            lineLength: 80,
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
          maxLines: 50,
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

      const result = await codeGenerator.generateCode(request);

      expect(result).toBeDefined();
      expect(result.requestId).toBe('test-request-1');
      expect(result.type).toBe(GenerationType.FUNCTION);
      expect(result.language).toBe('typescript');
      expect(result.generatedCode).toContain('function');
      expect(result.generatedCode).toContain('calculateSum');
      expect(result.quality.overall).toBeGreaterThanOrEqual(0);
      expect(result.quality.overall).toBeLessThanOrEqual(1);
    });

    it('should generate a class successfully', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-request-2',
        type: GenerationType.CLASS,
        description: 'Create a User class with name and email properties and a method to get full info',
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

      const result = await codeGenerator.generateCode(request);

      expect(result).toBeDefined();
      expect(result.type).toBe(GenerationType.CLASS);
      expect(result.generatedCode).toContain('class');
      expect(result.generatedCode).toContain('User');
      expect(result.metadata.linesGenerated).toBeGreaterThan(0);
    });

    it('should generate tests for existing code', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-request-3',
        type: GenerationType.TEST,
        description: 'Generate unit tests for the provided function',
        context: {
          language: 'typescript',
          existingCode: `
            function add(a: number, b: number): number {
              return a + b;
            }
          `,
          targetFile: 'math.ts'
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

      const result = await codeGenerator.generateCode(request);

      expect(result).toBeDefined();
      expect(result.type).toBe(GenerationType.TEST);
      expect(result.generatedCode).toContain('describe');
      expect(result.generatedCode).toContain('it');
      expect(result.generatedCode).toContain('add');
    });

    it('should generate documentation for existing code', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-request-4',
        type: GenerationType.DOCUMENTATION,
        description: 'Generate comprehensive documentation for the provided code',
        context: {
          language: 'typescript',
          existingCode: `
            class Calculator {
              add(a: number, b: number): number {
                return a + b;
              }
              
              multiply(a: number, b: number): number {
                return a * b;
              }
            }
          `,
          targetFile: 'calculator.ts'
        },
        constraints: {},
        preferences: {
          verbosity: 'comprehensive' as any,
          includeComments: true,
          includeDocumentation: true,
          includeExamples: true,
          optimizeForReadability: true,
          optimizeForPerformance: false,
          followBestPractices: true
        }
      };

      const result = await codeGenerator.generateCode(request);

      expect(result).toBeDefined();
      expect(result.type).toBe(GenerationType.DOCUMENTATION);
      expect(result.generatedCode).toContain('# ');
      expect(result.generatedCode).toContain('Calculator');
      expect(result.generatedCode).toContain('## ');
    });

    it('should generate boilerplate code', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-request-5',
        type: GenerationType.BOILERPLATE,
        description: 'Generate a React component boilerplate',
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

      const result = await codeGenerator.generateCode(request);

      expect(result).toBeDefined();
      expect(result.type).toBe(GenerationType.BOILERPLATE);
      expect(result.generatedCode).toContain('import React');
      expect(result.generatedCode).toContain('Component');
      expect(result.generatedCode).toContain('export default');
    });

    it('should handle unsupported generation types', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-request-6',
        type: 'unsupported' as GenerationType,
        description: 'This should fail',
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

      await expect(codeGenerator.generateCode(request)).rejects.toThrow('Unsupported generation type');
    });
  });

  describe('generateFunction', () => {
    it('should extract function name from description', async () => {
      const request: CodeGenerationRequest = {
        id: 'func-test',
        type: GenerationType.FUNCTION,
        description: 'Create a function called validateEmail that checks if an email is valid',
        context: { language: 'typescript' },
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

      const result = await codeGenerator.generateFunction(request, {}, []);

      expect(result).toContain('validateEmail');
      expect(result).toContain('function');
    });

    it('should include documentation when requested', async () => {
      const request: CodeGenerationRequest = {
        id: 'func-doc-test',
        type: GenerationType.FUNCTION,
        description: 'Create a function to process user data',
        context: { language: 'typescript' },
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

      const result = await codeGenerator.generateFunction(request, {}, []);

      expect(result).toContain('/**');
      expect(result).toContain('*/');
    });
  });

  describe('generateClass', () => {
    it('should generate class with properties and methods', async () => {
      const request: CodeGenerationRequest = {
        id: 'class-test',
        type: GenerationType.CLASS,
        description: 'Create a Person class with name and age properties',
        context: { language: 'typescript' },
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

      const result = await codeGenerator.generateClass(request, {}, []);

      expect(result).toContain('class');
      expect(result).toContain('Person');
      expect(result).toContain('{');
      expect(result).toContain('}');
    });
  });

  describe('code style application', () => {
    it('should apply indentation preferences', async () => {
      const request: CodeGenerationRequest = {
        id: 'style-test',
        type: GenerationType.FUNCTION,
        description: 'Create a simple function',
        context: {
          language: 'typescript',
          codeStyle: {
            indentation: 'spaces' as any,
            indentSize: 4,
            lineLength: 120,
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
        constraints: {},
        preferences: {
          verbosity: 'standard' as any,
          includeComments: true,
          includeDocumentation: false,
          includeExamples: false,
          optimizeForReadability: true,
          optimizeForPerformance: false,
          followBestPractices: true
        }
      };

      const result = await codeGenerator.generateCode(request);

      // Check that 4-space indentation is used
      const lines = result.generatedCode.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('    '));
      expect(indentedLines.length).toBeGreaterThan(0);
    });
  });

  describe('quality assessment', () => {
    it('should calculate quality metrics for generated code', async () => {
      const request: CodeGenerationRequest = {
        id: 'quality-test',
        type: GenerationType.FUNCTION,
        description: 'Create a function with good quality',
        context: { language: 'typescript' },
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

      const result = await codeGenerator.generateCode(request);

      expect(result.quality).toBeDefined();
      expect(result.quality.overall).toBeGreaterThanOrEqual(0);
      expect(result.quality.overall).toBeLessThanOrEqual(1);
      expect(result.quality.correctness).toBeGreaterThanOrEqual(0);
      expect(result.quality.readability).toBeGreaterThanOrEqual(0);
      expect(result.quality.maintainability).toBeGreaterThanOrEqual(0);
    });

    it('should generate suggestions for improvement', async () => {
      const request: CodeGenerationRequest = {
        id: 'suggestions-test',
        type: GenerationType.FUNCTION,
        description: 'Create a function that might need improvements',
        context: { language: 'typescript' },
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

      // Mock lower quality to trigger suggestions
      codeAnalyzer.analyzeCodeFile = jest.fn().mockResolvedValue({
        fileId: 'test',
        analysisDate: new Date(),
        metrics: {
          linesOfCode: 10,
          cyclomaticComplexity: 2,
          maintainabilityIndex: 0.5,
          technicalDebt: 0.3,
          testCoverage: 0.4,
          duplicateLines: 0,
          functionCount: 1,
          classCount: 0
        },
        patterns: [],
        suggestions: [],
        dependencies: [],
        quality: {
          overall: 0.5,
          maintainability: 0.5,
          reliability: 0.6,
          security: 0.7,
          performance: 0.6,
          readability: 0.6,
          testability: 0.5
        }
      });

      const result = await codeGenerator.generateCode(request);

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide alternative implementations', async () => {
      const request: CodeGenerationRequest = {
        id: 'alternatives-test',
        type: GenerationType.FUNCTION,
        description: 'Create a function with multiple possible implementations',
        context: { language: 'typescript' },
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

      const result = await codeGenerator.generateCode(request);

      expect(result.alternatives.length).toBeGreaterThan(0);
      result.alternatives.forEach(alt => {
        expect(alt.description).toBeDefined();
        expect(alt.code).toBeDefined();
        expect(alt.tradeoffs.length).toBeGreaterThan(0);
        expect(alt.score).toBeGreaterThanOrEqual(0);
        expect(alt.score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('framework-specific generation', () => {
    it('should generate React boilerplate', async () => {
      const request: CodeGenerationRequest = {
        id: 'react-test',
        type: GenerationType.BOILERPLATE,
        description: 'Create a React component',
        context: {
          language: 'typescript',
          framework: 'react'
        },
        constraints: {},
        preferences: {
          verbosity: 'standard' as any,
          includeComments: true,
          includeDocumentation: false,
          includeExamples: false,
          optimizeForReadability: true,
          optimizeForPerformance: false,
          followBestPractices: true
        }
      };

      const result = await codeGenerator.generateBoilerplate(request, {}, []);

      expect(result).toContain('import React');
      expect(result).toContain('Component');
      expect(result).toContain('export default');
    });

    it('should generate Express boilerplate', async () => {
      const request: CodeGenerationRequest = {
        id: 'express-test',
        type: GenerationType.BOILERPLATE,
        description: 'Create an Express server',
        context: {
          language: 'typescript',
          framework: 'express'
        },
        constraints: {},
        preferences: {
          verbosity: 'standard' as any,
          includeComments: true,
          includeDocumentation: false,
          includeExamples: false,
          optimizeForReadability: true,
          optimizeForPerformance: false,
          followBestPractices: true
        }
      };

      const result = await codeGenerator.generateBoilerplate(request, {}, []);

      expect(result).toContain('import express');
      expect(result).toContain('app.listen');
    });

    it('should generate Python boilerplate', async () => {
      const request: CodeGenerationRequest = {
        id: 'python-test',
        type: GenerationType.BOILERPLATE,
        description: 'Create a Python script',
        context: {
          language: 'python'
        },
        constraints: {},
        preferences: {
          verbosity: 'standard' as any,
          includeComments: true,
          includeDocumentation: false,
          includeExamples: false,
          optimizeForReadability: true,
          optimizeForPerformance: false,
          followBestPractices: true
        }
      };

      const result = await codeGenerator.generateBoilerplate(request, {}, []);

      expect(result).toContain('def main()');
      expect(result).toContain('if __name__ == "__main__"');
    });
  });
});