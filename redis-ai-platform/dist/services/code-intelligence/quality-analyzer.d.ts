import { Redis } from 'ioredis';
import { CodeAnalyzer, CodeFile } from './code-analyzer';
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
export declare enum QualityGrade {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    F = "F"
}
export interface QualityFactor {
    name: string;
    value: number;
    weight: number;
    impact: FactorImpact;
}
export declare enum FactorImpact {
    POSITIVE = "positive",
    NEGATIVE = "negative",
    NEUTRAL = "neutral"
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
export declare enum IssueType {
    BUG = "bug",
    VULNERABILITY = "vulnerability",
    CODE_SMELL = "code_smell",
    SECURITY_HOTSPOT = "security_hotspot",
    MAINTAINABILITY = "maintainability",
    RELIABILITY = "reliability",
    PERFORMANCE = "performance"
}
export declare enum IssueSeverity {
    BLOCKER = "blocker",
    CRITICAL = "critical",
    MAJOR = "major",
    MINOR = "minor",
    INFO = "info"
}
export declare enum IssueCategory {
    DESIGN = "design",
    LOGIC = "logic",
    STYLE = "style",
    SECURITY = "security",
    PERFORMANCE = "performance",
    DOCUMENTATION = "documentation",
    TESTING = "testing"
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
export declare enum EffortComplexity {
    TRIVIAL = "trivial",
    EASY = "easy",
    MEDIUM = "medium",
    HARD = "hard",
    COMPLEX = "complex"
}
export interface TechnicalDebt {
    amount: number;
    unit: DebtUnit;
    ratio: number;
    category: DebtCategory;
}
export declare enum DebtUnit {
    MINUTES = "minutes",
    HOURS = "hours",
    DAYS = "days"
}
export declare enum DebtCategory {
    MAINTAINABILITY = "maintainability",
    RELIABILITY = "reliability",
    SECURITY = "security",
    PERFORMANCE = "performance"
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
export declare enum RecommendationType {
    REFACTOR = "refactor",
    OPTIMIZE = "optimize",
    SECURE = "secure",
    TEST = "test",
    DOCUMENT = "document",
    UPGRADE = "upgrade",
    REMOVE = "remove"
}
export declare enum RecommendationPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
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
export declare enum ResourceType {
    DOCUMENTATION = "documentation",
    TUTORIAL = "tutorial",
    TOOL = "tool",
    LIBRARY = "library",
    BEST_PRACTICE = "best_practice"
}
export interface QualityTrend {
    metric: string;
    period: TrendPeriod;
    direction: TrendDirection;
    change: number;
    significance: TrendSignificance;
    dataPoints: TrendDataPoint[];
}
export declare enum TrendPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly"
}
export declare enum TrendDirection {
    IMPROVING = "improving",
    DECLINING = "declining",
    STABLE = "stable",
    VOLATILE = "volatile"
}
export declare enum TrendSignificance {
    SIGNIFICANT = "significant",
    MODERATE = "moderate",
    MINOR = "minor",
    NEGLIGIBLE = "negligible"
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
export declare enum ComparisonType {
    HISTORICAL = "historical",
    PEER = "peer",
    INDUSTRY = "industry",
    TARGET = "target"
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
export declare enum InsightSignificance {
    CRITICAL = "critical",
    IMPORTANT = "important",
    NOTABLE = "notable",
    MINOR = "minor"
}
export declare class QualityAnalyzer {
    private redis;
    private codeAnalyzer;
    private readonly QUALITY_PREFIX;
    private readonly REPORT_PREFIX;
    private readonly TREND_PREFIX;
    constructor(redis: Redis, codeAnalyzer: CodeAnalyzer);
    analyzeProjectQuality(projectId: string, files: CodeFile[]): Promise<QualityReport>;
    getQualityGate(projectId: string, gateConfig: QualityGateConfig): Promise<QualityGateResult>;
    compareQuality(projectId: string, baselineDate: Date, targetDate: Date): Promise<QualityComparison>;
    private calculateQualityMetrics;
    private calculateMaintainabilityMetric;
    private calculateReliabilityMetric;
    private calculateSecurityMetric;
    private calculatePerformanceMetric;
    private calculateTestabilityMetric;
    private calculateReadabilityMetric;
    private identifyQualityIssues;
    private generateRecommendations;
    private calculateQualityTrends;
    private generateQualityComparisons;
    private calculateOverallScore;
    private scoreToGrade;
    private calculateAverageComplexity;
    private calculateDuplicationRatio;
    private calculateDocumentationCoverage;
    private calculateAverageFileSize;
    private calculateCodeSmellDensity;
    private calculateBugDensity;
    private calculateErrorHandlingCoverage;
    private calculateSecurityVulnerabilityCount;
    private calculateInputValidationCoverage;
    private calculateAuthenticationUsage;
    private calculateEncryptionUsage;
    private calculateAlgorithmicComplexity;
    private calculateMemoryUsagePatterns;
    private calculateIOOperationEfficiency;
    private calculateCachingUsage;
    private calculateResourceManagement;
    private calculateDependencyCoupling;
    private calculateAverageMethodLength;
    private calculateDependencyInjectionUsage;
    private calculatePureFunctionRatio;
    private calculateNamingQuality;
    private calculateCommentQuality;
    private calculateFormattingConsistency;
    private calculateAverageFunctionLength;
    private calculateAverageNestingDepth;
    private calculateCognitiveComplexity;
    private calculateAverageParameterCount;
    private calculateCommentDensity;
    private mapPatternToIssueType;
    private mapPatternSeverityToIssueSeverity;
    private mapPatternToIssueCategory;
    private estimateFixEffort;
    private calculateTechnicalDebt;
    private mapPatternToDebtCategory;
    private calculateTrendDirection;
    private calculateQualityDelta;
    private generateComparisonInsights;
    private storeQualityReport;
    private getLatestQualityReport;
    private getQualityReportByDate;
    private getHistoricalQualityData;
    private updateQualityTrends;
    private evaluateQualityConditions;
    private generateReportId;
    private generateIssueId;
    private generateRecommendationId;
}
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
export declare enum ConditionOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    EQUALS = "eq",
    NOT_EQUALS = "ne"
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
//# sourceMappingURL=quality-analyzer.d.ts.map