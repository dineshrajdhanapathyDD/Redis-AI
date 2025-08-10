import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { BrandProfile, ContentItem } from './brand-analyzer';
export interface Platform {
    id: string;
    name: string;
    type: PlatformType;
    characteristics: PlatformCharacteristics;
    constraints: PlatformConstraints;
    audience: PlatformAudience;
    contentFormats: ContentFormat[];
    bestPractices: BestPractice[];
}
export declare enum PlatformType {
    SOCIAL_MEDIA = "social_media",
    EMAIL = "email",
    WEBSITE = "website",
    BLOG = "blog",
    ADVERTISING = "advertising",
    PRINT = "print",
    VIDEO = "video",
    PODCAST = "podcast"
}
export interface PlatformCharacteristics {
    communicationStyle: CommunicationStyle;
    contentPace: ContentPace;
    interactionLevel: InteractionLevel;
    visualImportance: VisualImportance;
    attentionSpan: AttentionSpan;
    contentLifespan: ContentLifespan;
}
export declare enum CommunicationStyle {
    FORMAL = "formal",
    CASUAL = "casual",
    CONVERSATIONAL = "conversational",
    PROFESSIONAL = "professional",
    PLAYFUL = "playful"
}
export declare enum ContentPace {
    FAST = "fast",
    MEDIUM = "medium",
    SLOW = "slow"
}
export declare enum InteractionLevel {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum VisualImportance {
    CRITICAL = "critical",
    IMPORTANT = "important",
    MODERATE = "moderate",
    MINIMAL = "minimal"
}
export declare enum AttentionSpan {
    VERY_SHORT = "very_short",// < 3 seconds
    SHORT = "short",// 3-15 seconds
    MEDIUM = "medium",// 15-60 seconds
    LONG = "long",// 1-5 minutes
    EXTENDED = "extended"
}
export declare enum ContentLifespan {
    EPHEMERAL = "ephemeral",// < 24 hours
    SHORT = "short",// 1-7 days
    MEDIUM = "medium",// 1-4 weeks
    LONG = "long",// 1-6 months
    EVERGREEN = "evergreen"
}
export interface PlatformConstraints {
    textLimits: TextLimits;
    imageLimits: ImageLimits;
    videoLimits?: VideoLimits;
    audioLimits?: AudioLimits;
    linkLimits?: LinkLimits;
    hashtagLimits?: HashtagLimits;
}
export interface TextLimits {
    maxCharacters?: number;
    maxWords?: number;
    maxLines?: number;
    allowedFormatting: string[];
    prohibitedContent: string[];
}
export interface ImageLimits {
    maxWidth: number;
    maxHeight: number;
    maxFileSize: number;
    allowedFormats: string[];
    aspectRatios: string[];
    minResolution: Resolution;
}
export interface Resolution {
    width: number;
    height: number;
}
export interface VideoLimits {
    maxDuration: number;
    maxFileSize: number;
    allowedFormats: string[];
    aspectRatios: string[];
    minResolution: Resolution;
    maxResolution: Resolution;
}
export interface AudioLimits {
    maxDuration: number;
    maxFileSize: number;
    allowedFormats: string[];
    sampleRates: number[];
    bitRates: number[];
}
export interface LinkLimits {
    maxLinks: number;
    allowedDomains?: string[];
    prohibitedDomains?: string[];
    requireShortening: boolean;
}
export interface HashtagLimits {
    maxHashtags: number;
    maxLength: number;
    allowedCharacters: string;
    caseSensitive: boolean;
}
interface PlatformAudience {
    demographics: Demographics;
    behavior: AudienceBehavior;
    preferences: AudiencePreferences;
    engagement: EngagementPatterns;
}
export interface Demographics {
    primaryAgeRange: string;
    secondaryAgeRanges: string[];
    genderDistribution: GenderDistribution;
    geographicDistribution: GeographicDistribution;
    deviceUsage: DeviceUsage;
}
export interface GenderDistribution {
    male: number;
    female: number;
    other: number;
}
export interface GeographicDistribution {
    regions: RegionData[];
    urbanRural: UrbanRuralSplit;
    timeZones: string[];
}
export interface RegionData {
    region: string;
    percentage: number;
    characteristics: string[];
}
export interface UrbanRuralSplit {
    urban: number;
    suburban: number;
    rural: number;
}
export interface DeviceUsage {
    mobile: number;
    desktop: number;
    tablet: number;
    other: number;
}
export interface AudienceBehavior {
    activeHours: TimeRange[];
    contentConsumption: ConsumptionPattern[];
    interactionStyle: InteractionStyle;
    shareability: ShareabilityFactor[];
}
export interface TimeRange {
    start: string;
    end: string;
    timezone: string;
    days: string[];
}
export interface ConsumptionPattern {
    contentType: string;
    duration: number;
    frequency: string;
    context: string[];
}
export interface InteractionStyle {
    commentFrequency: string;
    shareFrequency: string;
    likeFrequency: string;
    clickThroughRate: number;
    engagementDepth: string;
}
export interface ShareabilityFactor {
    trigger: string;
    likelihood: number;
    context: string[];
}
export interface AudiencePreferences {
    contentTypes: ContentTypePreference[];
    formats: FormatPreference[];
    topics: TopicPreference[];
    tone: TonePreference[];
}
export interface ContentTypePreference {
    type: string;
    preference: number;
    context: string[];
}
export interface FormatPreference {
    format: string;
    preference: number;
    deviceSpecific: boolean;
}
export interface TopicPreference {
    topic: string;
    interest: number;
    seasonality: SeasonalityData[];
}
export interface SeasonalityData {
    period: string;
    multiplier: number;
}
export interface TonePreference {
    tone: string;
    preference: number;
    context: string[];
}
export interface EngagementPatterns {
    peakTimes: TimeRange[];
    contentLifecycle: LifecycleStage[];
    viralityFactors: ViralityFactor[];
    decayRate: DecayRate;
}
export interface LifecycleStage {
    stage: string;
    duration: string;
    characteristics: string[];
}
export interface ViralityFactor {
    factor: string;
    impact: number;
    conditions: string[];
}
export interface DecayRate {
    halfLife: number;
    factors: DecayFactor[];
}
export interface DecayFactor {
    factor: string;
    impact: number;
}
export interface FormatSpecifications {
    dimensions?: Dimensions;
    duration?: Duration;
    fileSize?: FileSize;
    quality?: QualitySettings;
    structure?: StructureRequirements;
}
export interface Dimensions {
    width: number;
    height: number;
    aspectRatio: string;
    responsive: boolean;
}
export interface Duration {
    min: number;
    max: number;
    optimal: number;
    unit: string;
}
export interface FileSize {
    max: number;
    optimal: number;
    unit: string;
}
export interface QualitySettings {
    resolution: Resolution;
    compression: number;
    colorDepth: number;
    frameRate?: number;
}
export interface StructureRequirements {
    sections: SectionRequirement[];
    elements: ElementRequirement[];
    hierarchy: HierarchyRule[];
}
export interface SectionRequirement {
    name: string;
    required: boolean;
    order: number;
    constraints: SectionConstraints;
}
export interface SectionConstraints {
    minLength?: number;
    maxLength?: number;
    format?: string[];
    style?: string[];
}
export interface ElementRequirement {
    element: string;
    required: boolean;
    position: string[];
    attributes: ElementAttribute[];
}
export interface ElementAttribute {
    name: string;
    value: string;
    required: boolean;
}
export interface HierarchyRule {
    level: number;
    element: string;
    styling: string[];
    nesting: NestingRule[];
}
export interface NestingRule {
    parent: string;
    children: string[];
    maxDepth: number;
}
export interface ContentTemplate {
    id: string;
    name: string;
    description: string;
    structure: TemplateStructure;
    variables: TemplateVariable[];
    rules: TemplateRule[];
}
export interface TemplateStructure {
    sections: TemplateSection[];
    layout: LayoutDefinition;
    styling: StylingDefinition;
}
export interface TemplateSection {
    id: string;
    name: string;
    type: string;
    content: string;
    variables: string[];
    optional: boolean;
}
export interface LayoutDefinition {
    type: string;
    grid?: GridDefinition;
    flexbox?: FlexboxDefinition;
    positioning?: PositioningDefinition;
}
export interface GridDefinition {
    columns: number;
    rows: number;
    gap: string;
    areas: GridArea[];
}
export interface GridArea {
    name: string;
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
}
export interface FlexboxDefinition {
    direction: string;
    wrap: string;
    justify: string;
    align: string;
    gap: string;
}
export interface PositioningDefinition {
    type: string;
    coordinates: Coordinates;
    zIndex: number;
}
export interface Coordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface StylingDefinition {
    typography: TypographyStyle;
    colors: ColorScheme;
    spacing: SpacingDefinition;
    effects: VisualEffect[];
}
export interface TypographyStyle {
    fontFamily: string;
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
}
export interface ColorScheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}
export interface SpacingDefinition {
    margin: string;
    padding: string;
    gap: string;
}
export interface VisualEffect {
    type: string;
    parameters: Record<string, any>;
    conditions: string[];
}
export declare enum VariableType {
    TEXT = "text",
    NUMBER = "number",
    BOOLEAN = "boolean",
    DATE = "date",
    URL = "url",
    IMAGE = "image",
    COLOR = "color",
    LIST = "list"
}
export interface VariableConstraints {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: any[];
    validation?: ValidationRule[];
}
export interface ValidationRule {
    type: string;
    parameters: Record<string, any>;
    message: string;
}
export interface TemplateRule {
    id: string;
    condition: string;
    action: string;
    parameters: Record<string, any>;
    priority: number;
}
export interface OptimizationRules {
    performance: PerformanceOptimization[];
    seo: SEOOptimization[];
    accessibility: AccessibilityOptimization[];
    engagement: EngagementOptimization[];
}
export interface PerformanceOptimization {
    metric: string;
    target: number;
    techniques: OptimizationTechnique[];
}
export interface OptimizationTechnique {
    name: string;
    description: string;
    impact: number;
    implementation: string;
}
export interface SEOOptimization {
    element: string;
    requirements: SEORequirement[];
    bestPractices: string[];
}
export interface SEORequirement {
    property: string;
    value: string;
    importance: string;
}
export interface AccessibilityOptimization {
    standard: string;
    level: string;
    requirements: AccessibilityRequirement[];
}
export interface AccessibilityRequirement {
    criterion: string;
    implementation: string;
    testing: string[];
}
export interface EngagementOptimization {
    metric: string;
    strategies: EngagementStrategy[];
    measurement: MeasurementMethod[];
}
export interface EngagementStrategy {
    name: string;
    description: string;
    implementation: string;
    expectedImpact: number;
}
export interface MeasurementMethod {
    metric: string;
    method: string;
    frequency: string;
}
export interface BestPractice {
    id: string;
    category: string;
    title: string;
    description: string;
    implementation: string;
    examples: BestPracticeExample[];
    metrics: string[];
}
export interface BestPracticeExample {
    title: string;
    description: string;
    before?: string;
    after: string;
    impact: string;
}
export interface AdaptationRequest {
    id: string;
    sourceContent: ContentItem;
    targetPlatforms: string[];
    brandProfile: BrandProfile;
    preferences: AdaptationPreferences;
    constraints: AdaptationConstraints;
}
export interface AdaptationPreferences {
    prioritizeEngagement: boolean;
    maintainBrandVoice: boolean;
    optimizeForPlatform: boolean;
    preserveKeyMessages: boolean;
    allowCreativeLiberty: number;
}
export interface AdaptationConstraints {
    budget?: number;
    timeline?: Date;
    approvalRequired: boolean;
    mustIncludeElements: string[];
    mustAvoidElements: string[];
}
export interface AdaptationResult {
    id: string;
    requestId: string;
    adaptedContent: AdaptedContent[];
    consistencyScore: number;
    brandAlignmentScore: number;
    platformOptimizationScore: number;
    recommendations: AdaptationRecommendation[];
    generatedAt: Date;
}
export interface AdaptedContent {
    platformId: string;
    content: ContentItem;
    adaptations: ContentAdaptation[];
    performance: PredictedPerformance;
    alternatives: ContentAlternative[];
}
export interface ContentAdaptation {
    type: AdaptationType;
    description: string;
    originalValue: string;
    adaptedValue: string;
    reason: string;
    confidence: number;
}
export declare enum AdaptationType {
    TEXT_LENGTH = "text_length",
    TONE_ADJUSTMENT = "tone_adjustment",
    FORMAT_CHANGE = "format_change",
    VISUAL_OPTIMIZATION = "visual_optimization",
    STRUCTURE_MODIFICATION = "structure_modification",
    CALL_TO_ACTION = "call_to_action",
    HASHTAG_OPTIMIZATION = "hashtag_optimization"
}
export interface PredictedPerformance {
    engagementScore: number;
    reachScore: number;
    conversionScore: number;
    brandScore: number;
    factors: PerformanceFactor[];
}
export interface PerformanceFactor {
    factor: string;
    impact: number;
    confidence: number;
    explanation: string;
}
export interface ContentAlternative {
    id: string;
    description: string;
    content: ContentItem;
    tradeoffs: Tradeoff[];
    score: number;
}
export interface Tradeoff {
    aspect: string;
    description: string;
    impact: number;
}
export interface AdaptationRecommendation {
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    implementation: string;
    expectedImpact: string;
}
export declare class ContentAdapter {
    private redis;
    private embeddingManager;
    private readonly PLATFORM_PREFIX;
    private readonly ADAPTATION_PREFIX;
    private readonly TEMPLATE_PREFIX;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    adaptContent(request: AdaptationRequest): Promise<AdaptationResult>;
    registerPlatform(platform: Platform): Promise<void>;
    getPlatform(id: string): Promise<Platform | null>;
    createContentTemplate(template: ContentTemplate): Promise<void>;
    getContentTemplate(id: string): Promise<ContentTemplate | null>;
    private adaptForPlatform;
    private adaptTextLength;
    private adaptTone;
    private adaptFormat;
    private predictPerformance;
    private generateAlternatives;
    private calculateConsistencyScore;
    private calculateBrandAlignmentScore;
    private calculatePlatformOptimizationScore;
    private generateAdaptationRecommendations;
    private intelligentTextShortening;
    private analyzeTone;
    private mapCommunicationStyleToTone;
    private adjustTone;
    private calculateContentSimilarity;
    private cosineSimilarity;
    private calculateBrandAlignment;
    private calculatePlatformOptimization;
    private storeAdaptationResult;
    private generateAdaptationId;
}
export {};
//# sourceMappingURL=content-adapter.d.ts.map