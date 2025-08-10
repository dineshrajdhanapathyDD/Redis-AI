import { EmbeddingManager } from '../../src/services/embedding-manager';
import { MultiModalSearch } from '../../src/services/search/multi-modal-search';
import { VectorStorage } from '../../src/services/vector-storage';
import { RoutingEngine } from '../../src/services/ai-routing/routing-engine';
import { CodeAnalyzer } from '../../src/services/code-intelligence/code-analyzer';
import { BrandAnalyzer } from '../../src/services/content-consistency/brand-analyzer';
import { PersonalizationEngine } from '../../src/services/learning/personalization-engine';
import { Redis } from 'ioredis';
import { logger } from '../../src/utils/logger';

interface AccuracyTestCase {
  id: string;
  input: any;
  expectedOutput: any;
  tolerance?: number;
  description: string;
}

interface QualityMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  averageConfidence: number;
  responseTime: number;
}

class AIQualityTester {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private vectorStorage: VectorStorage;
  private multiModalSearch: MultiModalSearch;
  private routingEngine: RoutingEngine;
  private codeAnalyzer: CodeAnalyzer;
  private brandAnalyzer: BrandAnalyzer;
  private personalizationEngine: PersonalizationEngine;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.embeddingManager = new EmbeddingManager({
      defaultProvider: 'local',
      providers: {
        local: { type: 'local', modelPath: './models/test-model' },
      },
    });

    this.vectorStorage = new VectorStorage(this.redis, {
      defaultIndex: 'quality_test_index',
      dimensions: 384,
      similarity: 'cosine',
    });

    this.multiModalSearch = new MultiModalSearch(this.embeddingManager, this.vectorStorage, this.redis);

    this.routingEngine = new RoutingEngine(this.redis, {
      models: [
        { id: 'fast-model', provider: 'test', endpoint: 'http://localhost:8000', capabilities: ['text'], performance: { latency: 100, accuracy: 0.85 } },
        { id: 'accurate-model', provider: 'test', endpoint: 'http://localhost:8001', capabilities: ['text'], performance: { latency: 500, accuracy: 0.95 } },
        { id: 'balanced-model', provider: 'test', endpoint: 'http://localhost:8002', capabilities: ['text'], performance: { latency: 250, accuracy: 0.90 } },
      ],
      defaultModel: 'balanced-model',
      routingStrategy: 'performance',
    });

    this.codeAnalyzer = new CodeAnalyzer(this.embeddingManager, {
      supportedLanguages: ['typescript', 'javascript', 'python'],
      analysisDepth: 'deep',
    });

    this.brandAnalyzer = new BrandAnalyzer(this.embeddingManager, {
      brandGuidelines: {
        tone: 'professional',
        style: 'modern',
        values: ['innovation', 'reliability', 'excellence'],
      },
      consistencyThreshold: 0.8,
    });

    this.personalizationEngine = new PersonalizationEngine(this.redis, {
      learningRate: 0.1,
      maxRecommendations: 10,
    });
  }

  async initialize(): Promise<void> {
    await this.embeddingManager.initialize();
    await this.vectorStorage.initialize();
  }

  async testEmbeddingQuality(): Promise<QualityMetrics> {
    logger.info('Testing embedding quality...');

    const testCases: AccuracyTestCase[] = [
      {
        id: 'semantic_similarity_1',
        input: { text1: 'artificial intelligence', text2: 'machine learning' },
        expectedOutput: { similarity: 0.8 },
        tolerance: 0.2,
        description: 'Related AI concepts should have high similarity',
      },
      {
        id: 'semantic_similarity_2',
        input: { text1: 'dog', text2: 'cat' },
        expectedOutput: { similarity: 0.6 },
        tolerance: 0.3,
        description: 'Related animals should have moderate similarity',
      },
      {
        id: 'semantic_dissimilarity',
        input: { text1: 'computer science', text2: 'cooking recipes' },
        expectedOutput: { similarity: 0.2 },
        tolerance: 0.3,
        description: 'Unrelated concepts should have low similarity',
      },
      {
        id: 'identical_text',
        input: { text1: 'hello world', text2: 'hello world' },
        expectedOutput: { similarity: 1.0 },
        tolerance: 0.1,
        description: 'Identical text should have perfect similarity',
      },
    ];

    const results: boolean[] = [];
    const confidences: number[] = [];
    const responseTimes: number[] = [];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const embedding1 = await this.embeddingManager.generateEmbedding(testCase.input.text1, 'text');
        const embedding2 = await this.embeddingManager.generateEmbedding(testCase.input.text2, 'text');
        
        const similarity = this.cosineSimilarity(embedding1, embedding2);
        const responseTime = Date.now() - startTime;
        
        const expectedSimilarity = testCase.expectedOutput.similarity;
        const tolerance = testCase.tolerance || 0.1;
        
        const isAccurate = Math.abs(similarity - expectedSimilarity) <= tolerance;
        results.push(isAccurate);
        confidences.push(Math.abs(similarity - expectedSimilarity));
        responseTimes.push(responseTime);

        logger.debug(`Test ${testCase.id}: Expected ${expectedSimilarity}, Got ${similarity.toFixed(3)}, Accurate: ${isAccurate}`);
      } catch (error) {
        logger.error(`Test ${testCase.id} failed:`, error);
        results.push(false);
        confidences.push(0);
        responseTimes.push(Date.now() - startTime);
      }
    }

    return this.calculateQualityMetrics(results, confidences, responseTimes);
  }

  async testSearchAccuracy(): Promise<QualityMetrics> {
    logger.info('Testing search accuracy...');

    // Prepare test dataset
    const documents = [
      { id: 'doc1', content: 'Machine learning algorithms for data analysis', category: 'ai' },
      { id: 'doc2', content: 'Python programming tutorial for beginners', category: 'programming' },
      { id: 'doc3', content: 'Deep learning neural networks explained', category: 'ai' },
      { id: 'doc4', content: 'JavaScript web development best practices', category: 'programming' },
      { id: 'doc5', content: 'Natural language processing techniques', category: 'ai' },
      { id: 'doc6', content: 'Database design and optimization strategies', category: 'database' },
      { id: 'doc7', content: 'Artificial intelligence in healthcare applications', category: 'ai' },
      { id: 'doc8', content: 'React component development patterns', category: 'programming' },
    ];

    // Index documents
    for (const doc of documents) {
      const embedding = await this.embeddingManager.generateEmbedding(doc.content, 'text');
      await this.vectorStorage.upsert([{
        id: doc.id,
        vector: embedding,
        metadata: { content: doc.content, category: doc.category },
      }]);
    }

    const searchTestCases: AccuracyTestCase[] = [
      {
        id: 'ai_search',
        input: { query: 'artificial intelligence machine learning', expectedCategory: 'ai' },
        expectedOutput: { relevantDocs: ['doc1', 'doc3', 'doc5', 'doc7'] },
        description: 'AI-related query should return AI documents',
      },
      {
        id: 'programming_search',
        input: { query: 'programming code development', expectedCategory: 'programming' },
        expectedOutput: { relevantDocs: ['doc2', 'doc4', 'doc8'] },
        description: 'Programming query should return programming documents',
      },
      {
        id: 'specific_tech_search',
        input: { query: 'neural networks deep learning', expectedCategory: 'ai' },
        expectedOutput: { relevantDocs: ['doc3', 'doc7'] },
        description: 'Specific AI query should return most relevant AI documents',
      },
    ];

    const results: boolean[] = [];
    const confidences: number[] = [];
    const responseTimes: number[] = [];

    for (const testCase of searchTestCases) {
      const startTime = Date.now();
      
      try {
        const searchResults = await this.multiModalSearch.search({
          query: testCase.input.query,
          types: ['text'],
          limit: 5,
        });

        const responseTime = Date.now() - startTime;
        const returnedIds = searchResults.results.map(r => r.id);
        const expectedIds = testCase.expectedOutput.relevantDocs;

        // Calculate precision and recall
        const intersection = returnedIds.filter(id => expectedIds.includes(id));
        const precision = intersection.length / returnedIds.length;
        const recall = intersection.length / expectedIds.length;

        // Consider test successful if precision > 0.6 and recall > 0.5
        const isAccurate = precision > 0.6 && recall > 0.5;
        
        results.push(isAccurate);
        confidences.push((precision + recall) / 2);
        responseTimes.push(responseTime);

        logger.debug(`Search test ${testCase.id}: Precision ${precision.toFixed(3)}, Recall ${recall.toFixed(3)}, Accurate: ${isAccurate}`);
      } catch (error) {
        logger.error(`Search test ${testCase.id} failed:`, error);
        results.push(false);
        confidences.push(0);
        responseTimes.push(Date.now() - startTime);
      }
    }

    return this.calculateQualityMetrics(results, confidences, responseTimes);
  }

  async testCodeAnalysisAccuracy(): Promise<QualityMetrics> {
    logger.info('Testing code analysis accuracy...');

    const codeTestCases: AccuracyTestCase[] = [
      {
        id: 'simple_function',
        input: {
          code: 'function add(a, b) { return a + b; }',
          language: 'javascript',
        },
        expectedOutput: {
          complexity: 'low',
          quality: 'high',
          hasIssues: false,
        },
        description: 'Simple function should have low complexity and high quality',
      },
      {
        id: 'complex_function',
        input: {
          code: `
            function complexFunction(data) {
              if (data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                  if (data[i].type === 'special') {
                    for (let j = 0; j < data[i].items.length; j++) {
                      if (data[i].items[j].active) {
                        return processItem(data[i].items[j]);
                      }
                    }
                  }
                }
              }
              return null;
            }
          `,
          language: 'javascript',
        },
        expectedOutput: {
          complexity: 'high',
          quality: 'medium',
          hasIssues: true,
        },
        description: 'Complex nested function should have high complexity',
      },
      {
        id: 'python_class',
        input: {
          code: `
            class Calculator:
                def __init__(self):
                    self.result = 0
                
                def add(self, value):
                    self.result += value
                    return self
                
                def multiply(self, value):
                    self.result *= value
                    return self
          `,
          language: 'python',
        },
        expectedOutput: {
          complexity: 'medium',
          quality: 'high',
          hasIssues: false,
        },
        description: 'Well-structured Python class should have good quality',
      },
    ];

    const results: boolean[] = [];
    const confidences: number[] = [];
    const responseTimes: number[] = [];

    for (const testCase of codeTestCases) {
      const startTime = Date.now();
      
      try {
        const analysis = await this.codeAnalyzer.analyzeCode(
          testCase.input.code,
          testCase.input.language
        );

        const responseTime = Date.now() - startTime;
        
        // Evaluate analysis accuracy
        const complexityMatch = this.evaluateComplexity(analysis.metrics.complexity, testCase.expectedOutput.complexity);
        const qualityMatch = this.evaluateQuality(analysis.quality.overall, testCase.expectedOutput.quality);
        const issuesMatch = (analysis.issues.length > 0) === testCase.expectedOutput.hasIssues;

        const accuracy = (complexityMatch + qualityMatch + (issuesMatch ? 1 : 0)) / 3;
        const isAccurate = accuracy >= 0.7;

        results.push(isAccurate);
        confidences.push(accuracy);
        responseTimes.push(responseTime);

        logger.debug(`Code analysis test ${testCase.id}: Accuracy ${accuracy.toFixed(3)}, Accurate: ${isAccurate}`);
      } catch (error) {
        logger.error(`Code analysis test ${testCase.id} failed:`, error);
        results.push(false);
        confidences.push(0);
        responseTimes.push(Date.now() - startTime);
      }
    }

    return this.calculateQualityMetrics(results, confidences, responseTimes);
  }

  async testBrandConsistencyAccuracy(): Promise<QualityMetrics> {
    logger.info('Testing brand consistency accuracy...');

    const brandTestCases: AccuracyTestCase[] = [
      {
        id: 'professional_content',
        input: {
          content: 'Our innovative solutions deliver exceptional value to enterprise clients through cutting-edge technology and reliable service.',
          contentType: 'marketing',
        },
        expectedOutput: {
          consistency: 'high',
          tone: 'professional',
          alignment: 'good',
        },
        description: 'Professional marketing content should align with brand guidelines',
      },
      {
        id: 'casual_content',
        input: {
          content: 'Hey there! Check out this awesome new feature we just dropped. It\'s gonna blow your mind!',
          contentType: 'social',
        },
        expectedOutput: {
          consistency: 'low',
          tone: 'casual',
          alignment: 'poor',
        },
        description: 'Casual content should not align with professional brand guidelines',
      },
      {
        id: 'technical_content',
        input: {
          content: 'The system architecture leverages microservices patterns to ensure scalability and maintainability while delivering optimal performance.',
          contentType: 'technical',
        },
        expectedOutput: {
          consistency: 'medium',
          tone: 'technical',
          alignment: 'good',
        },
        description: 'Technical content should moderately align with brand guidelines',
      },
    ];

    const results: boolean[] = [];
    const confidences: number[] = [];
    const responseTimes: number[] = [];

    for (const testCase of brandTestCases) {
      const startTime = Date.now();
      
      try {
        const analysis = await this.brandAnalyzer.analyzeContent(
          testCase.input.content,
          { contentType: testCase.input.contentType }
        );

        const responseTime = Date.now() - startTime;
        
        // Evaluate brand analysis accuracy
        const consistencyMatch = this.evaluateConsistency(analysis.score, testCase.expectedOutput.consistency);
        const alignmentMatch = this.evaluateAlignment(analysis.brandAlignment, testCase.expectedOutput.alignment);

        const accuracy = (consistencyMatch + alignmentMatch) / 2;
        const isAccurate = accuracy >= 0.7;

        results.push(isAccurate);
        confidences.push(accuracy);
        responseTimes.push(responseTime);

        logger.debug(`Brand analysis test ${testCase.id}: Accuracy ${accuracy.toFixed(3)}, Accurate: ${isAccurate}`);
      } catch (error) {
        logger.error(`Brand analysis test ${testCase.id} failed:`, error);
        results.push(false);
        confidences.push(0);
        responseTimes.push(Date.now() - startTime);
      }
    }

    return this.calculateQualityMetrics(results, confidences, responseTimes);
  }

  async testPersonalizationAccuracy(): Promise<QualityMetrics> {
    logger.info('Testing personalization accuracy...');

    // Simulate user interactions
    const userId = 'test-user-personalization';
    const interactions = [
      { type: 'search', query: 'machine learning', results: ['doc1', 'doc3'], timestamp: Date.now() - 86400000 },
      { type: 'view', contentId: 'doc1', duration: 30000, timestamp: Date.now() - 82800000 },
      { type: 'view', contentId: 'doc3', duration: 45000, timestamp: Date.now() - 79200000 },
      { type: 'search', query: 'neural networks', results: ['doc3', 'doc7'], timestamp: Date.now() - 75600000 },
      { type: 'view', contentId: 'doc7', duration: 60000, timestamp: Date.now() - 72000000 },
    ];

    // Record interactions
    for (const interaction of interactions) {
      await this.personalizationEngine.recordInteraction(userId, interaction);
    }

    const testCases: AccuracyTestCase[] = [
      {
        id: 'ai_recommendations',
        input: { userId, context: { domain: 'ai' } },
        expectedOutput: { 
          relevantContent: ['doc1', 'doc3', 'doc7'],
          irrelevantContent: ['doc2', 'doc4', 'doc8'],
        },
        description: 'User interested in AI should get AI-related recommendations',
      },
    ];

    const results: boolean[] = [];
    const confidences: number[] = [];
    const responseTimes: number[] = [];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const recommendations = await this.personalizationEngine.getRecommendations(
          testCase.input.userId,
          { type: 'content', limit: 5, context: testCase.input.context }
        );

        const responseTime = Date.now() - startTime;
        
        const recommendedIds = recommendations.map(r => r.contentId);
        const expectedRelevant = testCase.expectedOutput.relevantContent;
        const expectedIrrelevant = testCase.expectedOutput.irrelevantContent;

        // Calculate relevance accuracy
        const relevantRecommended = recommendedIds.filter(id => expectedRelevant.includes(id)).length;
        const irrelevantRecommended = recommendedIds.filter(id => expectedIrrelevant.includes(id)).length;
        
        const relevanceScore = relevantRecommended / Math.max(recommendedIds.length, 1);
        const irrelevanceScore = 1 - (irrelevantRecommended / Math.max(recommendedIds.length, 1));
        
        const accuracy = (relevanceScore + irrelevanceScore) / 2;
        const isAccurate = accuracy >= 0.7;

        results.push(isAccurate);
        confidences.push(accuracy);
        responseTimes.push(responseTime);

        logger.debug(`Personalization test ${testCase.id}: Accuracy ${accuracy.toFixed(3)}, Accurate: ${isAccurate}`);
      } catch (error) {
        logger.error(`Personalization test ${testCase.id} failed:`, error);
        results.push(false);
        confidences.push(0);
        responseTimes.push(Date.now() - startTime);
      }
    }

    return this.calculateQualityMetrics(results, confidences, responseTimes);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private evaluateComplexity(actual: number, expected: string): number {
    const complexityRanges = {
      low: [0, 0.3],
      medium: [0.3, 0.7],
      high: [0.7, 1.0],
    };

    const range = complexityRanges[expected];
    return (actual >= range[0] && actual <= range[1]) ? 1 : 0;
  }

  private evaluateQuality(actual: number, expected: string): number {
    const qualityRanges = {
      low: [0, 0.4],
      medium: [0.4, 0.7],
      high: [0.7, 1.0],
    };

    const range = qualityRanges[expected];
    return (actual >= range[0] && actual <= range[1]) ? 1 : 0;
  }

  private evaluateConsistency(actual: number, expected: string): number {
    const consistencyRanges = {
      low: [0, 0.4],
      medium: [0.4, 0.7],
      high: [0.7, 1.0],
    };

    const range = consistencyRanges[expected];
    return (actual >= range[0] && actual <= range[1]) ? 1 : 0;
  }

  private evaluateAlignment(actual: number, expected: string): number {
    const alignmentRanges = {
      poor: [0, 0.4],
      good: [0.4, 0.8],
      excellent: [0.8, 1.0],
    };

    const range = alignmentRanges[expected];
    return (actual >= range[0] && actual <= range[1]) ? 1 : 0;
  }

  private calculateQualityMetrics(
    results: boolean[],
    confidences: number[],
    responseTimes: number[]
  ): QualityMetrics {
    const accuracy = results.filter(r => r).length / results.length;
    const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const averageResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    // For simplicity, using accuracy as precision and recall
    // In a real implementation, these would be calculated based on true/false positives/negatives
    const precision = accuracy;
    const recall = accuracy;
    const f1Score = 2 * (precision * recall) / (precision + recall);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      averageConfidence,
      responseTime: averageResponseTime,
    };
  }

  async cleanup(): Promise<void> {
    const keys = await this.redis.keys('quality-test-*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    await this.redis.quit();
  }
}

describe('AI Quality and Accuracy Tests', () => {
  let qualityTester: AIQualityTester;
  let isRedisAvailable = false;

  beforeAll(async () => {
    try {
      qualityTester = new AIQualityTester();
      await qualityTester.initialize();
      isRedisAvailable = true;
      logger.info('AI quality tester initialized');
    } catch (error) {
      logger.warn('Redis not available for AI quality tests, skipping');
      isRedisAvailable = false;
    }
  });

  afterAll(async () => {
    if (isRedisAvailable && qualityTester) {
      await qualityTester.cleanup();
    }
  });

  describe('Embedding Quality Tests', () => {
    it('should generate semantically accurate embeddings', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const metrics = await qualityTester.testEmbeddingQuality();

      expect(metrics.accuracy).toBeGreaterThan(0.7);
      expect(metrics.averageConfidence).toBeGreaterThan(0.6);
      expect(metrics.responseTime).toBeLessThan(2000);

      logger.info('Embedding quality metrics:', metrics);
    }, 30000);
  });

  describe('Search Accuracy Tests', () => {
    it('should return relevant search results', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const metrics = await qualityTester.testSearchAccuracy();

      expect(metrics.accuracy).toBeGreaterThan(0.6);
      expect(metrics.precision).toBeGreaterThan(0.6);
      expect(metrics.recall).toBeGreaterThan(0.5);
      expect(metrics.responseTime).toBeLessThan(3000);

      logger.info('Search accuracy metrics:', metrics);
    }, 45000);
  });

  describe('Code Analysis Accuracy Tests', () => {
    it('should accurately analyze code quality and complexity', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const metrics = await qualityTester.testCodeAnalysisAccuracy();

      expect(metrics.accuracy).toBeGreaterThan(0.6);
      expect(metrics.averageConfidence).toBeGreaterThan(0.5);
      expect(metrics.responseTime).toBeLessThan(5000);

      logger.info('Code analysis accuracy metrics:', metrics);
    }, 30000);
  });

  describe('Brand Consistency Accuracy Tests', () => {
    it('should accurately assess brand consistency', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const metrics = await qualityTester.testBrandConsistencyAccuracy();

      expect(metrics.accuracy).toBeGreaterThan(0.6);
      expect(metrics.averageConfidence).toBeGreaterThan(0.5);
      expect(metrics.responseTime).toBeLessThan(3000);

      logger.info('Brand consistency accuracy metrics:', metrics);
    }, 25000);
  });

  describe('Personalization Accuracy Tests', () => {
    it('should provide accurate personalized recommendations', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const metrics = await qualityTester.testPersonalizationAccuracy();

      expect(metrics.accuracy).toBeGreaterThan(0.6);
      expect(metrics.averageConfidence).toBeGreaterThan(0.5);
      expect(metrics.responseTime).toBeLessThan(2000);

      logger.info('Personalization accuracy metrics:', metrics);
    }, 35000);
  });

  describe('Overall AI System Quality', () => {
    it('should meet overall quality benchmarks', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Run all quality tests
      const embeddingMetrics = await qualityTester.testEmbeddingQuality();
      const searchMetrics = await qualityTester.testSearchAccuracy();
      const codeMetrics = await qualityTester.testCodeAnalysisAccuracy();
      const brandMetrics = await qualityTester.testBrandConsistencyAccuracy();
      const personalizationMetrics = await qualityTester.testPersonalizationAccuracy();

      // Calculate overall metrics
      const allMetrics = [embeddingMetrics, searchMetrics, codeMetrics, brandMetrics, personalizationMetrics];
      
      const overallAccuracy = allMetrics.reduce((sum, m) => sum + m.accuracy, 0) / allMetrics.length;
      const overallConfidence = allMetrics.reduce((sum, m) => sum + m.averageConfidence, 0) / allMetrics.length;
      const overallResponseTime = allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length;

      expect(overallAccuracy).toBeGreaterThan(0.65);
      expect(overallConfidence).toBeGreaterThan(0.55);
      expect(overallResponseTime).toBeLessThan(3000);

      logger.info('Overall AI system quality metrics:', {
        accuracy: overallAccuracy,
        confidence: overallConfidence,
        responseTime: overallResponseTime,
        componentMetrics: {
          embedding: embeddingMetrics,
          search: searchMetrics,
          codeAnalysis: codeMetrics,
          brandConsistency: brandMetrics,
          personalization: personalizationMetrics,
        },
      });
    }, 120000);
  });
});