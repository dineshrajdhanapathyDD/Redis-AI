import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
export interface BrandProfile {
    id: string;
    name: string;
    description: string;
    guidelines: BrandGuidelines;
    styleElements: StyleElements;
    voiceAndTone: VoiceAndTone;
    visualIdentity: VisualIdentity;
    contentRules: ContentRule[];
    embeddings: BrandEmbeddings;
    createdAt: Date;
    updatedAt: Date;
}
export interface BrandGuidelines {
    mission: string;
    vision: string;
    values: string[];
    personality: string[];
    positioning: string;
    targetAudience: AudienceProfile[];
    brandPromise: string;
    differentiators: string[];
}
export interface AudienceProfile {
    id: string;
    name: string;
    demographics: Demographics;
    psychographics: Psychographics;
    preferences: AudiencePreferences;
    communicationStyle: CommunicationStyle;
}
export interface Demographics {
    ageRange: string;
    gender: string[];
    location: string[];
    income: string;
    education: string;
    occupation: string[];
}
export interface Psychographics {
    interests: string[];
    values: string[];
    lifestyle: string[];
    attitudes: string[];
    motivations: string[];
    painPoints: string[];
}
export interface AudiencePreferences {
    contentTypes: string[];
    channels: string[];
    formats: string[];
    tone: string[];
    topics: string[];
}
export interface CommunicationStyle {
    formality: FormalityLevel;
    complexity: ComplexityLevel;
    emotionalTone: EmotionalTone;
    perspective: Perspective;
    callToActionStyle: CTAStyle;
}
export declare enum FormalityLevel {
    VERY_FORMAL = "very_formal",
    FORMAL = "formal",
    SEMI_FORMAL = "semi_formal",
    CASUAL = "casual",
    VERY_CASUAL = "very_casual"
}
export declare enum ComplexityLevel {
    TECHNICAL = "technical",
    ADVANCED = "advanced",
    INTERMEDIATE = "intermediate",
    SIMPLE = "simple",
    BASIC = "basic"
}
export declare enum EmotionalTone {
    ENTHUSIASTIC = "enthusiastic",
    CONFIDENT = "confident",
    FRIENDLY = "friendly",
    PROFESSIONAL = "professional",
    EMPATHETIC = "empathetic",
    AUTHORITATIVE = "authoritative",
    PLAYFUL = "playful"
}
export declare enum Perspective {
    FIRST_PERSON = "first_person",
    SECOND_PERSON = "second_person",
    THIRD_PERSON = "third_person"
}
export declare enum CTAStyle {
    DIRECT = "direct",
    SUGGESTIVE = "suggestive",
    URGENT = "urgent",
    GENTLE = "gentle",
    EDUCATIONAL = "educational"
}
export interface StyleElements {
    typography: Typography;
    colorPalette: ColorPalette;
    imagery: ImageryStyle;
    layout: LayoutStyle;
    spacing: SpacingRules;
    iconography: IconographyStyle;
}
export interface Typography {
    primaryFont: FontDefinition;
    secondaryFont?: FontDefinition;
    headingStyles: HeadingStyle[];
    bodyTextStyle: TextStyle;
    captionStyle: TextStyle;
    linkStyle: TextStyle;
}
export interface FontDefinition {
    family: string;
    weights: number[];
    styles: string[];
    fallbacks: string[];
}
export interface HeadingStyle {
    level: number;
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    textTransform?: string;
    color?: string;
}
export interface TextStyle {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    color: string;
}
export interface ColorPalette {
    primary: ColorDefinition;
    secondary: ColorDefinition[];
    neutral: ColorDefinition[];
    accent: ColorDefinition[];
    semantic: SemanticColors;
}
export interface ColorDefinition {
    name: string;
    hex: string;
    rgb: RGB;
    hsl: HSL;
    usage: string[];
    accessibility: AccessibilityInfo;
}
export interface RGB {
    r: number;
    g: number;
    b: number;
}
export interface HSL {
    h: number;
    s: number;
    l: number;
}
export interface AccessibilityInfo {
    contrastRatio: number;
    wcagLevel: WCAGLevel;
    suitableFor: string[];
}
export declare enum WCAGLevel {
    AA = "AA",
    AAA = "AAA"
}
export interface SemanticColors {
    success: ColorDefinition;
    warning: ColorDefinition;
    error: ColorDefinition;
    info: ColorDefinition;
}
export interface ImageryStyle {
    photographyStyle: PhotographyStyle;
    illustrationStyle: IllustrationStyle;
    iconStyle: IconStyle;
    treatments: ImageTreatment[];
    aspectRatios: string[];
    qualityStandards: QualityStandards;
}
export interface PhotographyStyle {
    mood: string[];
    lighting: string[];
    composition: string[];
    colorTreatment: string[];
    subjects: string[];
    settings: string[];
}
export interface IllustrationStyle {
    style: string[];
    complexity: string;
    colorUsage: string[];
    themes: string[];
}
export interface IconStyle {
    style: string;
    weight: string;
    corner: string;
    size: string[];
}
export interface ImageTreatment {
    name: string;
    description: string;
    filters: Filter[];
    overlays: Overlay[];
}
export interface Filter {
    type: string;
    intensity: number;
    parameters: Record<string, any>;
}
export interface Overlay {
    type: string;
    opacity: number;
    color?: string;
    gradient?: GradientDefinition;
}
export interface GradientDefinition {
    type: string;
    colors: string[];
    stops: number[];
    direction?: number;
}
export interface QualityStandards {
    minResolution: Resolution;
    maxFileSize: number;
    formats: string[];
    compression: CompressionSettings;
}
export interface Resolution {
    width: number;
    height: number;
}
export interface CompressionSettings {
    quality: number;
    progressive: boolean;
    optimize: boolean;
}
export interface LayoutStyle {
    gridSystem: GridSystem;
    breakpoints: Breakpoint[];
    containers: ContainerStyle[];
    alignment: AlignmentRules;
}
export interface GridSystem {
    columns: number;
    gutterWidth: string;
    marginWidth: string;
    maxWidth: string;
}
export interface Breakpoint {
    name: string;
    minWidth: number;
    maxWidth?: number;
    columns?: number;
}
export interface ContainerStyle {
    name: string;
    maxWidth: string;
    padding: string;
    margin: string;
}
export interface AlignmentRules {
    textAlignment: string[];
    elementAlignment: string[];
    contentFlow: string;
}
export interface SpacingRules {
    baseUnit: number;
    scale: number[];
    verticalRhythm: number;
    componentSpacing: ComponentSpacing;
}
export interface ComponentSpacing {
    sections: string;
    paragraphs: string;
    lists: string;
    buttons: string;
    forms: string;
}
export interface IconographyStyle {
    style: string;
    weight: string;
    size: string[];
    usage: IconUsage[];
}
export interface IconUsage {
    context: string;
    size: string;
    color: string;
    treatment: string;
}
export interface VoiceAndTone {
    brandVoice: BrandVoice;
    toneVariations: ToneVariation[];
    languageGuidelines: LanguageGuidelines;
    messagingFramework: MessagingFramework;
}
export interface BrandVoice {
    characteristics: string[];
    doStatements: string[];
    dontStatements: string[];
    examples: VoiceExample[];
}
export interface VoiceExample {
    context: string;
    goodExample: string;
    badExample: string;
    explanation: string;
}
export interface ToneVariation {
    context: string;
    tone: string;
    characteristics: string[];
    examples: string[];
}
export interface LanguageGuidelines {
    vocabulary: VocabularyGuidelines;
    grammar: GrammarGuidelines;
    punctuation: PunctuationGuidelines;
    formatting: FormattingGuidelines;
}
export interface VocabularyGuidelines {
    preferredTerms: TermDefinition[];
    avoidedTerms: string[];
    industryJargon: JargonRule[];
    brandSpecificTerms: BrandTerm[];
}
export interface TermDefinition {
    term: string;
    definition: string;
    usage: string;
    alternatives: string[];
}
export interface JargonRule {
    term: string;
    audienceLevel: string;
    explanation: string;
    alternatives: string[];
}
export interface BrandTerm {
    term: string;
    definition: string;
    capitalization: string;
    usage: string;
}
export interface GrammarGuidelines {
    sentenceStructure: string[];
    activeVoicePreference: boolean;
    contractionUsage: ContractionRule;
    personPerspective: Perspective;
}
export declare enum ContractionRule {
    ALWAYS = "always",
    NEVER = "never",
    CONTEXT_DEPENDENT = "context_dependent"
}
export interface PunctuationGuidelines {
    serialComma: boolean;
    quotationStyle: QuotationStyle;
    ellipsisUsage: EllipsisRule;
    exclamationUsage: ExclamationRule;
}
export declare enum QuotationStyle {
    AMERICAN = "american",
    BRITISH = "british"
}
export declare enum EllipsisRule {
    MINIMAL = "minimal",
    MODERATE = "moderate",
    LIBERAL = "liberal"
}
export declare enum ExclamationRule {
    AVOID = "avoid",
    SPARINGLY = "sparingly",
    FREELY = "freely"
}
export interface FormattingGuidelines {
    headingCapitalization: CapitalizationStyle;
    listFormatting: ListStyle;
    linkFormatting: LinkStyle;
    dateFormat: string;
    numberFormat: NumberFormat;
}
export declare enum CapitalizationStyle {
    TITLE_CASE = "title_case",
    SENTENCE_CASE = "sentence_case",
    ALL_CAPS = "all_caps"
}
export interface ListStyle {
    bulletStyle: string;
    numbering: string;
    indentation: string;
    punctuation: boolean;
}
export interface LinkStyle {
    color: string;
    underline: boolean;
    hoverEffect: string;
    openInNewTab: boolean;
}
export interface NumberFormat {
    thousands: string;
    decimal: string;
    currency: CurrencyFormat;
}
export interface CurrencyFormat {
    symbol: string;
    position: string;
    spacing: boolean;
}
export interface MessagingFramework {
    coreMessages: CoreMessage[];
    valuePropositions: ValueProposition[];
    keyBenefits: KeyBenefit[];
    proofPoints: ProofPoint[];
}
export interface CoreMessage {
    id: string;
    message: string;
    audience: string[];
    context: string[];
    variations: MessageVariation[];
}
export interface MessageVariation {
    length: MessageLength;
    formality: FormalityLevel;
    text: string;
}
export declare enum MessageLength {
    SHORT = "short",
    MEDIUM = "medium",
    LONG = "long"
}
export interface ValueProposition {
    id: string;
    proposition: string;
    targetAudience: string;
    differentiator: string;
    benefit: string;
    evidence: string[];
}
export interface KeyBenefit {
    id: string;
    benefit: string;
    description: string;
    audience: string[];
    priority: number;
    supportingPoints: string[];
}
export interface ProofPoint {
    id: string;
    claim: string;
    evidence: string;
    source: string;
    credibility: CredibilityLevel;
    context: string[];
}
export declare enum CredibilityLevel {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface VisualIdentity {
    logo: LogoGuidelines;
    brandMark: BrandMarkGuidelines;
    colorUsage: ColorUsageRules;
    typographyUsage: TypographyUsageRules;
    imageryUsage: ImageryUsageRules;
    layoutPrinciples: LayoutPrinciples;
}
export interface LogoGuidelines {
    variations: LogoVariation[];
    minSize: Resolution;
    clearSpace: ClearSpaceRules;
    placement: PlacementRules;
    colorTreatments: ColorTreatment[];
    incorrectUsage: IncorrectUsage[];
}
export interface LogoVariation {
    name: string;
    description: string;
    usage: string[];
    fileFormats: string[];
    colorModes: string[];
}
export interface ClearSpaceRules {
    minimum: string;
    calculation: string;
    exceptions: string[];
}
export interface PlacementRules {
    preferredPositions: string[];
    alignment: string[];
    backgrounds: BackgroundRule[];
}
export interface BackgroundRule {
    type: string;
    contrast: number;
    treatment: string;
}
export interface ColorTreatment {
    name: string;
    colors: string[];
    usage: string[];
    restrictions: string[];
}
export interface IncorrectUsage {
    description: string;
    example: string;
    reason: string;
}
export interface BrandMarkGuidelines {
    usage: string[];
    sizing: SizingRules;
    placement: PlacementRules;
    colorTreatments: ColorTreatment[];
}
export interface SizingRules {
    minSize: Resolution;
    maxSize: Resolution;
    proportions: string;
}
export interface ColorUsageRules {
    primaryUsage: ColorUsageRule[];
    secondaryUsage: ColorUsageRule[];
    combinations: ColorCombination[];
    accessibility: AccessibilityRule[];
}
export interface ColorUsageRule {
    color: string;
    contexts: string[];
    percentageUsage: number;
    restrictions: string[];
}
export interface ColorCombination {
    primary: string;
    secondary: string[];
    usage: string[];
    avoid: string[];
}
export interface AccessibilityRule {
    foreground: string;
    background: string;
    contrastRatio: number;
    wcagLevel: WCAGLevel;
    usage: string[];
}
export interface TypographyUsageRules {
    hierarchy: TypographyHierarchy[];
    pairing: FontPairing[];
    sizing: SizingScale;
    spacing: TypographySpacing;
}
export interface TypographyHierarchy {
    level: string;
    font: string;
    size: string;
    weight: number;
    usage: string[];
}
export interface FontPairing {
    primary: string;
    secondary: string;
    usage: string[];
    ratio: number;
}
export interface SizingScale {
    base: number;
    ratio: number;
    steps: number[];
}
export interface TypographySpacing {
    lineHeight: number;
    paragraphSpacing: string;
    letterSpacing: LetterSpacingRule[];
}
export interface LetterSpacingRule {
    fontSize: string;
    spacing: number;
    context: string[];
}
export interface ImageryUsageRules {
    styleConsistency: StyleConsistencyRule[];
    qualityStandards: QualityStandards;
    contentGuidelines: ContentGuideline[];
    treatmentRules: TreatmentRule[];
}
export interface StyleConsistencyRule {
    aspect: string;
    requirement: string;
    tolerance: number;
    examples: string[];
}
export interface ContentGuideline {
    type: string;
    requirements: string[];
    restrictions: string[];
    examples: string[];
}
export interface TreatmentRule {
    treatment: string;
    usage: string[];
    parameters: Record<string, any>;
}
export interface LayoutPrinciples {
    gridUsage: GridUsageRule[];
    alignment: AlignmentPrinciple[];
    spacing: SpacingPrinciple[];
    hierarchy: VisualHierarchy[];
}
export interface GridUsageRule {
    context: string;
    gridType: string;
    columns: number;
    flexibility: string;
}
export interface AlignmentPrinciple {
    element: string;
    alignment: string;
    context: string[];
    exceptions: string[];
}
export interface SpacingPrinciple {
    relationship: string;
    spacing: string;
    calculation: string;
    responsive: boolean;
}
export interface VisualHierarchy {
    level: number;
    treatment: string;
    usage: string[];
    relationships: string[];
}
export interface ContentRule {
    id: string;
    name: string;
    description: string;
    category: ContentRuleCategory;
    severity: RuleSeverity;
    conditions: RuleCondition[];
    actions: RuleAction[];
    exceptions: RuleException[];
    isActive: boolean;
}
export declare enum ContentRuleCategory {
    VOICE_TONE = "voice_tone",
    VISUAL_STYLE = "visual_style",
    MESSAGING = "messaging",
    FORMATTING = "formatting",
    ACCESSIBILITY = "accessibility",
    BRAND_COMPLIANCE = "brand_compliance"
}
export declare enum RuleSeverity {
    ERROR = "error",
    WARNING = "warning",
    INFO = "info"
}
export interface RuleCondition {
    type: ConditionType;
    field: string;
    operator: ConditionOperator;
    value: any;
    weight: number;
}
export declare enum ConditionType {
    TEXT_CONTENT = "text_content",
    VISUAL_ELEMENT = "visual_element",
    METADATA = "metadata",
    CONTEXT = "context"
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    CONTAINS = "contains",
    MATCHES = "matches",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    IN_RANGE = "in_range"
}
export interface RuleAction {
    type: ActionType;
    description: string;
    parameters: Record<string, any>;
    autoApply: boolean;
}
export declare enum ActionType {
    SUGGEST_CHANGE = "suggest_change",
    AUTO_CORRECT = "auto_correct",
    FLAG_VIOLATION = "flag_violation",
    REQUEST_REVIEW = "request_review"
}
export interface RuleException {
    condition: string;
    reason: string;
    approvedBy: string;
    expiresAt?: Date;
}
export interface BrandEmbeddings {
    voiceEmbedding: number[];
    styleEmbedding: number[];
    visualEmbedding: number[];
    messagingEmbedding: number[];
    overallEmbedding: number[];
}
export declare class BrandAnalyzer {
    private redis;
    private embeddingManager;
    private readonly BRAND_PREFIX;
    private readonly PROFILE_PREFIX;
    private readonly ANALYSIS_PREFIX;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    createBrandProfile(profile: Omit<BrandProfile, 'id' | 'embeddings' | 'createdAt' | 'updatedAt'>): Promise<BrandProfile>;
    updateBrandProfile(id: string, updates: Partial<BrandProfile>): Promise<BrandProfile>;
    getBrandProfile(id: string): Promise<BrandProfile | null>;
    analyzeBrandConsistency(brandId: string, content: ContentItem[]): Promise<BrandConsistencyReport>;
    private generateBrandEmbeddings;
    private extractVoiceText;
    private extractStyleText;
    private extractVisualText;
    private extractMessagingText;
    private storeBrandProfile;
    private storeConsistencyReport;
    private generateBrandId;
    private generateReportId;
    private analyzeContentItem;
    private calculateConsistencyScore;
    private calculateOverallScore;
    private generateRecommendations;
}
export interface ContentItem {
    id: string;
    type: ContentType;
    title: string;
    content: string;
    metadata: ContentMetadata;
    platform: string;
    createdAt: Date;
}
export declare enum ContentType {
    ARTICLE = "article",
    SOCIAL_POST = "social_post",
    EMAIL = "email",
    ADVERTISEMENT = "advertisement",
    WEBPAGE = "webpage",
    VIDEO = "video",
    IMAGE = "image"
}
export interface ContentMetadata {
    author: string;
    audience: string[];
    tags: string[];
    language: string;
    format: string;
    channel: string;
}
export interface BrandConsistencyReport {
    id: string;
    brandId: string;
    contentItems: number;
    overallScore: number;
    violations: BrandViolation[];
    scores: ConsistencyScore[];
    recommendations: BrandRecommendation[];
    generatedAt: Date;
}
export interface BrandViolation {
    id: string;
    contentId: string;
    ruleId: string;
    severity: RuleSeverity;
    description: string;
    location: ViolationLocation;
    suggestion: string;
}
export interface ViolationLocation {
    type: string;
    position: number;
    length: number;
    context: string;
}
export interface ConsistencyScore {
    contentId: string;
    overallScore: number;
    voiceScore: number;
    styleScore: number;
    visualScore: number;
    messagingScore: number;
}
export interface BrandRecommendation {
    id: string;
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string;
    impact: string;
    effort: string;
    examples: string[];
}
export declare enum RecommendationType {
    VOICE_ADJUSTMENT = "voice_adjustment",
    STYLE_CORRECTION = "style_correction",
    VISUAL_ALIGNMENT = "visual_alignment",
    MESSAGE_REFINEMENT = "message_refinement"
}
export declare enum RecommendationPriority {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
//# sourceMappingURL=brand-analyzer.d.ts.map