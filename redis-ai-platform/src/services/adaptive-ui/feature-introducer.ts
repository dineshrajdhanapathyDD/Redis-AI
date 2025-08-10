import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { UsagePattern, UserPreferences } from './interaction-tracker';

export interface FeatureIntroduction {
  id: string;
  userId: string;
  feature: Feature;
  introduction: IntroductionStrategy;
  timing: IntroductionTiming;
  readinessScore: number;
  relevanceScore: number;
  createdAt: number;
  status: IntroductionStatus;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  complexity: FeatureComplexity;
  prerequisites: string[];
  benefits: FeatureBenefit[];
  usageContext: string[];
  releaseDate: number;
  adoptionRate: number;
}

export enum FeatureCategory {
  CORE = 'core',
  PRODUCTIVITY = 'productivity',
  COLLABORATION = 'collaboration',
  ANALYTICS = 'analytics',
  CUSTOMIZATION = 'customization',
  INTEGRATION = 'integration',
  ADVANCED = 'advanced'
}

export enum FeatureComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  EXPERT = 'expert'
}

export interface FeatureBenefit {
  type: BenefitType;
  description: string;
  impact: ImpactLevel;
  measurable: boolean;
}

export enum BenefitType {
  TIME_SAVING = 'time_saving',
  EFFICIENCY = 'efficiency',
  QUALITY = 'quality',
  COLLABORATION = 'collaboration',
  INSIGHTS = 'insights',
  AUTOMATION = 'automation'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  TRANSFORMATIVE = 'transformative'
}

export interface IntroductionStrategy {
  type: IntroductionType;
  method: IntroductionMethod;
  content: IntroductionContent;
  interactivity: InteractivityLevel;
  duration: number;
  followUp: FollowUpAction[];
}

export enum IntroductionType {
  TOOLTIP = 'tooltip',
  MODAL = 'modal',
  GUIDED_TOUR = 'guided_tour',
  INLINE_HINT = 'inline_hint',
  NOTIFICATION = 'notification',
  PROGRESSIVE_DISCLOSURE = 'progressive_disclosure'
}

export enum IntroductionMethod {
  CONTEXTUAL = 'contextual',
  PROACTIVE = 'proactive',
  ON_DEMAND = 'on_demand',
  GRADUAL = 'gradual',
  IMMERSIVE = 'immersive'
}

export interface IntroductionContent {
  title: string;
  description: string;
  visualAids: VisualAid[];
  examples: Example[];
  callToAction: CallToAction;
}

export interface VisualAid {
  type: VisualType;
  src: string;
  alt: string;
  caption?: string;
}

export enum VisualType {
  IMAGE = 'image',
  GIF = 'gif',
  VIDEO = 'video',
  DIAGRAM = 'diagram',
  SCREENSHOT = 'screenshot'
}

export interface Example {
  title: string;
  description: string;
  scenario: string;
  outcome: string;
}

export interface CallToAction {
  text: string;
  action: ActionType;
  target: string;
  parameters: Record<string, any>;
}

export enum ActionType {
  TRY_NOW = 'try_now',
  LEARN_MORE = 'learn_more',
  WATCH_DEMO = 'watch_demo',
  START_TUTORIAL = 'start_tutorial',
  DISMISS = 'dismiss',
  REMIND_LATER = 'remind_later'
}

export enum InteractivityLevel {
  PASSIVE = 'passive',
  INTERACTIVE = 'interactive',
  HANDS_ON = 'hands_on',
  GUIDED = 'guided'
}

export interface FollowUpAction {
  trigger: FollowUpTrigger;
  delay: number;
  action: ActionType;
  content: string;
}

export enum FollowUpTrigger {
  IMMEDIATE = 'immediate',
  AFTER_USE = 'after_use',
  TIME_BASED = 'time_based',
  USAGE_MILESTONE = 'usage_milestone',
  COMPLETION = 'completion'
}

export interface IntroductionTiming {
  readinessIndicators: ReadinessIndicator[];
  optimalMoments: OptimalMoment[];
  avoidancePeriods: AvoidancePeriod[];
  frequency: IntroductionFrequency;
}

export interface ReadinessIndicator {
  type: ReadinessType;
  threshold: number;
  weight: number;
  currentValue: number;
}

export enum ReadinessType {
  USER_EXPERIENCE = 'user_experience',
  FEATURE_USAGE = 'feature_usage',
  SESSION_ACTIVITY = 'session_activity',
  TASK_COMPLETION = 'task_completion',
  ERROR_RATE = 'error_rate',
  HELP_SEEKING = 'help_seeking'
}

export interface OptimalMoment {
  context: string;
  trigger: MomentTrigger;
  conditions: MomentCondition[];
  priority: number;
}

export enum MomentTrigger {
  TASK_COMPLETION = 'task_completion',
  WORKFLOW_START = 'workflow_start',
  IDLE_TIME = 'idle_time',
  REPEATED_ACTION = 'repeated_action',
  CONTEXT_SWITCH = 'context_switch',
  SUCCESS_MOMENT = 'success_moment'
}

export interface MomentCondition {
  type: ConditionType;
  value: any;
  operator: ComparisonOperator;
}

export enum ConditionType {
  TIME_OF_DAY = 'time_of_day',
  SESSION_LENGTH = 'session_length',
  RECENT_ACTIVITY = 'recent_activity',
  USER_MOOD = 'user_mood',
  COGNITIVE_LOAD = 'cognitive_load'
}

export enum ComparisonOperator {
  EQUALS = 'equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between'
}

export interface AvoidancePeriod {
  reason: AvoidanceReason;
  conditions: MomentCondition[];
  duration: number;
}

export enum AvoidanceReason {
  HIGH_STRESS = 'high_stress',
  TASK_FOCUS = 'task_focus',
  ERROR_RECOVERY = 'error_recovery',
  TIME_PRESSURE = 'time_pressure',
  COGNITIVE_OVERLOAD = 'cognitive_overload'
}

export enum IntroductionFrequency {
  ONCE = 'once',
  PERIODIC = 'periodic',
  CONTEXTUAL = 'contextual',
  ADAPTIVE = 'adaptive'
}

export enum IntroductionStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PRESENTED = 'presented',
  ACCEPTED = 'accepted',
  DISMISSED = 'dismissed',
  DEFERRED = 'deferred'
}

export interface UserReadiness {
  userId: string;
  overallScore: number;
  dimensions: ReadinessDimension[];
  blockers: ReadinessBlocker[];
  accelerators: ReadinessAccelerator[];
  assessedAt: number;
}

export interface ReadinessDimension {
  name: string;
  score: number;
  factors: ReadinessFactor[];
  trend: TrendDirection;
}

export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining'
}

export interface ReadinessFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
}

export interface ReadinessBlocker {
  type: BlockerType;
  severity: BlockerSeverity;
  description: string;
  resolution: string;
}

export enum BlockerType {
  SKILL_GAP = 'skill_gap',
  COGNITIVE_OVERLOAD = 'cognitive_overload',
  RESISTANCE_TO_CHANGE = 'resistance_to_change',
  TIME_CONSTRAINTS = 'time_constraints',
  TECHNICAL_ISSUES = 'technical_issues'
}

export enum BlockerSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical'
}

export interface ReadinessAccelerator {
  type: AcceleratorType;
  impact: ImpactLevel;
  description: string;
  activation: string;
}

export enum AcceleratorType {
  HIGH_MOTIVATION = 'high_motivation',
  RELEVANT_CONTEXT = 'relevant_context',
  PEER_INFLUENCE = 'peer_influence',
  SUCCESS_MOMENTUM = 'success_momentum',
  CURIOSITY = 'curiosity'
}

export class FeatureIntroducer {
  private redis: Redis;
  private readonly FEATURE_PREFIX = 'feature';
  private readonly INTRODUCTION_PREFIX = 'introduction';
  private readonly READINESS_PREFIX = 'readiness';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Feature Introducer');
    
    // Initialize available features
    await this.initializeFeatures();
    
    logger.info('Feature Introducer initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Feature Introducer shutdown complete');
  }

  async assessUserReadiness(
    userId: string,
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): Promise<UserReadiness> {
    const dimensions = this.assessReadinessDimensions(patterns, preferences);
    const overallScore = this.calculateOverallReadiness(dimensions);
    const blockers = this.identifyBlockers(patterns, preferences);
    const accelerators = this.identifyAccelerators(patterns, preferences);

    const readiness: UserReadiness = {
      userId,
      overallScore,
      dimensions,
      blockers,
      accelerators,
      assessedAt: Date.now()
    };

    await this.storeUserReadiness(readiness);
    return readiness;
  }

  async identifyIntroductionOpportunities(
    userId: string,
    readiness: UserReadiness,
    patterns: UsagePattern[]
  ): Promise<FeatureIntroduction[]> {
    const availableFeatures = await this.getAvailableFeatures();
    const opportunities: FeatureIntroduction[] = [];

    for (const feature of availableFeatures) {
      const relevanceScore = this.calculateFeatureRelevance(feature, patterns);
      const readinessScore = this.calculateFeatureReadiness(feature, readiness);
      
      if (relevanceScore > 0.6 && readinessScore > 0.7) {
        const introduction = await this.createFeatureIntroduction(
          userId,
          feature,
          relevanceScore,
          readinessScore,
          patterns
        );
        opportunities.push(introduction);
      }
    }

    return opportunities.sort((a, b) => 
      (b.relevanceScore * b.readinessScore) - (a.relevanceScore * a.readinessScore)
    );
  }

  async scheduleIntroduction(
    introduction: FeatureIntroduction,
    patterns: UsagePattern[]
  ): Promise<void> {
    const timing = this.calculateOptimalTiming(introduction, patterns);
    introduction.timing = timing;
    introduction.status = IntroductionStatus.SCHEDULED;

    await this.storeFeatureIntroduction(introduction);
    logger.info(`Scheduled introduction for feature ${introduction.feature.name} for user ${introduction.userId}`);
  }

  private assessReadinessDimensions(
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): ReadinessDimension[] {
    const dimensions: ReadinessDimension[] = [];

    // Experience dimension
    const experienceScore = this.calculateExperienceScore(patterns);
    dimensions.push({
      name: 'experience',
      score: experienceScore,
      factors: [
        {
          name: 'total_interactions',
          value: patterns.reduce((sum, p) => sum + p.frequency, 0),
          weight: 0.4,
          description: 'Total number of interactions'
        },
        {
          name: 'feature_diversity',
          value: new Set(patterns.flatMap(p => p.elements)).size,
          weight: 0.6,
          description: 'Number of unique features used'
        }
      ],
      trend: TrendDirection.STABLE
    });

    // Engagement dimension
    const engagementScore = this.calculateEngagementScore(patterns);
    dimensions.push({
      name: 'engagement',
      score: engagementScore,
      factors: [
        {
          name: 'session_frequency',
          value: patterns.filter(p => p.lastSeen > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
          weight: 0.5,
          description: 'Recent session activity'
        },
        {
          name: 'feature_exploration',
          value: patterns.filter(p => p.confidence < 0.5).length,
          weight: 0.5,
          description: 'Willingness to try new features'
        }
      ],
      trend: TrendDirection.IMPROVING
    });

    // Adaptability dimension
    const adaptabilityScore = this.calculateAdaptabilityScore(preferences);
    dimensions.push({
      name: 'adaptability',
      score: adaptabilityScore,
      factors: [
        {
          name: 'customization_usage',
          value: Object.keys(preferences.layout.shortcuts).length,
          weight: 0.3,
          description: 'Use of customization features'
        },
        {
          name: 'preference_changes',
          value: preferences.personalization.showTips ? 1 : 0,
          weight: 0.7,
          description: 'Openness to learning'
        }
      ],
      trend: TrendDirection.STABLE
    });

    return dimensions;
  }

  private calculateExperienceScore(patterns: UsagePattern[]): number {
    const totalInteractions = patterns.reduce((sum, p) => sum + p.frequency, 0);
    const uniqueFeatures = new Set(patterns.flatMap(p => p.elements)).size;
    
    // Normalize scores
    const interactionScore = Math.min(1, totalInteractions / 1000);
    const diversityScore = Math.min(1, uniqueFeatures / 50);
    
    return (interactionScore * 0.4) + (diversityScore * 0.6);
  }

  private calculateEngagementScore(patterns: UsagePattern[]): number {
    const recentPatterns = patterns.filter(p => 
      p.lastSeen > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    
    const engagementScore = Math.min(1, recentPatterns.length / 20);
    const explorationScore = Math.min(1, patterns.filter(p => p.confidence < 0.5).length / 10);
    
    return (engagementScore * 0.6) + (explorationScore * 0.4);
  }

  private calculateAdaptabilityScore(preferences: UserPreferences): number {
    let score = 0.5; // Base score
    
    // Customization usage
    if (Object.keys(preferences.layout.shortcuts).length > 0) score += 0.2;
    if (preferences.layout.hiddenElements.length > 0) score += 0.1;
    if (preferences.layout.pinnedElements.length > 0) score += 0.1;
    
    // Learning preferences
    if (preferences.personalization.showTips) score += 0.1;
    if (preferences.personalization.showWelcomeMessages) score += 0.1;
    
    return Math.min(1, score);
  }

  private calculateOverallReadiness(dimensions: ReadinessDimension[]): number {
    const weights = { experience: 0.4, engagement: 0.4, adaptability: 0.2 };
    
    return dimensions.reduce((sum, dim) => {
      const weight = weights[dim.name] || 0.33;
      return sum + (dim.score * weight);
    }, 0);
  }

  private identifyBlockers(
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): ReadinessBlocker[] {
    const blockers: ReadinessBlocker[] = [];

    // Check for cognitive overload
    const recentActivity = patterns.filter(p => 
      p.lastSeen > Date.now() - 24 * 60 * 60 * 1000
    ).length;
    
    if (recentActivity > 50) {
      blockers.push({
        type: BlockerType.COGNITIVE_OVERLOAD,
        severity: BlockerSeverity.MODERATE,
        description: 'High recent activity may indicate cognitive overload',
        resolution: 'Wait for a quieter period before introducing new features'
      });
    }

    // Check for resistance to change
    if (!preferences.personalization.showTips) {
      blockers.push({
        type: BlockerType.RESISTANCE_TO_CHANGE,
        severity: BlockerSeverity.MINOR,
        description: 'User has disabled tips, may resist new feature introductions',
        resolution: 'Use subtle, contextual introductions'
      });
    }

    return blockers;
  }

  private identifyAccelerators(
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): ReadinessAccelerator[] {
    const accelerators: ReadinessAccelerator[] = [];

    // High exploration activity
    const explorationPatterns = patterns.filter(p => p.confidence < 0.3);
    if (explorationPatterns.length > 5) {
      accelerators.push({
        type: AcceleratorType.CURIOSITY,
        impact: ImpactLevel.HIGH,
        description: 'User shows high exploration behavior',
        activation: 'Leverage curiosity with feature discovery prompts'
      });
    }

    // Recent success patterns
    const successPatterns = patterns.filter(p => 
      p.confidence > 0.8 && p.lastSeen > Date.now() - 24 * 60 * 60 * 1000
    );
    
    if (successPatterns.length > 3) {
      accelerators.push({
        type: AcceleratorType.SUCCESS_MOMENTUM,
        impact: ImpactLevel.MEDIUM,
        description: 'User has recent successful interactions',
        activation: 'Introduce features that build on recent successes'
      });
    }

    return accelerators;
  }

  private calculateFeatureRelevance(feature: Feature, patterns: UsagePattern[]): number {
    let relevance = 0;

    // Context relevance
    const userContexts = new Set(patterns.flatMap(p => p.context));
    const contextOverlap = feature.usageContext.filter(ctx => userContexts.has(ctx)).length;
    relevance += (contextOverlap / feature.usageContext.length) * 0.4;

    // Prerequisite satisfaction
    const userFeatures = new Set(patterns.flatMap(p => p.elements));
    const prerequisitesSatisfied = feature.prerequisites.filter(req => userFeatures.has(req)).length;
    relevance += (prerequisitesSatisfied / (feature.prerequisites.length || 1)) * 0.3;

    // Category relevance based on user patterns
    const categoryRelevance = this.calculateCategoryRelevance(feature.category, patterns);
    relevance += categoryRelevance * 0.3;

    return Math.min(1, relevance);
  }

  private calculateCategoryRelevance(category: FeatureCategory, patterns: UsagePattern[]): number {
    // Simple category relevance based on user activity patterns
    const categoryScores = {
      [FeatureCategory.CORE]: 0.8,
      [FeatureCategory.PRODUCTIVITY]: 0.7,
      [FeatureCategory.COLLABORATION]: 0.6,
      [FeatureCategory.ANALYTICS]: 0.5,
      [FeatureCategory.CUSTOMIZATION]: 0.6,
      [FeatureCategory.INTEGRATION]: 0.4,
      [FeatureCategory.ADVANCED]: 0.3
    };

    return categoryScores[category] || 0.5;
  }

  private calculateFeatureReadiness(feature: Feature, readiness: UserReadiness): number {
    let score = readiness.overallScore;

    // Adjust based on feature complexity
    const complexityPenalty = {
      [FeatureComplexity.SIMPLE]: 0,
      [FeatureComplexity.MODERATE]: 0.1,
      [FeatureComplexity.COMPLEX]: 0.2,
      [FeatureComplexity.EXPERT]: 0.3
    };

    score -= complexityPenalty[feature.complexity];

    // Adjust for blockers
    const blockerPenalty = readiness.blockers.reduce((penalty, blocker) => {
      const severityPenalty = {
        [BlockerSeverity.MINOR]: 0.05,
        [BlockerSeverity.MODERATE]: 0.1,
        [BlockerSeverity.MAJOR]: 0.2,
        [BlockerSeverity.CRITICAL]: 0.4
      };
      return penalty + severityPenalty[blocker.severity];
    }, 0);

    score -= blockerPenalty;

    // Boost for accelerators
    const acceleratorBoost = readiness.accelerators.reduce((boost, accelerator) => {
      const impactBoost = {
        [ImpactLevel.LOW]: 0.05,
        [ImpactLevel.MEDIUM]: 0.1,
        [ImpactLevel.HIGH]: 0.15,
        [ImpactLevel.TRANSFORMATIVE]: 0.2
      };
      return boost + impactBoost[accelerator.impact];
    }, 0);

    score += acceleratorBoost;

    return Math.max(0, Math.min(1, score));
  }

  private async createFeatureIntroduction(
    userId: string,
    feature: Feature,
    relevanceScore: number,
    readinessScore: number,
    patterns: UsagePattern[]
  ): Promise<FeatureIntroduction> {
    const strategy = this.createIntroductionStrategy(feature, patterns);
    const timing = this.calculateOptimalTiming({ feature } as any, patterns);

    return {
      id: this.generateIntroductionId(),
      userId,
      feature,
      introduction: strategy,
      timing,
      readinessScore,
      relevanceScore,
      createdAt: Date.now(),
      status: IntroductionStatus.PENDING
    };
  }

  private createIntroductionStrategy(feature: Feature, patterns: UsagePattern[]): IntroductionStrategy {
    // Choose strategy based on feature complexity and user patterns
    const userExperience = this.calculateExperienceScore(patterns);
    
    let type: IntroductionType;
    let method: IntroductionMethod;
    let interactivity: InteractivityLevel;

    if (feature.complexity === FeatureComplexity.SIMPLE) {
      type = IntroductionType.TOOLTIP;
      method = IntroductionMethod.CONTEXTUAL;
      interactivity = InteractivityLevel.PASSIVE;
    } else if (userExperience > 0.7) {
      type = IntroductionType.INLINE_HINT;
      method = IntroductionMethod.PROACTIVE;
      interactivity = InteractivityLevel.INTERACTIVE;
    } else {
      type = IntroductionType.GUIDED_TOUR;
      method = IntroductionMethod.IMMERSIVE;
      interactivity = InteractivityLevel.GUIDED;
    }

    return {
      type,
      method,
      content: {
        title: `Introducing ${feature.name}`,
        description: feature.description,
        visualAids: [],
        examples: [],
        callToAction: {
          text: 'Try it now',
          action: ActionType.TRY_NOW,
          target: feature.id,
          parameters: {}
        }
      },
      interactivity,
      duration: feature.complexity === FeatureComplexity.SIMPLE ? 5000 : 15000,
      followUp: [
        {
          trigger: FollowUpTrigger.AFTER_USE,
          delay: 300000, // 5 minutes
          action: ActionType.LEARN_MORE,
          content: 'How was your experience with this feature?'
        }
      ]
    };
  }

  private calculateOptimalTiming(
    introduction: FeatureIntroduction,
    patterns: UsagePattern[]
  ): IntroductionTiming {
    return {
      readinessIndicators: [
        {
          type: ReadinessType.USER_EXPERIENCE,
          threshold: 0.5,
          weight: 0.3,
          currentValue: this.calculateExperienceScore(patterns)
        }
      ],
      optimalMoments: [
        {
          context: 'task_completion',
          trigger: MomentTrigger.SUCCESS_MOMENT,
          conditions: [],
          priority: 1
        }
      ],
      avoidancePeriods: [
        {
          reason: AvoidanceReason.HIGH_STRESS,
          conditions: [
            {
              type: ConditionType.RECENT_ACTIVITY,
              value: 10,
              operator: ComparisonOperator.GREATER_THAN
            }
          ],
          duration: 3600000 // 1 hour
        }
      ],
      frequency: IntroductionFrequency.ONCE
    };
  }

  private async initializeFeatures(): Promise<void> {
    const defaultFeatures = this.getDefaultFeatures();
    
    for (const feature of defaultFeatures) {
      await this.storeFeature(feature);
    }
  }

  private getDefaultFeatures(): Feature[] {
    return [
      {
        id: 'advanced_search',
        name: 'Advanced Search',
        description: 'Use filters and operators for more precise search results',
        category: FeatureCategory.PRODUCTIVITY,
        complexity: FeatureComplexity.MODERATE,
        prerequisites: ['basic_search'],
        benefits: [
          {
            type: BenefitType.TIME_SAVING,
            description: 'Find information 50% faster',
            impact: ImpactLevel.HIGH,
            measurable: true
          }
        ],
        usageContext: ['search', 'data_analysis'],
        releaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        adoptionRate: 0.3
      },
      {
        id: 'collaboration_tools',
        name: 'Real-time Collaboration',
        description: 'Work together with team members in real-time',
        category: FeatureCategory.COLLABORATION,
        complexity: FeatureComplexity.MODERATE,
        prerequisites: ['workspace_access'],
        benefits: [
          {
            type: BenefitType.COLLABORATION,
            description: 'Improve team productivity by 40%',
            impact: ImpactLevel.TRANSFORMATIVE,
            measurable: true
          }
        ],
        usageContext: ['teamwork', 'project_management'],
        releaseDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        adoptionRate: 0.15
      }
    ];
  }

  private async getAvailableFeatures(): Promise<Feature[]> {
    const featureKeys = await this.redis.keys(`${this.FEATURE_PREFIX}:*`);
    const features: Feature[] = [];

    for (const key of featureKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        features.push(JSON.parse(data));
      }
    }

    return features;
  }

  private async storeFeature(feature: Feature): Promise<void> {
    await this.redis.hset(
      `${this.FEATURE_PREFIX}:${feature.id}`,
      'data',
      JSON.stringify(feature)
    );
  }

  private async storeFeatureIntroduction(introduction: FeatureIntroduction): Promise<void> {
    await this.redis.hset(
      `${this.INTRODUCTION_PREFIX}:${introduction.userId}:${introduction.id}`,
      'data',
      JSON.stringify(introduction)
    );
  }

  private async storeUserReadiness(readiness: UserReadiness): Promise<void> {
    await this.redis.hset(
      `${this.READINESS_PREFIX}:${readiness.userId}`,
      'data',
      JSON.stringify(readiness)
    );
  }

  private generateIntroductionId(): string {
    return `intro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}