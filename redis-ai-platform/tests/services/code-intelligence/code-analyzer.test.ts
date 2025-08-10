import { Redis } from 'ioredis';
import { CodeAnalyzer, CodeFile, PatternCategory, PatternSeverity } from '../../../src/services/code-intelligence/code-analyzer';
import { EmbeddingManager } from '../../../src/services/embedding-manager';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock EmbeddingManager
jest.mock('../../../src/services/embedding-manager');
const MockedEmbeddingManager = EmbeddingManager as jest.MockedClass<typeof EmbeddingManager>;

describe('CodeAnalyzer', () => {
  let redis: jest.Mocked<Redis>;
  let embeddingManager: jest.Mocked<EmbeddingManager>;
  let codeAnalyzer: CodeAnalyzer;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    embeddingManager = new MockedEmbeddingManager(redis) as jest.Mocked<EmbeddingManager>;
    codeAnalyzer = new CodeAnalyzer(redis, embeddingManager);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.call = jest.fn().mockResolvedValue('OK');
    embeddingManager.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeCodeFile', () => {
    it('should analyze a TypeScript file successfully', async () => {
      const codeFile: CodeFile = {
        id: 'test-file-1',
        path: 'src/test.ts',
        content: `
          import { Component } from 'react';
          
          /**
           * Test component for demonstration
           */
          class TestComponent extends Component {
            private name: string;
            
            constructor(props: any) {
              super(props);
              this.name = 'test';
            }
            
            public render(): JSX.Element {
              if (this.name) {
                return <div>{this.name}</div>;
              }
              return <div>No name</div>;
            }
          }
          
          export default TestComponent;
        `,
        language: 'typescript',
        size: 500,
        lastModified: new Date(),
        hash: 'abc123',
        metadata: {} as any
      };

      const result = await codeAnalyzer.analyzeCodeFile(codeFile);

      expect(result).toBeDefined();
      expect(result.fileId).toBe('test-file-1');
      expect(result.metrics).toBeDefined();
      expect(result.metrics.linesOfCode).toBeGreaterThan(0);
      expect(result.metrics.functionCount).toBeGreaterThan(0);
      expect(result.metrics.classCount).toBe(1);
      expect(result.quality).toBeDefined();
      expect(result.quality.overall).toBeGreaterThanOrEqual(0);
      expect(result.quality.overall).toBeLessThanOrEqual(1);
    });

    it('should detect code smells in complex code', async () => {
      const complexCode = `
        class ComplexClass {
          method1() { ${Array(60).fill('console.log("line");').join('\n')} }
          method2() { 
            let complexity = 1;
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            if (true) { complexity++; }
            return complexity;
          }
        }
      `;

      const codeFile: CodeFile = {
        id: 'complex-file',
        path: 'src/complex.ts',
        content: complexCode,
        language: 'typescript',
        size: complexCode.length,
        lastModified: new Date(),
        hash: 'complex123',
        metadata: {} as any
      };

      const result = await codeAnalyzer.analyzeCodeFile(codeFile);

      expect(result.patterns.length).toBeGreaterThan(0);
      
      // Should detect long method
      const longMethodPattern = result.patterns.find(p => p.patternId === 'long-method');
      expect(longMethodPattern).toBeDefined();
      expect(longMethodPattern?.severity).toBe(PatternSeverity.WARNING);

      // Should detect high complexity
      const complexityPattern = result.patterns.find(p => p.patternId === 'high-complexity');
      expect(complexityPattern).toBeDefined();
      expect(complexityPattern?.severity).toBe(PatternSeverity.ERROR);
    });

    it('should generate embeddings for code components', async () => {
      const codeFile: CodeFile = {
        id: 'embedding-test',
        path: 'src/embedding.ts',
        content: `
          function testFunction(param: string): string {
            return param.toUpperCase();
          }
        `,
        language: 'typescript',
        size: 100,
        lastModified: new Date(),
        hash: 'embed123',
        metadata: {} as any
      };

      await codeAnalyzer.analyzeCodeFile(codeFile);

      expect(embeddingManager.generateEmbedding).toHaveBeenCalled();
      expect(redis.hset).toHaveBeenCalledWith(
        expect.stringMatching(/^code:typescript:/),
        'content', expect.any(String),
        'path', 'src/embedding.ts',
        'function_name', expect.any(String),
        'start_line', expect.any(String),
        'end_line', expect.any(String),
        'complexity', expect.any(String),
        'embeddings', expect.any(Buffer)
      );
    });
  });

  describe('findSimilarCode', () => {
    it('should find similar code using vector search', async () => {
      const mockSearchResults = [
        1, // Number of results
        'code:typescript:func_123',
        ['content', 'function test() { return true; }', 'path', 'src/test.ts', 'function_name', 'test', 'class_name', '', 'start_line', '1', 'end_line', '3', 'complexity', '1', 'score', '0.95']
      ];

      redis.call = jest.fn().mockResolvedValue(mockSearchResults);

      const results = await codeAnalyzer.findSimilarCode('function test() { return false; }', 'typescript', 5);

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('function test() { return true; }');
      expect(results[0].path).toBe('src/test.ts');
      expect(results[0].functionName).toBe('test');
      expect(results[0].similarity).toBe(0.95);
      expect(embeddingManager.generateEmbedding).toHaveBeenCalledWith('function test() { return false; }');
    });

    it('should handle search errors gracefully', async () => {
      redis.call = jest.fn().mockRejectedValue(new Error('Search failed'));

      const results = await codeAnalyzer.findSimilarCode('test code', 'typescript');

      expect(results).toEqual([]);
    });
  });

  describe('detectCodeSmells', () => {
    it('should detect various code smells', async () => {
      const codeWithSmells = `
        class LargeClass {
          ${Array(250).fill('private field: string;').join('\n')}
          
          longMethod() {
            ${Array(60).fill('console.log("line");').join('\n')}
          }
          
          complexMethod() {
            let result = 0;
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            if (true) { result++; }
            return result;
          }
        }
      `;

      const codeFile: CodeFile = {
        id: 'smells-test',
        path: 'src/smells.ts',
        content: codeWithSmells,
        language: 'typescript',
        size: codeWithSmells.length,
        lastModified: new Date(),
        hash: 'smells123',
        metadata: {} as any
      };

      const smells = await codeAnalyzer.detectCodeSmells(codeFile);

      expect(smells.length).toBeGreaterThan(0);
      
      // Should detect large class
      const largeClass = smells.find(s => s.patternId === 'large-class');
      expect(largeClass).toBeDefined();
      expect(largeClass?.category).toBe(PatternCategory.CODE_SMELL);

      // Should detect long method
      const longMethod = smells.find(s => s.patternId === 'long-method');
      expect(longMethod).toBeDefined();

      // Should detect high complexity
      const highComplexity = smells.find(s => s.patternId === 'high-complexity');
      expect(highComplexity).toBeDefined();
    });
  });

  describe('generateCodeSuggestions', () => {
    it('should generate suggestions based on analysis results', async () => {
      const codeFile: CodeFile = {
        id: 'suggestions-test',
        path: 'src/suggestions.ts',
        content: `
          function f(x) {
            if (x > 0) {
              if (x < 10) {
                if (x % 2 === 0) {
                  return x * 2;
                } else {
                  return x * 3;
                }
              } else {
                return x / 2;
              }
            } else {
              return 0;
            }
          }
        `,
        language: 'typescript',
        size: 200,
        lastModified: new Date(),
        hash: 'suggest123',
        metadata: {} as any
      };

      const analysisResult = await codeAnalyzer.analyzeCodeFile(codeFile);
      const suggestions = await codeAnalyzer.generateCodeSuggestions(codeFile, analysisResult);

      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should suggest better variable naming
      const namingSuggestion = suggestions.find(s => s.type === 'rename');
      expect(namingSuggestion).toBeDefined();

      // Should suggest method extraction for complex function
      const extractionSuggestion = suggestions.find(s => s.type === 'extract');
      expect(extractionSuggestion).toBeDefined();
    });
  });

  describe('code parsing', () => {
    it('should parse function signatures correctly', async () => {
      const codeFile: CodeFile = {
        id: 'parse-test',
        path: 'src/parse.ts',
        content: `
          function simpleFunction(): void {}
          
          function functionWithParams(name: string, age: number, optional?: boolean): string {
            return name;
          }
          
          const arrowFunction = (x: number, y: number): number => x + y;
        `,
        language: 'typescript',
        size: 200,
        lastModified: new Date(),
        hash: 'parse123',
        metadata: {} as any
      };

      const result = await codeAnalyzer.analyzeCodeFile(codeFile);

      expect(result.metrics.functionCount).toBe(3);
    });

    it('should parse class structures correctly', async () => {
      const codeFile: CodeFile = {
        id: 'class-test',
        path: 'src/class.ts',
        content: `
          class BaseClass {
            protected value: number;
          }
          
          class DerivedClass extends BaseClass implements SomeInterface {
            private name: string;
            
            constructor(name: string) {
              super();
              this.name = name;
            }
            
            public getName(): string {
              return this.name;
            }
          }
          
          interface SomeInterface {
            getName(): string;
          }
        `,
        language: 'typescript',
        size: 300,
        lastModified: new Date(),
        hash: 'class123',
        metadata: {} as any
      };

      const result = await codeAnalyzer.analyzeCodeFile(codeFile);

      expect(result.metrics.classCount).toBe(2);
    });

    it('should handle different programming languages', async () => {
      const pythonCode = `
        def calculate_sum(numbers):
            total = 0
            for num in numbers:
                if num > 0:
                    total += num
            return total
        
        class Calculator:
            def __init__(self):
                self.history = []
            
            def add(self, a, b):
                result = a + b
                self.history.append(result)
                return result
      `;

      const codeFile: CodeFile = {
        id: 'python-test',
        path: 'src/test.py',
        content: pythonCode,
        language: 'python',
        size: pythonCode.length,
        lastModified: new Date(),
        hash: 'python123',
        metadata: {} as any
      };

      const result = await codeAnalyzer.analyzeCodeFile(codeFile);

      expect(result).toBeDefined();
      expect(result.fileId).toBe('python-test');
      expect(result.metrics.linesOfCode).toBeGreaterThan(0);
    });
  });

  describe('complexity calculation', () => {
    it('should calculate cyclomatic complexity correctly', async () => {
      const complexCode = `
        function complexFunction(x: number): number {
          if (x > 0) {
            if (x < 10) {
              for (let i = 0; i < x; i++) {
                if (i % 2 === 0) {
                  continue;
                }
              }
            } else {
              while (x > 10) {
                x--;
              }
            }
          } else {
            switch (x) {
              case -1:
                return 1;
              case -2:
                return 2;
              default:
                return 0;
            }
          }
          return x;
        }
      `;

      const codeFile: CodeFile = {
        id: 'complexity-test',
        path: 'src/complexity.ts',
        content: complexCode,
        language: 'typescript',
        size: complexCode.length,
        lastModified: new Date(),
        hash: 'complex123',
        metadata: {} as any
      };

      const result = await codeAnalyzer.analyzeCodeFile(codeFile);

      expect(result.metrics.cyclomaticComplexity).toBeGreaterThan(5);
    });
  });
});