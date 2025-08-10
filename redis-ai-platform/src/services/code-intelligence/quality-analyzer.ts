import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { CodeAnalyzer, CodeFile, CodeAnalysisResult, DetectedPattern, PatternCategory, PatternSeverity } from './code-analyzer';

export interface QualityReport {
  id: string;
  projectId: string;
  generatedAt: Date;
  overallScore: number;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  trends: QualityTrend[];
  comparisons: QualityComparison[];
}

export interface QualityMetrics {
  maintainability: QualityMetric;
  reliability: QualityMetric;
  security: QualityMetric;
  performance: QualityMetric;
  testability: QualityMetric;
  readability: QualityMetric;
  complexity: ComplexityMetrics;
  coverage: CoverageMetrics;
  duplication: DuplicationMetrics;
  documentation: DocumentationMetrics;
}

export interface QualityMetric {
  score: number;
  grade: QualityGrade;
  description: string;
  factors: QualityFactor[];
  threshold: QualityThreshold;
}

export enum QualityGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F'
}

export interface QualityFactor {
  name: string;
  value: number;
  weight: number;
  impact: FactorImpact;
}

export enum FactorImpact {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

export interface QualityThreshold {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepth: number;
  functionLength: number;
  classSize: number;
  parameterCount: number;
}

export interface CoverageMetrics {
  linesCovered: number;
  totalLines: number;
  percentage: number;
  branchesCovered: number;
  totalBranches: number;
  branchPercentage: number;
  functionsCovered: number;
  totalFunctions: number;
  functionPercentage: number;
}

export interface DuplicationMetrics {
  duplicatedLines: number;
  totalLines: number;
  percentage: number;
  duplicatedBlocks: number;
  duplicatedFiles: number;
}

export interface DocumentationMetrics {
  documentedFunctions: number;
  totalFunctions: number;
  percentage: number;
  documentedClasses: number;
  totalClasses: number;
  classPercentage: number;
  commentDensity: number;
}

export interface QualityIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  location: IssueLocation;
  rule: string;
  effort: EstimatedEffort;
  debt: TechnicalDebt;
  tags: string[];
}

export enum IssueType {
  BUG = 'bug',
  VULNERABILITY = 'vulnerability',
  CODE_SMELL = 'code_smell',
  SECURITY_HOTSPOT = 'security_hotspot',
  MAINTAINABILITY = 'maintainability',
  RELIABILITY = 'reliability',
  PERFORMANCE = 'performance'
}

export enum IssueSeverity {
  BLOCKER = 'blocker',
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  INFO = 'info'
}

export enum IssueCategory {
  DESIGN = 'design',
  LOGIC = 'logic',
  STYLE = 'style',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing'
}

export interface IssueLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  component?: string;
  method?: string;
}

export interface EstimatedEffort {
  minutes: number;
  hours: number;
  days: number;
  complexity: EffortComplexity;
}

export enum EffortComplexity {
  TRIVIAL = 'trivial',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  COMPLEX = 'complex'
}

export interface TechnicalDebt {
  amount: number;
  unit: DebtUnit;
  ratio: number;
  category: DebtCategory;
}

export enum DebtUnit {
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days'
}

export enum DebtCategory {
  MAINTAINABILITY = 'maintainability',
  RELIABILITY = 'reliability',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

export interface QualityRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  impact: RecommendationImpact;
  effort: EstimatedEffort;
  steps: RecommendationStep[];
  resources: RecommendationResource[];
}

export enum RecommendationType {
  REFACTOR = 'refactor',
  OPTIMIZE = 'optimize',
  SECURE = 'secure',
  TEST = 'test',
  DOCUMENT = 'document',
  UPGRADE = 'upgrade',
  REMOVE = 'remove'
}

export enum RecommendationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface RecommendationImpact {
  qualityImprovement: number;
  maintainabilityGain: number;
  performanceGain: number;
  securityGain: number;
  riskReduction: number;
}

export interface RecommendationStep {
  order: number;
  description: string;
  automated: boolean;
  toolSupport: boolean;
}

export interface RecommendationResource {
  type: ResourceType;
  title: string;
  url?: string;
  description: string;
}

export enum ResourceType {
  DOCUMENTATION = 'documentation',
  TUTORIAL = 'tutorial',
  TOOL = 'tool',
  LIBRARY = 'library',
  BEST_PRACTICE = 'best_practice'
}

export interface QualityTrend {
  metric: string;
  period: TrendPeriod;
  direction: TrendDirection;
  change: number;
  significance: TrendSignificance;
  dataPoints: TrendDataPoint[];
}

export enum TrendPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export enum TrendDirection {
  IMPROVING = 'improving',
  DECLINING = 'declining',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export enum TrendSignificance {
  SIGNIFICANT = 'significant',
  MODERATE = 'moderate',
  MINOR = 'minor',
  NEGLIGIBLE = 'negligible'
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  context?: string;
}

export interface QualityComparison {
  type: ComparisonType;
  baseline: QualityBaseline;
  current: QualitySnapshot;
  delta: QualityDelta;
  insights: ComparisonInsight[];
}

export enum ComparisonType {
  HISTORICAL = 'historical',
  PEER = 'peer',
  INDUSTRY = 'industry',
  TARGET = 'target'
}

export interface QualityBaseline {
  name: string;
  date: Date;
  metrics: QualityMetrics;
  context: string;
}

export interface QualitySnapshot {
  date: Date;
  metrics: QualityMetrics;
}

export interface QualityDelta {
  overall: number;
  maintainability: number;
  reliability: number;
  security: number;
  performance: number;
  testability: number;
  readability: number;
}

export interface ComparisonInsight {
  metric: string;
  observation: string;
  significance: InsightSignificance;
  recommendation?: string;
}

export enum InsightSignificance {
  CRITICAL = 'critical',
  IMPORTANT = 'important',
  NOTABLE = 'notable',
  MINOR = 'minor'
}

export class QualityAnalyzer {
  private redis: Redis;
  private codeAnalyzer: CodeAnalyzer;
  private readonly QUALITY_PREFIX = 'quality';
  private readonly REPORT_PREFIX = 'quality_report';
  private readonly TREND_PREFIX = 'quality_trend';

  constructor(redis: Redis, codeAnalyzer: CodeAnalyzer) {
    this.redis = redis;
    this.codeAnalyzer = codeAnalyzer;
  }

  async analyzeProjectQuality(projectId: string, files: CodeFile[]): Promise<QualityReport> {
    logger.info(`Analyzing quality for project: ${projectId}`);

    // Analyze each file
    const fileAnalyses: CodeAnalysisResult[] = [];
    for (const file of files) {
      const analysis = await this.codeAnalyzer.analyzeCodeFile(file);
      fileAnalyses.push(analysis);
    }

    // Calculate overall metrics
    const metrics = await this.calculateQualityMetrics(fileAnalyses);
    
    // Identify issues
    const issues = await this.identifyQualityIssues(fileAnalyses);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(metrics, issues);
    
    // Calculate trends
    const trends = await this.calculateQualityTrends(projectId, metrics);
    
    // Generate comparisons
    const comparisons = await this.generateQualityComparisons(projectId, metrics);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(metrics);

    const report: QualityReport = {
      id: this.generateReportId(),
      projectId,
      generatedAt: new Date(),
      overallScore,
      metrics,
      issues,
      recommendations,
      trends,
      comparisons
    };

    // Store report
    await this.storeQualityReport(report);

    // Update trends
    await this.updateQualityTrends(projectId, metrics);

    logger.info(`Quality analysis completed for project: ${projectId}`);
    return report;
  }

  async getQualityGate(projectId: string, gateConfig: QualityGateConfig): Promise<QualityGateResult> {
    const report = await this.getLatestQualityReport(projectId);
    if (!report) {
      throw new Error(`No quality report found for project: ${projectId}`);
    }

    const conditions = await this.evaluateQualityConditions(report, gateConfig);
    const passed = conditions.every(c => c.passed);

    return {
      projectId,
      gateName: gateConfig.name,
      passed,
      conditions,
      overallScore: report.overallScore,
      evaluatedAt: new Date()
    };
  }

  async compareQuality(projectId: string, baselineDate: Date, targetDate: Date): Promise<QualityComparison> {
    const baseline = await this.getQualityReportByDate(projectId, baselineDate);
    const target = await this.getQualityReportByDate(projectId, targetDate);

    if (!baseline || !target) {
      throw new Error('Quality reports not found for comparison dates');
    }

    const delta = this.calculateQualityDelta(baseline.metrics, target.metrics);
    const insights = this.generateComparisonInsights(baseline.metrics, target.metrics, delta);

    return {
      type: ComparisonType.HISTORICAL,
      baseline: {
        name: 'Baseline',
        date: baselineDate,
        metrics: baseline.metrics,
        context: 'Historical baseline'
      },
      current: {
        date: targetDate,
        metrics: target.metrics
      },
      delta,
      insights
    };
  }

  private async calculateQualityMetrics(analyses: CodeAnalysisResult[]): Promise<QualityMetrics> {
    // Aggregate metrics from all file analyses
    const totalFiles = analyses.length;
    const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
    const totalComplexity = analyses.reduce((sum, a) => sum + a.metrics.cyclomaticComplexity, 0);
    const totalFunctions = analyses.reduce((sum, a) => sum + a.metrics.functionCount, 0);
    const totalClasses = analyses.reduce((sum, a) => sum + a.metrics.classCount, 0);

    // Calculate maintainability
    const maintainability = this.calculateMaintainabilityMetric(analyses);
    
    // Calculate reliability
    const reliability = this.calculateReliabilityMetric(analyses);
    
    // Calculate security
    const security = this.calculateSecurityMetric(analyses);
    
    // Calculate performance
    const performance = this.calculatePerformanceMetric(analyses);
    
    // Calculate testability
    const testability = this.calculateTestabilityMetric(analyses);
    
    // Calculate readability
    const readability = this.calculateReadabilityMetric(analyses);

    // Calculate complexity metrics
    const complexity: ComplexityMetrics = {
      cyclomaticComplexity: totalComplexity / Math.max(totalFiles, 1),
      cognitiveComplexity: this.calculateCognitiveComplexity(analyses),
      nestingDepth: this.calculateAverageNestingDepth(analyses),
      functionLength: totalLines / Math.max(totalFunctions, 1),
      classSize: totalLines / Math.max(totalClasses, 1),
      parameterCount: this.calculateAverageParameterCount(analyses)
    };

    // Calculate coverage metrics (would integrate with test coverage tools)
    const coverage: CoverageMetrics = {
      linesCovered: 0,
      totalLines,
      percentage: 0,
      branchesCovered: 0,
      totalBranches: 0,
      branchPercentage: 0,
      functionsCovered: 0,
      totalFunctions,
      functionPercentage: 0
    };

    // Calculate duplication metrics
    const duplication: DuplicationMetrics = {
      duplicatedLines: analyses.reduce((sum, a) => sum + a.metrics.duplicateLines, 0),
      totalLines,
      percentage: 0,
      duplicatedBlocks: 0,
      duplicatedFiles: 0
    };
    duplication.percentage = (duplication.duplicatedLines / totalLines) * 100;

    // Calculate documentation metrics
    const documentation: DocumentationMetrics = {
      documentedFunctions: 0,
      totalFunctions,
      percentage: 0,
      documentedClasses: 0,
      totalClasses,
      classPercentage: 0,
      commentDensity: this.calculateCommentDensity(analyses)
    };

    return {
      maintainability,
      reliability,
      security,
      performance,
      testability,
      readability,
      complexity,
      coverage,
      duplication,
      documentation
    };
  }

  private calculateMaintainabilityMetric(analyses: CodeAnalysisResult[]): QualityMetric {
    const scores = analyses.map(a => a.quality.maintainability);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const factors: QualityFactor[] = [
      {
        name: 'Code Complexity',
        value: this.calculateAverageComplexity(analyses),
        weight: 0.3,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Code Duplication',
        value: this.calculateDuplicationRatio(analyses),
        weight: 0.2,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Documentation Coverage',
        value: this.calculateDocumentationCoverage(analyses),
        weight: 0.2,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Code Size',
        value: this.calculateAverageFileSize(analyses),
        weight: 0.15,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Code Smells',
        value: this.calculateCodeSmellDensity(analyses),
        weight: 0.15,
        impact: FactorImpact.NEGATIVE
      }
    ];

    return {
      score: averageScore,
      grade: this.scoreToGrade(averageScore),
      description: 'Measures how easy it is to maintain and modify the code',
      factors,
      threshold: {
        excellent: 0.9,
        good: 0.8,
        acceptable: 0.6,
        poor: 0.4
      }
    };
  }

  private calculateReliabilityMetric(analyses: CodeAnalysisResult[]): QualityMetric {
    const scores = analyses.map(a => a.quality.reliability);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const factors: QualityFactor[] = [
      {
        name: 'Bug Density',
        value: this.calculateBugDensity(analyses),
        weight: 0.4,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Test Coverage',
        value: 0, // Would integrate with test coverage tools
        weight: 0.3,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Error Handling',
        value: this.calculateErrorHandlingCoverage(analyses),
        weight: 0.2,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Code Complexity',
        value: this.calculateAverageComplexity(analyses),
        weight: 0.1,
        impact: FactorImpact.NEGATIVE
      }
    ];

    return {
      score: averageScore,
      grade: this.scoreToGrade(averageScore),
      description: 'Measures the likelihood of code working correctly under various conditions',
      factors,
      threshold: {
        excellent: 0.95,
        good: 0.85,
        acceptable: 0.7,
        poor: 0.5
      }
    };
  }

  private calculateSecurityMetric(analyses: CodeAnalysisResult[]): QualityMetric {
    const scores = analyses.map(a => a.quality.security);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const factors: QualityFactor[] = [
      {
        name: 'Security Vulnerabilities',
        value: this.calculateSecurityVulnerabilityCount(analyses),
        weight: 0.5,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Input Validation',
        value: this.calculateInputValidationCoverage(analyses),
        weight: 0.2,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Authentication Usage',
        value: this.calculateAuthenticationUsage(analyses),
        weight: 0.15,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Encryption Usage',
        value: this.calculateEncryptionUsage(analyses),
        weight: 0.15,
        impact: FactorImpact.POSITIVE
      }
    ];

    return {
      score: averageScore,
      grade: this.scoreToGrade(averageScore),
      description: 'Measures the security posture of the codebase',
      factors,
      threshold: {
        excellent: 0.95,
        good: 0.85,
        acceptable: 0.7,
        poor: 0.5
      }
    };
  }

  private calculatePerformanceMetric(analyses: CodeAnalysisResult[]): QualityMetric {
    const scores = analyses.map(a => a.quality.performance);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const factors: QualityFactor[] = [
      {
        name: 'Algorithmic Complexity',
        value: this.calculateAlgorithmicComplexity(analyses),
        weight: 0.3,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Memory Usage Patterns',
        value: this.calculateMemoryUsagePatterns(analyses),
        weight: 0.25,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'I/O Operations',
        value: this.calculateIOOperationEfficiency(analyses),
        weight: 0.2,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Caching Usage',
        value: this.calculateCachingUsage(analyses),
        weight: 0.15,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Resource Management',
        value: this.calculateResourceManagement(analyses),
        weight: 0.1,
        impact: FactorImpact.POSITIVE
      }
    ];

    return {
      score: averageScore,
      grade: this.scoreToGrade(averageScore),
      description: 'Measures the efficiency and performance characteristics of the code',
      factors,
      threshold: {
        excellent: 0.9,
        good: 0.8,
        acceptable: 0.6,
        poor: 0.4
      }
    };
  }

  private calculateTestabilityMetric(analyses: CodeAnalysisResult[]): QualityMetric {
    const scores = analyses.map(a => a.quality.testability);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const factors: QualityFactor[] = [
      {
        name: 'Cyclomatic Complexity',
        value: this.calculateAverageComplexity(analyses),
        weight: 0.3,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Dependency Coupling',
        value: this.calculateDependencyCoupling(analyses),
        weight: 0.25,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Method Length',
        value: this.calculateAverageMethodLength(analyses),
        weight: 0.2,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Dependency Injection',
        value: this.calculateDependencyInjectionUsage(analyses),
        weight: 0.15,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Pure Functions',
        value: this.calculatePureFunctionRatio(analyses),
        weight: 0.1,
        impact: FactorImpact.POSITIVE
      }
    ];

    return {
      score: averageScore,
      grade: this.scoreToGrade(averageScore),
      description: 'Measures how easy it is to write effective tests for the code',
      factors,
      threshold: {
        excellent: 0.9,
        good: 0.8,
        acceptable: 0.6,
        poor: 0.4
      }
    };
  }

  private calculateReadabilityMetric(analyses: CodeAnalysisResult[]): QualityMetric {
    const scores = analyses.map(a => a.quality.readability);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const factors: QualityFactor[] = [
      {
        name: 'Naming Quality',
        value: this.calculateNamingQuality(analyses),
        weight: 0.3,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Comment Quality',
        value: this.calculateCommentQuality(analyses),
        weight: 0.25,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Code Formatting',
        value: this.calculateFormattingConsistency(analyses),
        weight: 0.2,
        impact: FactorImpact.POSITIVE
      },
      {
        name: 'Function Length',
        value: this.calculateAverageFunctionLength(analyses),
        weight: 0.15,
        impact: FactorImpact.NEGATIVE
      },
      {
        name: 'Nesting Depth',
        value: this.calculateAverageNestingDepth(analyses),
        weight: 0.1,
        impact: FactorImpact.NEGATIVE
      }
    ];

    return {
      score: averageScore,
      grade: this.scoreToGrade(averageScore),
      description: 'Measures how easy it is to read and understand the code',
      factors,
      threshold: {
        excellent: 0.9,
        good: 0.8,
        acceptable: 0.6,
        poor: 0.4
      }
    };
  }

  private async identifyQualityIssues(analyses: CodeAnalysisResult[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    for (const analysis of analyses) {
      // Convert detected patterns to quality issues
      for (const pattern of analysis.patterns) {
        issues.push({
          id: this.generateIssueId(),
          type: this.mapPatternToIssueType(pattern.category),
          severity: this.mapPatternSeverityToIssueSeverity(pattern.severity),
          category: this.mapPatternToIssueCategory(pattern.category),
          title: pattern.name,
          description: pattern.description,
          location: {
            file: pattern.location.file,
            startLine: pattern.location.startLine,
            endLine: pattern.location.endLine,
            startColumn: pattern.location.startColumn,
            endColumn: pattern.location.endColumn
          },
          rule: pattern.patternId,
          effort: this.estimateFixEffort(pattern),
          debt: this.calculateTechnicalDebt(pattern),
          tags: [pattern.category.toLowerCase()]
        });
      }

      // Add metric-based issues
      if (analysis.metrics.cyclomaticComplexity > 20) {
        issues.push({
          id: this.generateIssueId(),
          type: IssueType.CODE_SMELL,
          severity: IssueSeverity.MAJOR,
          category: IssueCategory.DESIGN,
          title: 'High Cyclomatic Complexity',
          description: `File has high cyclomatic complexity (${analysis.metrics.cyclomaticComplexity})`,
          location: {
            file: analysis.fileId,
            startLine: 1,
            endLine: analysis.metrics.linesOfCode,
            startColumn: 0,
            endColumn: 0
          },
          rule: 'complexity-threshold',
          effort: {
            minutes: 120,
            hours: 2,
            days: 0.25,
            complexity: EffortComplexity.MEDIUM
          },
          debt: {
            amount: 2,
            unit: DebtUnit.HOURS,
            ratio: 0.1,
            category: DebtCategory.MAINTAINABILITY
          },
          tags: ['complexity', 'maintainability']
        });
      }
    }

    return issues;
  }

  private async generateRecommendations(metrics: QualityMetrics, issues: QualityIssue[]): Promise<QualityRecommendation[]> {
    const recommendations: QualityRecommendation[] = [];

    // Generate recommendations based on metrics
    if (metrics.maintainability.score < 0.7) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: RecommendationType.REFACTOR,
        priority: RecommendationPriority.HIGH,
        title: 'Improve Code Maintainability',
        description: 'The codebase has low maintainability scores that should be addressed',
        rationale: 'Low maintainability leads to increased development time and higher bug rates',
        impact: {
          qualityImprovement: 0.2,
          maintainabilityGain: 0.3,
          performanceGain: 0.05,
          securityGain: 0.1,
          riskReduction: 0.25
        },
        effort: {
          minutes: 480,
          hours: 8,
          days: 1,
          complexity: EffortComplexity.MEDIUM
        },
        steps: [
          {
            order: 1,
            description: 'Identify and refactor complex methods',
            automated: false,
            toolSupport: true
          },
          {
            order: 2,
            description: 'Extract common functionality into utilities',
            automated: false,
            toolSupport: true
          },
          {
            order: 3,
            description: 'Improve naming conventions',
            automated: true,
            toolSupport: true
          }
        ],
        resources: [
          {
            type: ResourceType.BEST_PRACTICE,
            title: 'Clean Code Principles',
            description: 'Guidelines for writing maintainable code'
          },
          {
            type: ResourceType.TOOL,
            title: 'Code Analysis Tools',
            description: 'Tools to help identify maintainability issues'
          }
        ]
      });
    }

    // Generate recommendations based on issues
    const criticalIssues = issues.filter(i => i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.BLOCKER);
    if (criticalIssues.length > 0) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: RecommendationType.SECURE,
        priority: RecommendationPriority.CRITICAL,
        title: 'Address Critical Issues',
        description: `${criticalIssues.length} critical issues need immediate attention`,
        rationale: 'Critical issues can lead to system failures or security breaches',
        impact: {
          qualityImprovement: 0.3,
          maintainabilityGain: 0.2,
          performanceGain: 0.1,
          securityGain: 0.4,
          riskReduction: 0.5
        },
        effort: {
          minutes: 240,
          hours: 4,
          days: 0.5,
          complexity: EffortComplexity.HARD
        },
        steps: [
          {
            order: 1,
            description: 'Review and prioritize critical issues',
            automated: false,
            toolSupport: true
          },
          {
            order: 2,
            description: 'Fix security vulnerabilities first',
            automated: false,
            toolSupport: false
          },
          {
            order: 3,
            description: 'Address reliability issues',
            automated: false,
            toolSupport: true
          }
        ],
        resources: [
          {
            type: ResourceType.DOCUMENTATION,
            title: 'Security Best Practices',
            description: 'Guidelines for secure coding practices'
          }
        ]
      });
    }

    return recommendations;
  }

  private async calculateQualityTrends(projectId: string, currentMetrics: QualityMetrics): Promise<QualityTrend[]> {
    // Get historical data
    const historicalData = await this.getHistoricalQualityData(projectId, 30); // Last 30 days
    
    const trends: QualityTrend[] = [];

    // Calculate trend for each metric
    const metricNames = ['maintainability', 'reliability', 'security', 'performance', 'testability', 'readability'];
    
    for (const metricName of metricNames) {
      const dataPoints = historicalData.map(data => ({
        date: data.date,
        value: (data.metrics as any)[metricName].score,
        context: 'Daily measurement'
      }));

      if (dataPoints.length > 1) {
        const trend = this.calculateTrendDirection(dataPoints);
        trends.push({
          metric: metricName,
          period: TrendPeriod.DAILY,
          direction: trend.direction,
          change: trend.change,
          significance: trend.significance,
          dataPoints
        });
      }
    }

    return trends;
  }

  private async generateQualityComparisons(projectId: string, currentMetrics: QualityMetrics): Promise<QualityComparison[]> {
    const comparisons: QualityComparison[] = [];

    // Historical comparison (30 days ago)
    const historicalBaseline = await this.getQualityReportByDate(projectId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    if (historicalBaseline) {
      const delta = this.calculateQualityDelta(historicalBaseline.metrics, currentMetrics);
      const insights = this.generateComparisonInsights(historicalBaseline.metrics, currentMetrics, delta);

      comparisons.push({
        type: ComparisonType.HISTORICAL,
        baseline: {
          name: '30 Days Ago',
          date: historicalBaseline.generatedAt,
          metrics: historicalBaseline.metrics,
          context: 'Historical baseline from 30 days ago'
        },
        current: {
          date: new Date(),
          metrics: currentMetrics
        },
        delta,
        insights
      });
    }

    return comparisons;
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      maintainability: 0.25,
      reliability: 0.2,
      security: 0.2,
      performance: 0.15,
      testability: 0.1,
      readability: 0.1
    };

    return (
      metrics.maintainability.score * weights.maintainability +
      metrics.reliability.score * weights.reliability +
      metrics.security.score * weights.security +
      metrics.performance.score * weights.performance +
      metrics.testability.score * weights.testability +
      metrics.readability.score * weights.readability
    );
  }

  private scoreToGrade(score: number): QualityGrade {
    if (score >= 0.9) return QualityGrade.A;
    if (score >= 0.8) return QualityGrade.B;
    if (score >= 0.6) return QualityGrade.C;
    if (score >= 0.4) return QualityGrade.D;
    return QualityGrade.F;
  }

  // Helper methods for metric calculations
  private calculateAverageComplexity(analyses: CodeAnalysisResult[]): number {
    const totalComplexity = analyses.reduce((sum, a) => sum + a.metrics.cyclomaticComplexity, 0);
    return totalComplexity / Math.max(analyses.length, 1);
  }

  private calculateDuplicationRatio(analyses: CodeAnalysisResult[]): number {
    const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
    const duplicateLines = analyses.reduce((sum, a) => sum + a.metrics.duplicateLines, 0);
    return duplicateLines / Math.max(totalLines, 1);
  }

  private calculateDocumentationCoverage(analyses: CodeAnalysisResult[]): number {
    // Simplified calculation - would need more sophisticated analysis
    return 0.5;
  }

  private calculateAverageFileSize(analyses: CodeAnalysisResult[]): number {
    const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
    return totalLines / Math.max(analyses.length, 1);
  }

  private calculateCodeSmellDensity(analyses: CodeAnalysisResult[]): number {
    const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
    const codeSmells = analyses.reduce((sum, a) => 
      sum + a.patterns.filter(p => p.category === PatternCategory.CODE_SMELL).length, 0);
    return codeSmells / Math.max(totalLines / 1000, 1); // Per 1000 lines
  }

  // Additional helper methods would be implemented here...
  private calculateBugDensity(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateErrorHandlingCoverage(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateSecurityVulnerabilityCount(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateInputValidationCoverage(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateAuthenticationUsage(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateEncryptionUsage(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateAlgorithmicComplexity(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateMemoryUsagePatterns(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateIOOperationEfficiency(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateCachingUsage(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateResourceManagement(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateDependencyCoupling(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateAverageMethodLength(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateDependencyInjectionUsage(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculatePureFunctionRatio(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateNamingQuality(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateCommentQuality(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateFormattingConsistency(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateAverageFunctionLength(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateAverageNestingDepth(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateCognitiveComplexity(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateAverageParameterCount(analyses: CodeAnalysisResult[]): number { return 0; }
  private calculateCommentDensity(analyses: CodeAnalysisResult[]): number { return 0; }

  private mapPatternToIssueType(category: PatternCategory): IssueType {
    switch (category) {
      case PatternCategory.SECURITY: return IssueType.VULNERABILITY;
      case PatternCategory.CODE_SMELL: return IssueType.CODE_SMELL;
      case PatternCategory.PERFORMANCE: return IssueType.PERFORMANCE;
      case PatternCategory.ANTI_PATTERN: return IssueType.MAINTAINABILITY;
      default: return IssueType.CODE_SMELL;
    }
  }

  private mapPatternSeverityToIssueSeverity(severity: PatternSeverity): IssueSeverity {
    switch (severity) {
      case PatternSeverity.CRITICAL: return IssueSeverity.CRITICAL;
      case PatternSeverity.ERROR: return IssueSeverity.MAJOR;
      case PatternSeverity.WARNING: return IssueSeverity.MINOR;
      case PatternSeverity.INFO: return IssueSeverity.INFO;
      default: return IssueSeverity.MINOR;
    }
  }

  private mapPatternToIssueCategory(category: PatternCategory): IssueCategory {
    switch (category) {
      case PatternCategory.SECURITY: return IssueCategory.SECURITY;
      case PatternCategory.PERFORMANCE: return IssueCategory.PERFORMANCE;
      case PatternCategory.DESIGN_PATTERN: return IssueCategory.DESIGN;
      case PatternCategory.CODE_SMELL: return IssueCategory.STYLE;
      default: return IssueCategory.DESIGN;
    }
  }

  private estimateFixEffort(pattern: DetectedPattern): EstimatedEffort {
    let minutes = 30; // Base effort
    
    switch (pattern.severity) {
      case PatternSeverity.CRITICAL:
        minutes = 120;
        break;
      case PatternSeverity.ERROR:
        minutes = 60;
        break;
      case PatternSeverity.WARNING:
        minutes = 30;
        break;
      case PatternSeverity.INFO:
        minutes = 15;
        break;
    }

    return {
      minutes,
      hours: minutes / 60,
      days: minutes / (60 * 8),
      complexity: minutes > 60 ? EffortComplexity.MEDIUM : EffortComplexity.EASY
    };
  }

  private calculateTechnicalDebt(pattern: DetectedPattern): TechnicalDebt {
    const effort = this.estimateFixEffort(pattern);
    
    return {
      amount: effort.minutes,
      unit: DebtUnit.MINUTES,
      ratio: 0.1, // 10% of development time
      category: this.mapPatternToDebtCategory(pattern.category)
    };
  }

  private mapPatternToDebtCategory(category: PatternCategory): DebtCategory {
    switch (category) {
      case PatternCategory.SECURITY: return DebtCategory.SECURITY;
      case PatternCategory.PERFORMANCE: return DebtCategory.PERFORMANCE;
      case PatternCategory.CODE_SMELL: return DebtCategory.MAINTAINABILITY;
      default: return DebtCategory.MAINTAINABILITY;
    }
  }

  private calculateTrendDirection(dataPoints: TrendDataPoint[]): { direction: TrendDirection; change: number; significance: TrendSignificance } {
    if (dataPoints.length < 2) {
      return { direction: TrendDirection.STABLE, change: 0, significance: TrendSignificance.NEGLIGIBLE };
    }

    const first = dataPoints[0].value;
    const last = dataPoints[dataPoints.length - 1].value;
    const change = last - first;
    const changePercent = Math.abs(change / first) * 100;

    let direction: TrendDirection;
    if (Math.abs(change) < 0.01) {
      direction = TrendDirection.STABLE;
    } else if (change > 0) {
      direction = TrendDirection.IMPROVING;
    } else {
      direction = TrendDirection.DECLINING;
    }

    let significance: TrendSignificance;
    if (changePercent > 20) {
      significance = TrendSignificance.SIGNIFICANT;
    } else if (changePercent > 10) {
      significance = TrendSignificance.MODERATE;
    } else if (changePercent > 5) {
      significance = TrendSignificance.MINOR;
    } else {
      significance = TrendSignificance.NEGLIGIBLE;
    }

    return { direction, change, significance };
  }

  private calculateQualityDelta(baseline: QualityMetrics, current: QualityMetrics): QualityDelta {
    return {
      overall: this.calculateOverallScore(current) - this.calculateOverallScore(baseline),
      maintainability: current.maintainability.score - baseline.maintainability.score,
      reliability: current.reliability.score - baseline.reliability.score,
      security: current.security.score - baseline.security.score,
      performance: current.performance.score - baseline.performance.score,
      testability: current.testability.score - baseline.testability.score,
      readability: current.readability.score - baseline.readability.score
    };
  }

  private generateComparisonInsights(baseline: QualityMetrics, current: QualityMetrics, delta: QualityDelta): ComparisonInsight[] {
    const insights: ComparisonInsight[] = [];

    if (Math.abs(delta.maintainability) > 0.1) {
      insights.push({
        metric: 'maintainability',
        observation: `Maintainability ${delta.maintainability > 0 ? 'improved' : 'declined'} by ${Math.abs(delta.maintainability * 100).toFixed(1)}%`,
        significance: Math.abs(delta.maintainability) > 0.2 ? InsightSignificance.CRITICAL : InsightSignificance.IMPORTANT,
        recommendation: delta.maintainability < 0 ? 'Focus on reducing code complexity and improving documentation' : undefined
      });
    }

    if (Math.abs(delta.security) > 0.1) {
      insights.push({
        metric: 'security',
        observation: `Security score ${delta.security > 0 ? 'improved' : 'declined'} by ${Math.abs(delta.security * 100).toFixed(1)}%`,
        significance: InsightSignificance.CRITICAL,
        recommendation: delta.security < 0 ? 'Address security vulnerabilities immediately' : undefined
      });
    }

    return insights;
  }

  // Storage and retrieval methods
  private async storeQualityReport(report: QualityReport): Promise<void> {
    const key = `${this.REPORT_PREFIX}:${report.projectId}:${report.id}`;
    await this.redis.hset(key,
      'data', JSON.stringify(report),
      'timestamp', report.generatedAt.toISOString()
    );

    // Store latest report reference
    await this.redis.set(`${this.REPORT_PREFIX}:${report.projectId}:latest`, report.id);
  }

  private async getLatestQualityReport(projectId: string): Promise<QualityReport | null> {
    const latestId = await this.redis.get(`${this.REPORT_PREFIX}:${projectId}:latest`);
    if (!latestId) return null;

    const data = await this.redis.hget(`${this.REPORT_PREFIX}:${projectId}:${latestId}`, 'data');
    return data ? JSON.parse(data) : null;
  }

  private async getQualityReportByDate(projectId: string, date: Date): Promise<QualityReport | null> {
    // Simplified - would need more sophisticated date-based lookup
    return this.getLatestQualityReport(projectId);
  }

  private async getHistoricalQualityData(projectId: string, days: number): Promise<{ date: Date; metrics: QualityMetrics }[]> {
    // Simplified - would query historical data from Redis
    return [];
  }

  private async updateQualityTrends(projectId: string, metrics: QualityMetrics): Promise<void> {
    const trendKey = `${this.TREND_PREFIX}:${projectId}`;
    const timestamp = Date.now();
    
    // Store trend data points
    await this.redis.zadd(trendKey, timestamp, JSON.stringify({
      timestamp,
      metrics
    }));

    // Keep only last 90 days
    const cutoff = timestamp - (90 * 24 * 60 * 60 * 1000);
    await this.redis.zremrangebyscore(trendKey, 0, cutoff);
  }

  private async evaluateQualityConditions(report: QualityReport, gateConfig: QualityGateConfig): Promise<QualityCondition[]> {
    // Simplified quality gate evaluation
    return [];
  }

  // ID generation methods
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIssueId(): string {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Additional interfaces for quality gates
export interface QualityGateConfig {
  name: string;
  conditions: QualityGateCondition[];
}

export interface QualityGateCondition {
  metric: string;
  operator: ConditionOperator;
  threshold: number;
  errorThreshold?: number;
}

export enum ConditionOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUALS = 'eq',
  NOT_EQUALS = 'ne'
}

export interface QualityGateResult {
  projectId: string;
  gateName: string;
  passed: boolean;
  conditions: QualityCondition[];
  overallScore: number;
  evaluatedAt: Date;
}

export interface QualityCondition {
  metric: string;
  operator: ConditionOperator;
  threshold: number;
  actualValue: number;
  passed: boolean;
  message: string;
}