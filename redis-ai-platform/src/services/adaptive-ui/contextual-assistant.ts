import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { UsagePattern, UserInteraction } from './interaction-tracker';

export interface ContextualHelp {
  id: string;
  userId: string;
  context: HelpContext;
  suggestions: HelpSuggestion[];
  tutorials: Tutorial[];
  tips: ContextualTip[];
  generatedAt: number;
  relevanceScore: number;
}

export interface HelpContext {
  currentPage: string;
  currentTask: string;
  userGoal: string;
  recentActions: string[];
  strugglingWith?: string;
  timeSpent: number;
  errorCount: number;
  helpRequests: number;
}

export interface HelpSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  action: SuggestionAction;
  confidence: number;
  priority: Priority;
  category: HelpCategory;
}

export enum SuggestionType {
  NEXT_STEP = 'next_step',
  ALTERNATIVE_PATH = 'alternative_path',
  SHORTCUT = 'shortcut',
  FEATURE_DISCOVERY = 'feature_discovery',
  TROUBLESHOOTING = 'troubleshooting',
  BEST_PRACTICE = 'best_practice'
}

export interface SuggestionAction {
  type: ActionType;
  target: string;
  parameters: Record<string, any>;
  description: string;
}

export enum ActionType {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  HIGHLIGHT = 'highlight',
  SHOW_TUTORIAL = 'show_tutorial',
  OPEN_HELP = 'open_help',
  EXECUTE_COMMAND = 'execute_command'
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum HelpCategory {
  NAVIGATION = 'navigation',
  FUNCTIONALITY = 'functionality',
  EFFICIENCY = 'efficiency',
  TROUBLESHOOTING = 'troubleshooting',
  LEARNING = 'learning'
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  difficulty: Difficulty;
  estimatedTime: number;
  prerequisites: string[];
  relevanceScore: number;
}

export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: StepAction;
  validation: StepValidation;
  hints: string[];
}

export interface StepAction {
  type: ActionType;
  target: string;
  parameters: Record<string, any>;
  waitFor?: string;
}

export interface StepValidation {
  type: ValidationType;
  condition: string;
  errorMessage: string;
  retryAction?: StepAction;
}

export enum ValidationType {
  ELEMENT_EXISTS = 'element_exists',
  ELEMENT_VISIBLE = 'element_visible',
  VALUE_EQUALS = 'value_equals',
  PAGE_LOADED = 'page_loaded',
  CUSTOM = 'custom'
}

export interface ContextualTip {
  id: string;
  type: TipType;
  title: string;
  content: string;
  trigger: TipTrigger;
  displayConditions: DisplayCondition[];
  dismissible: boolean;
  importance: Importance;
}

export enum TipType {
  FEATURE_HIGHLIGHT = 'feature_highlight',
  EFFICIENCY_TIP = 'efficiency_tip',
  KEYBOARD_SHORTCUT = 'keyboard_shortcut',
  BEST_PRACTICE = 'best_practice',
  WARNING = 'warning',
  CELEBRATION = 'celebration'
}

export interface TipTrigger {
  event: TriggerEvent;
  conditions: TriggerCondition[];
  delay?: number;
  frequency: TriggerFrequency;
}

export enum TriggerEvent {
  PAGE_LOAD = 'page_load',
  ELEMENT_HOVER = 'element_hover',
  ACTION_COMPLETE = 'action_complete',
  ERROR_OCCURRED = 'error_occurred',
  TIME_SPENT = 'time_spent',
  PATTERN_DETECTED = 'pattern_detected'
}

export interface TriggerCondition {
  type: ConditionType;
  value: any;
  operator: ComparisonOperator;
}

export enum ConditionType {
  USER_LEVEL = 'user_level',
  FEATURE_USAGE = 'feature_usage',
  TIME_OF_DAY = 'time_of_day',
  SESSION_LENGTH = 'session_length',
  ERROR_COUNT = 'error_count'
}

export enum ComparisonOperator {
  EQUALS = 'equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains'
}

export enum TriggerFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ALWAYS = 'always'
}

export interface DisplayCondition {
  type: ConditionType;
  value: any;
  operator: ComparisonOperator;
}

export enum Importance {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface UserStruggle {
  userId: string;
  context: string;
  issue: StruggleType;
  indicators: StruggleIndicator[];
  severity: StruggeSeverity;
  detectedAt: number;
  resolved: boolean;
  resolution?: StruggleResolution;
}

export enum StruggleType {
  NAVIGATION_CONFUSION = 'navigation_confusion',
  FEATURE_DISCOVERY = 'feature_discovery',
  TASK_COMPLETION = 'task_completion',
  ERROR_RECOVERY = 'error_recovery',
  EFFICIENCY_ISSUE = 'efficiency_issue'
}

export interface StruggleIndicator {
  type: IndicatorType;
  value: number;
  threshold: number;
  weight: number;
}

export enum IndicatorType {
  TIME_SPENT = 'time_spent',
  CLICK_COUNT = 'click_count',
  ERROR_RATE = 'error_rate',
  HELP_REQUESTS = 'help_requests',
  BACKTRACK_COUNT = 'backtrack_count',
  HOVER_TIME = 'hover_time'
}

export enum StruggeSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical'
}

export interface StruggleResolution {
  method: ResolutionMethod;
  helpProvided: string[];
  timeToResolve: number;
  userSatisfaction: number;
  effectiveness: number;
}

export enum ResolutionMethod {
  CONTEXTUAL_HELP = 'contextual_help',
  TUTORIAL = 'tutorial',
  DIRECT_ASSISTANCE = 'direct_assistance',
  SELF_RESOLVED = 'self_resolved'
}

export class ContextualAssistant {
  private redis: Redis;
  private readonly HELP_PREFIX = 'contextual_help';
  private readonly STRUGGLE_PREFIX = 'user_struggle';
  private readonly TIP_PREFIX = 'contextual_tip';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Contextual Assistant');
    
    // Initialize default tutorials and tips
    await this.initializeDefaultContent();
    
    logger.info('Contextual Assistant initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Contextual Assistant shutdown complete');
  }

  async generateContextualHelp(
    userId: string,
    context: HelpContext,
    patterns: UsagePattern[]
  ): Promise<ContextualHelp> {
    // Analyze current context and user patterns
    const suggestions = await this.generateSuggestions(context, patterns);
    const tutorials = await this.findRelevantTutorials(context, patterns);
    const tips = await this.generateContextualTips(context, patterns);
    const relevanceScore = this.calculateRelevanceScore(context, patterns);

    const help: ContextualHelp = {
      id: this.generateHelpId(),
      userId,
      context,
      suggestions,
      tutorials,
      tips,
      generatedAt: Date.now(),
      relevanceScore
    };

    await this.storeContextualHelp(help);
    return help;
  }

  async detectUserStruggle(
    userId: string,
    recentInteractions: UserInteraction[]
  ): Promise<UserStruggle | null> {
    const indicators = this.analyzeStruggleIndicators(recentInteractions);
    const struggleType = this.identifyStruggleType(indicators);
    
    if (!struggleType) return null;

    const severity = this.calculateStruggeSeverity(indicators);
    
    const struggle: UserStruggle = {
      userId,
      context: recentInteractions[0]?.context.page || 'unknown',
      issue: struggleType,
      indicators,
      severity,
      detectedAt: Date.now(),
      resolved: false
    };

    await this.storeUserStruggle(struggle);
    return struggle;
  }

  async provideProactiveHelp(
    userId: string,
    currentContext: HelpContext
  ): Promise<ContextualHelp | null> {
    // Check if user might need help based on context
    const needsHelp = this.assessHelpNeed(currentContext);
    
    if (!needsHelp) return null;

    // Generate proactive help
    const patterns = await this.getUserPatterns(userId);
    return this.generateContextualHelp(userId, currentContext, patterns);
  }

  private async generateSuggestions(
    context: HelpContext,
    patterns: UsagePattern[]
  ): Promise<HelpSuggestion[]> {
    const suggestions: HelpSuggestion[] = [];

    // Next step suggestions based on current task
    if (context.currentTask) {
      const nextSteps = this.getNextStepSuggestions(context.currentTask);
      suggestions.push(...nextSteps);
    }

    // Shortcut suggestions based on patterns
    const shortcutSuggestions = this.getShortcutSuggestions(patterns);
    suggestions.push(...shortcutSuggestions);

    // Troubleshooting suggestions if errors detected
    if (context.errorCount > 0) {
      const troubleshooting = this.getTroubleshootingSuggestions(context);
      suggestions.push(...troubleshooting);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private getNextStepSuggestions(currentTask: string): HelpSuggestion[] {
    const taskSteps = {
      'create_project': [
        {
          title: 'Add project details',
          description: 'Fill in the project name and description',
          target: 'project-form'
        },
        {
          title: 'Configure settings',
          description: 'Set up project configuration options',
          target: 'settings-panel'
        }
      ],
      'search_data': [
        {
          title: 'Refine search filters',
          description: 'Use filters to narrow down your results',
          target: 'search-filters'
        },
        {
          title: 'Save search query',
          description: 'Save this search for future use',
          target: 'save-search-button'
        }
      ]
    };

    const steps = taskSteps[currentTask] || [];
    
    return steps.map((step, index) => ({
      id: `next_step_${index}`,
      type: SuggestionType.NEXT_STEP,
      title: step.title,
      description: step.description,
      action: {
        type: ActionType.HIGHLIGHT,
        target: step.target,
        parameters: {},
        description: `Highlight ${step.target}`
      },
      confidence: 0.8,
      priority: Priority.HIGH,
      category: HelpCategory.NAVIGATION
    }));
  }

  private getShortcutSuggestions(patterns: UsagePattern[]): HelpSuggestion[] {
    const suggestions: HelpSuggestion[] = [];
    
    const frequentActions = patterns.filter(p => p.frequency > 20);
    
    frequentActions.forEach(pattern => {
      suggestions.push({
        id: `shortcut_${pattern.elements[0]}`,
        type: SuggestionType.SHORTCUT,
        title: 'Use keyboard shortcut',
        description: `Press Ctrl+${pattern.elements[0].charAt(0).toUpperCase()} for ${pattern.elements[0]}`,
        action: {
          type: ActionType.SHOW_TUTORIAL,
          target: 'keyboard-shortcuts',
          parameters: { action: pattern.elements[0] },
          description: 'Show keyboard shortcuts tutorial'
        },
        confidence: pattern.confidence,
        priority: Priority.MEDIUM,
        category: HelpCategory.EFFICIENCY
      });
    });

    return suggestions;
  }

  private getTroubleshootingSuggestions(context: HelpContext): HelpSuggestion[] {
    return [
      {
        id: 'troubleshoot_errors',
        type: SuggestionType.TROUBLESHOOTING,
        title: 'Resolve errors',
        description: `You've encountered ${context.errorCount} errors. Let me help you fix them.`,
        action: {
          type: ActionType.OPEN_HELP,
          target: 'error-help',
          parameters: { errorCount: context.errorCount },
          description: 'Open error troubleshooting guide'
        },
        confidence: 0.9,
        priority: Priority.HIGH,
        category: HelpCategory.TROUBLESHOOTING
      }
    ];
  }

  private async findRelevantTutorials(
    context: HelpContext,
    patterns: UsagePattern[]
  ): Promise<Tutorial[]> {
    // Get all available tutorials
    const allTutorials = await this.getAllTutorials();
    
    // Score tutorials based on relevance to current context
    const scoredTutorials = allTutorials.map(tutorial => ({
      ...tutorial,
      relevanceScore: this.calculateTutorialRelevance(tutorial, context, patterns)
    }));

    // Return top 3 most relevant tutorials
    return scoredTutorials
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }

  private calculateTutorialRelevance(
    tutorial: Tutorial,
    context: HelpContext,
    patterns: UsagePattern[]
  ): number {
    let score = 0;

    // Context relevance
    if (tutorial.title.toLowerCase().includes(context.currentTask.toLowerCase())) {
      score += 0.5;
    }

    // Pattern relevance
    const tutorialElements = tutorial.steps.map(step => step.action.target);
    const userElements = patterns.flatMap(p => p.elements);
    const overlap = tutorialElements.filter(el => userElements.includes(el)).length;
    score += (overlap / tutorialElements.length) * 0.3;

    // Difficulty appropriateness
    const userExperience = this.estimateUserExperience(patterns);
    if (tutorial.difficulty === Difficulty.BEGINNER && userExperience < 0.3) score += 0.2;
    if (tutorial.difficulty === Difficulty.INTERMEDIATE && userExperience >= 0.3 && userExperience < 0.7) score += 0.2;
    if (tutorial.difficulty === Difficulty.ADVANCED && userExperience >= 0.7) score += 0.2;

    return Math.min(1, score);
  }

  private estimateUserExperience(patterns: UsagePattern[]): number {
    const totalInteractions = patterns.reduce((sum, p) => sum + p.frequency, 0);
    const uniqueFeatures = new Set(patterns.flatMap(p => p.elements)).size;
    
    // Simple experience estimation based on interaction volume and feature diversity
    return Math.min(1, (totalInteractions / 1000) * 0.7 + (uniqueFeatures / 50) * 0.3);
  }

  private async generateContextualTips(
    context: HelpContext,
    patterns: UsagePattern[]
  ): Promise<ContextualTip[]> {
    const tips: ContextualTip[] = [];

    // Feature highlight tips for unused features
    const unusedFeatures = this.identifyUnusedFeatures(patterns);
    unusedFeatures.forEach(feature => {
      tips.push({
        id: `tip_${feature}`,
        type: TipType.FEATURE_HIGHLIGHT,
        title: `Try ${feature}`,
        content: `${feature} can help you work more efficiently`,
        trigger: {
          event: TriggerEvent.PAGE_LOAD,
          conditions: [],
          frequency: TriggerFrequency.WEEKLY
        },
        displayConditions: [],
        dismissible: true,
        importance: Importance.MEDIUM
      });
    });

    // Efficiency tips based on patterns
    const inefficiencies = this.identifyInefficiencies(patterns);
    inefficiencies.forEach(inefficiency => {
      tips.push({
        id: `efficiency_${inefficiency.action}`,
        type: TipType.EFFICIENCY_TIP,
        title: 'Work smarter',
        content: inefficiency.suggestion,
        trigger: {
          event: TriggerEvent.PATTERN_DETECTED,
          conditions: [
            {
              type: ConditionType.FEATURE_USAGE,
              value: inefficiency.action,
              operator: ComparisonOperator.GREATER_THAN
            }
          ],
          frequency: TriggerFrequency.ONCE
        },
        displayConditions: [],
        dismissible: true,
        importance: Importance.HIGH
      });
    });

    return tips;
  }

  private identifyUnusedFeatures(patterns: UsagePattern[]): string[] {
    const usedFeatures = new Set(patterns.flatMap(p => p.elements));
    const allFeatures = ['search', 'filters', 'export', 'share', 'collaborate', 'automate'];
    
    return allFeatures.filter(feature => !usedFeatures.has(feature));
  }

  private identifyInefficiencies(patterns: UsagePattern[]): Array<{action: string, suggestion: string}> {
    const inefficiencies: Array<{action: string, suggestion: string}> = [];
    
    patterns.forEach(pattern => {
      if (pattern.frequency > 50 && pattern.pattern === 'workflow_sequence') {
        inefficiencies.push({
          action: pattern.elements.join('_'),
          suggestion: `Consider creating a shortcut for this common workflow: ${pattern.elements.join(' → ')}`
        });
      }
    });

    return inefficiencies;
  }

  private analyzeStruggleIndicators(interactions: UserInteraction[]): StruggleIndicator[] {
    const indicators: StruggleIndicator[] = [];
    
    // Time spent indicator
    const totalTime = interactions.reduce((sum, i) => sum + (i.metadata.duration || 0), 0);
    if (totalTime > 300000) { // 5 minutes
      indicators.push({
        type: IndicatorType.TIME_SPENT,
        value: totalTime,
        threshold: 300000,
        weight: 0.3
      });
    }

    // Error rate indicator
    const errors = interactions.filter(i => i.metadata.errorOccurred).length;
    const errorRate = errors / interactions.length;
    if (errorRate > 0.1) {
      indicators.push({
        type: IndicatorType.ERROR_RATE,
        value: errorRate,
        threshold: 0.1,
        weight: 0.4
      });
    }

    // Click count indicator (excessive clicking might indicate confusion)
    const clicks = interactions.filter(i => i.type === 'click').length;
    if (clicks > 20) {
      indicators.push({
        type: IndicatorType.CLICK_COUNT,
        value: clicks,
        threshold: 20,
        weight: 0.2
      });
    }

    return indicators;
  }

  private identifyStruggleType(indicators: StruggleIndicator[]): StruggleType | null {
    if (indicators.length === 0) return null;

    // Simple rule-based struggle type identification
    const hasTimeIssue = indicators.some(i => i.type === IndicatorType.TIME_SPENT);
    const hasErrorIssue = indicators.some(i => i.type === IndicatorType.ERROR_RATE);
    const hasClickIssue = indicators.some(i => i.type === IndicatorType.CLICK_COUNT);

    if (hasErrorIssue) return StruggleType.ERROR_RECOVERY;
    if (hasTimeIssue && hasClickIssue) return StruggleType.NAVIGATION_CONFUSION;
    if (hasTimeIssue) return StruggleType.TASK_COMPLETION;
    
    return StruggleType.EFFICIENCY_ISSUE;
  }

  private calculateStruggeSeverity(indicators: StruggleIndicator[]): StruggeSeverity {
    const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0);
    const weightedScore = indicators.reduce((sum, i) => {
      const severity = Math.min(1, i.value / i.threshold);
      return sum + (severity * i.weight);
    }, 0);

    const normalizedScore = weightedScore / totalWeight;

    if (normalizedScore > 0.8) return StruggeSeverity.CRITICAL;
    if (normalizedScore > 0.6) return StruggeSeverity.MAJOR;
    if (normalizedScore > 0.4) return StruggeSeverity.MODERATE;
    return StruggeSeverity.MINOR;
  }

  private assessHelpNeed(context: HelpContext): boolean {
    // Assess if user might need proactive help
    return context.timeSpent > 180000 || // 3 minutes on same task
           context.errorCount > 2 ||
           context.helpRequests > 0;
  }

  private calculateRelevanceScore(context: HelpContext, patterns: UsagePattern[]): number {
    let score = 0.5; // Base score

    // Increase score based on context indicators
    if (context.errorCount > 0) score += 0.2;
    if (context.timeSpent > 300000) score += 0.2; // 5 minutes
    if (context.helpRequests > 0) score += 0.3;

    // Adjust based on user patterns
    const relevantPatterns = patterns.filter(p => 
      p.context.includes(context.currentPage) || 
      p.elements.some(e => context.recentActions.includes(e))
    );
    
    if (relevantPatterns.length > 0) {
      score += 0.1 * relevantPatterns.length;
    }

    return Math.min(1, score);
  }

  private async initializeDefaultContent(): Promise<void> {
    // Initialize default tutorials and tips
    const defaultTutorials = this.getDefaultTutorials();
    
    for (const tutorial of defaultTutorials) {
      await this.storeTutorial(tutorial);
    }
  }

  private getDefaultTutorials(): Tutorial[] {
    return [
      {
        id: 'getting_started',
        title: 'Getting Started',
        description: 'Learn the basics of using the platform',
        steps: [
          {
            id: 'step1',
            title: 'Welcome',
            description: 'Welcome to the platform',
            action: {
              type: ActionType.HIGHLIGHT,
              target: 'main-navigation',
              parameters: {}
            },
            validation: {
              type: ValidationType.ELEMENT_VISIBLE,
              condition: 'main-navigation',
              errorMessage: 'Navigation not visible'
            },
            hints: ['Look for the main navigation at the top']
          }
        ],
        difficulty: Difficulty.BEGINNER,
        estimatedTime: 300,
        prerequisites: [],
        relevanceScore: 0.8
      }
    ];
  }

  private async getAllTutorials(): Promise<Tutorial[]> {
    const tutorialKeys = await this.redis.keys('tutorial:*');
    const tutorials: Tutorial[] = [];

    for (const key of tutorialKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        tutorials.push(JSON.parse(data));
      }
    }

    return tutorials;
  }

  private async getUserPatterns(userId: string): Promise<UsagePattern[]> {
    const patternKeys = await this.redis.keys(`pattern:${userId}:*`);
    const patterns: UsagePattern[] = [];

    for (const key of patternKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        patterns.push(JSON.parse(data));
      }
    }

    return patterns;
  }

  private async storeContextualHelp(help: ContextualHelp): Promise<void> {
    await this.redis.hset(
      `${this.HELP_PREFIX}:${help.userId}:${help.id}`,
      'data',
      JSON.stringify(help)
    );
  }

  private async storeUserStruggle(struggle: UserStruggle): Promise<void> {
    await this.redis.hset(
      `${this.STRUGGLE_PREFIX}:${struggle.userId}:${struggle.detectedAt}`,
      'data',
      JSON.stringify(struggle)
    );
  }

  private async storeTutorial(tutorial: Tutorial): Promise<void> {
    await this.redis.hset(
      `tutorial:${tutorial.id}`,
      'data',
      JSON.stringify(tutorial)
    );
  }

  private generateHelpId(): string {
    return `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}