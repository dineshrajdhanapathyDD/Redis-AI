import { Redis } from 'ioredis';
export interface ContentPerformance {
    contentId: string;
    platformId: string;
    metrics: PerformanceMetrics;
    engagement: EngagementMetrics;
    reach: ReachMetrics;
    conversion: ConversionMetrics;
    brandImpact: BrandImpactMetrics;
    timestamp: Date;
}
export interface PerformanceMetrics {
    views: number;
    impressions: number;
    clicks: number;
    shares: number;
    saves: number;
    comments: number;
    likes: number;
    reactions: ReactionBreakdown;
    timeSpent: number;
    bounceRate: number;
    completionRate: number;
}
export interface ReactionBreakdown {
    like: number;
    love: number;
    laugh: number;
    wow: number;
    sad: number;
    angry: number;
    care: number;
}
export interface EngagementMetrics {
    engagementRate: number;
    engagementQuality: EngagementQuality;
    audienceGrowth: number;
    repeatEngagement: number;
    shareQuality: ShareQuality;
    commentSentiment: SentimentAnalysis;
    viralityScore: number;
}
export interface EngagementQuality {
    score: number;
    factors: QualityFactor[];
    breakdown: QualityBreakdown;
}
export interface QualityFactor {
    factor: string;
    weight: number;
    score: number;
    description: string;
}
export interface QualityBreakdown {
    meaningfulInteractions: number;
    superficialInteractions: number;
    negativeInteractions: number;
    spamInteractions: number;
}
export interface ShareQuality {
    organicShares: number;
    incentivizedShares: number;
    shareContext: ShareContext[];
    shareAudience: ShareAudience;
}
export interface ShareContext {
    platform: string;
    context: string;
    frequency: number;
    sentiment: string;
}
export interface ShareAudience {
    internal: number;
    external: number;
    crossPlatform: CrossPlatformShare[];
}
export interface CrossPlatformShare {
    fromPlatform: string;
    toPlatform: string;
    count: number;
    context: string;
}
export interface SentimentAnalysis {
    overall: SentimentScore;
    breakdown: SentimentBreakdown;
    trends: SentimentTrend[];
    keyTopics: TopicSentiment[];
}
export interface SentimentScore {
    score: number;
    confidence: number;
    distribution: SentimentDistribution;
}
export interface SentimentDistribution {
    positive: number;
    neutral: number;
    negative: number;
}
export interface SentimentBreakdown {
    comments: SentimentScore;
    reactions: SentimentScore;
    shares: SentimentScore;
    mentions: SentimentScore;
}
export interface SentimentTrend {
    timeframe: string;
    sentiment: SentimentScore;
    volume: number;
    triggers: string[];
}
export interface TopicSentiment {
    topic: string;
    sentiment: SentimentScore;
    volume: number;
    keywords: string[];
}
export interface ReachMetrics {
    totalReach: number;
    organicReach: number;
    paidReach: number;
    viralReach: number;
    audienceBreakdown: AudienceBreakdown;
    geographicReach: GeographicReach;
    demographicReach: DemographicReach;
    deviceReach: DeviceReach;
}
export interface AudienceBreakdown {
    newAudience: number;
    returningAudience: number;
    targetAudience: number;
    spilloverAudience: number;
    audienceQuality: AudienceQuality;
}
export interface AudienceQuality {
    score: number;
    relevanceScore: number;
    engagementPotential: number;
    conversionPotential: number;
    brandAffinity: number;
}
export interface GeographicReach {
    countries: CountryReach[];
    regions: RegionReach[];
    cities: CityReach[];
    timeZones: TimeZoneReach[];
}
export interface CountryReach {
    country: string;
    reach: number;
    percentage: number;
    engagement: number;
}
export interface RegionReach {
    region: string;
    reach: number;
    percentage: number;
    characteristics: string[];
}
export interface CityReach {
    city: string;
    country: string;
    reach: number;
    percentage: number;
    urbanType: string;
}
export interface TimeZoneReach {
    timezone: string;
    reach: number;
    peakHours: string[];
    engagement: number;
}
export interface DemographicReach {
    age: AgeReach[];
    gender: GenderReach[];
    interests: InterestReach[];
    behaviors: BehaviorReach[];
}
export interface AgeReach {
    ageGroup: string;
    reach: number;
    percentage: number;
    engagement: number;
}
export interface GenderReach {
    gender: string;
    reach: number;
    percentage: number;
    engagement: number;
}
export interface InterestReach {
    interest: string;
    reach: number;
    relevance: number;
    engagement: number;
}
export interface BehaviorReach {
    behavior: string;
    reach: number;
    frequency: number;
    value: number;
}
export interface DeviceReach {
    mobile: DeviceMetrics;
    desktop: DeviceMetrics;
    tablet: DeviceMetrics;
    other: DeviceMetrics;
}
export interface DeviceMetrics {
    reach: number;
    percentage: number;
    engagement: number;
    performance: DevicePerformance;
}
export interface DevicePerformance {
    loadTime: number;
    interactionRate: number;
    completionRate: number;
    errorRate: number;
}
interface ConversionMetrics {
    totalConversions: number;
    conversionRate: number;
    conversionValue: number;
    conversionFunnel: FunnelStage[];
    attributionModel: AttributionData;
    conversionTypes: ConversionType[];
    customerJourney: JourneyStage[];
}
export interface FunnelStage {
    stage: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
    averageTime: number;
    barriers: string[];
}
export interface AttributionData {
    firstTouch: AttributionMetric;
    lastTouch: AttributionMetric;
    linear: AttributionMetric;
    timeDecay: AttributionMetric;
    positionBased: AttributionMetric;
}
export interface AttributionMetric {
    conversions: number;
    value: number;
    percentage: number;
}
export interface ConversionType {
    type: string;
    count: number;
    value: number;
    averageValue: number;
    timeToConversion: number;
}
export interface JourneyStage {
    stage: string;
    touchpoints: Touchpoint[];
    duration: number;
    conversionRate: number;
    influence: number;
}
export interface Touchpoint {
    platform: string;
    content: string;
    timestamp: Date;
    engagement: number;
    influence: number;
}
export interface BrandImpactMetrics {
    brandAwareness: BrandAwarenessMetrics;
    brandSentiment: BrandSentimentMetrics;
    brandAssociation: BrandAssociationMetrics;
    brandLoyalty: BrandLoyaltyMetrics;
    brandEquity: BrandEquityMetrics;
}
export interface BrandAwarenessMetrics {
    aided: number;
    unaided: number;
    topOfMind: number;
    brandRecall: number;
    brandRecognition: number;
    shareOfVoice: number;
}
export interface BrandSentimentMetrics {
    overall: SentimentScore;
    attributes: AttributeSentiment[];
    competitors: CompetitorSentiment[];
    trends: SentimentTrend[];
}
export interface AttributeSentiment {
    attribute: string;
    sentiment: SentimentScore;
    importance: number;
    performance: number;
}
export interface CompetitorSentiment {
    competitor: string;
    sentiment: SentimentScore;
    comparison: number;
    gapAnalysis: string[];
}
export interface BrandAssociationMetrics {
    primaryAssociations: Association[];
    secondaryAssociations: Association[];
    negativeAssociations: Association[];
    associationStrength: number;
    associationUniqueness: number;
}
export interface Association {
    concept: string;
    strength: number;
    valence: number;
    uniqueness: number;
    relevance: number;
}
export interface BrandLoyaltyMetrics {
    customerRetention: number;
    repeatPurchase: number;
    advocacy: AdvocacyMetrics;
    switchingCost: number;
    emotionalConnection: number;
}
export interface AdvocacyMetrics {
    netPromoterScore: number;
    referralRate: number;
    wordOfMouth: number;
    userGeneratedContent: number;
    testimonials: number;
}
export interface BrandEquityMetrics {
    financialValue: number;
    marketShare: number;
    premiumPricing: number;
    brandStrength: BrandStrengthMetrics;
    brandRelevance: number;
}
export interface BrandStrengthMetrics {
    differentiation: number;
    relevance: number;
    esteem: number;
    knowledge: number;
    overall: number;
}
export interface PerformanceInsight {
    id: string;
    contentId: string;
    type: InsightType;
    category: InsightCategory;
    title: string;
    description: string;
    impact: ImpactLevel;
    confidence: number;
    recommendations: string[];
    dataPoints: DataPoint[];
    trends: TrendData[];
}
export declare enum InsightType {
    PERFORMANCE = "performance",
    AUDIENCE = "audience",
    CONTENT = "content",
    TIMING = "timing",
    PLATFORM = "platform",
    COMPETITIVE = "competitive"
}
export declare enum InsightCategory {
    OPPORTUNITY = "opportunity",
    RISK = "risk",
    TREND = "trend",
    ANOMALY = "anomaly",
    BENCHMARK = "benchmark"
}
export declare enum ImpactLevel {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface DataPoint {
    metric: string;
    value: number;
    benchmark: number;
    variance: number;
    significance: number;
}
export interface TrendData {
    metric: string;
    direction: TrendDirection;
    magnitude: number;
    duration: string;
    prediction: TrendPrediction;
}
export declare enum TrendDirection {
    INCREASING = "increasing",
    DECREASING = "decreasing",
    STABLE = "stable",
    VOLATILE = "volatile"
}
export interface TrendPrediction {
    nextPeriod: number;
    confidence: number;
    factors: string[];
}
export interface PerformanceReport {
    id: string;
    contentIds: string[];
    timeframe: TimeFrame;
    summary: PerformanceSummary;
    insights: PerformanceInsight[];
    recommendations: PerformanceRecommendation[];
    benchmarks: BenchmarkComparison[];
    generatedAt: Date;
}
export interface TimeFrame {
    start: Date;
    end: Date;
    period: string;
    timezone: string;
}
export interface PerformanceSummary {
    totalContent: number;
    totalEngagement: number;
    totalReach: number;
    totalConversions: number;
    averagePerformance: number;
    topPerformers: TopPerformer[];
    underperformers: Underperformer[];
}
export interface TopPerformer {
    contentId: string;
    metric: string;
    value: number;
    improvement: number;
    factors: string[];
}
export interface Underperformer {
    contentId: string;
    metric: string;
    value: number;
    decline: number;
    issues: string[];
}
export interface PerformanceRecommendation {
    id: string;
    type: RecommendationType;
    priority: Priority;
    title: string;
    description: string;
    implementation: string;
    expectedImpact: ExpectedImpact;
    resources: string[];
}
export declare enum RecommendationType {
    CONTENT_OPTIMIZATION = "content_optimization",
    TIMING_ADJUSTMENT = "timing_adjustment",
    AUDIENCE_TARGETING = "audience_targeting",
    PLATFORM_STRATEGY = "platform_strategy",
    CREATIVE_VARIATION = "creative_variation"
}
export declare enum Priority {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface ExpectedImpact {
    metric: string;
    improvement: number;
    confidence: number;
    timeframe: string;
}
export interface BenchmarkComparison {
    metric: string;
    current: number;
    industry: number;
    competitors: CompetitorBenchmark[];
    historical: HistoricalBenchmark[];
}
export interface CompetitorBenchmark {
    competitor: string;
    value: number;
    comparison: number;
    context: string;
}
export interface HistoricalBenchmark {
    period: string;
    value: number;
    change: number;
    context: string;
}
export declare class PerformanceTracker {
    private redis;
    private readonly PERFORMANCE_PREFIX;
    private readonly INSIGHT_PREFIX;
    private readonly REPORT_PREFIX;
    constructor(redis: Redis);
    trackPerformance(performance: ContentPerformance): Promise<void>;
    getPerformance(contentId: string, platformId: string): Promise<ContentPerformance | null>;
    getPerformanceHistory(contentId: string, platformId: string, timeframe: TimeFrame): Promise<ContentPerformance[]>;
    generateInsights(contentIds: string[], timeframe: TimeFrame): Promise<PerformanceInsight[]>;
    generatePerformanceReport(contentIds: string[], timeframe: TimeFrame): Promise<PerformanceReport>;
    trackBrandImpact(contentId: string, brandImpact: BrandImpactMetrics): Promise<void>;
    getBrandImpactTrends(contentIds: string[], timeframe: TimeFrame): Promise<BrandImpactTrend[]>;
    private analyzePerformanceTrends;
    private analyzeAudiencePatterns;
    private analyzeTimingPatterns;
    private calculateTrend;
    private categorizeImpact;
    private generateEngagementRecommendations;
    private generatePerformanceSummary;
    private generateRecommendations;
    private generateBenchmarkComparisons;
    private analyzeBrandImpactTrend;
    private storeInsight;
    private storeReport;
    private generateInsightId;
    private generateReportId;
}
export interface BrandImpactTrend {
    contentId: string;
    metric: string;
    trend: TrendData;
    significance: number;
    factors: string[];
}
export {};
//# sourceMappingURL=performance-tracker.d.ts.map