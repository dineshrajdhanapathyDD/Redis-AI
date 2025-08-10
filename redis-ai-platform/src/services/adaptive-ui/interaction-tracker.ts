import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';

export interface UserInteraction {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  type: InteractionType;
  element: UIElement;
  context: InteractionContext;
  metadata: InteractionMetadata;
}

export enum InteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  SCROLL = 'scroll',
  KEYBOARD = 'keyboard',
  DRAG = 'drag',
  RESIZE = 'resize',
  FOCUS = 'focus',
  BLUR = 'blur',
  SEARCH = 'search',
  NAVIGATION = 'navigation',
  FORM_SUBMIT = 'form_submit',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  TAB_SWITCH = 'tab_switch',
  MENU_OPEN = 'menu_open'
}

export interface UIElement {
  id: string;
  type: ElementType;
  component: string;
  position: ElementPosition;
  properties: ElementProperties;
}

export enum ElementType {
  BUTTON = 'button',
  LINK = 'link',
  INPUT = 'input',
  DROPDOWN = 'dropdown',
  MODAL = 'modal',
  TAB = 'tab',
  MENU = 'menu',
  PANEL = 'panel',
  CARD = 'card',
  LIST_ITEM = 'list_item',
  ICON = 'icon',
  TEXT = 'text',
  IMAGE = 'image',
  CHART = 'chart',
  TABLE = 'table'
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  viewport: ViewportInfo;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

export interface ElementProperties {
  className?: string;
  text?: string;
  value?: string;
  href?: string;
  disabled?: boolean;
  visible?: boolean;
  [key: string]: any;
}

export interface InteractionContext {
  page: string;
  section: string;
  task: string;
  workflow: string;
  previousAction?: string;
  timeOnPage: number;
  deviceInfo: DeviceInfo;
  userAgent: string;
}

export interface DeviceInfo {
  type: DeviceType;
  os: string;
  browser: string;
  screenResolution: Resolution;
  colorDepth: number;
  touchSupport: boolean;
}

export enum DeviceType {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile'
}

export interface Resolution {
  width: number;
  height: number;
}

export interface InteractionMetadata {
  duration?: number;
  distance?: number;
  velocity?: number;
  pressure?: number;
  modifierKeys?: string[];
  errorOccurred?: boolean;
  completionStatus?: CompletionStatus;
  customData?: Record<string, any>;
}

export enum CompletionStatus {
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  ERROR = 'error',
  TIMEOUT = 'timeout'
}

export interface UserSession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  interactions: UserInteraction[];
  pages: PageVisit[];
  goals: SessionGoal[];
  outcome: SessionOutcome;
}

export interface PageVisit {
  page: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  scrollDepth: number;
  interactions: number;
  exitType: ExitType;
}

export enum ExitType {
  NAVIGATION = 'navigation',
  CLOSE = 'close',
  TIMEOUT = 'timeout',
  ERROR = 'error'
}

export interface SessionGoal {
  id: string;
  type: GoalType;
  description: string;
  completed: boolean;
  completionTime?: number;
  steps: GoalStep[];
}

export enum GoalType {
  SEARCH = 'search',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  ANALYZE = 'analyze',
  CONFIGURE = 'configure',
  LEARN = 'learn'
}

export interface GoalStep {
  id: string;
  description: string;
  completed: boolean;
  timestamp?: number;
  interactions: string[];
}

export interface SessionOutcome {
  success: boolean;
  satisfaction: number; // 0-1
  efficiency: number; // 0-1
  errors: number;
  helpRequests: number;
  taskCompletion: number; // 0-1
}

export interface UsagePattern {
  userId: string;
  pattern: PatternType;
  frequency: number;
  confidence: number; // 0-1
  elements: string[];
  timeOfDay: number[];
  dayOfWeek: number[];
  context: string[];
  trend: PatternTrend;
  lastSeen: number;
}

export enum PatternType {
  FREQUENT_PATH = 'frequent_path',
  PREFERRED_LAYOUT = 'preferred_layout',
  SHORTCUT_USAGE = 'shortcut_usage',
  FEATURE_PREFERENCE = 'feature_preference',
  WORKFLOW_SEQUENCE = 'workflow_sequence',
  ERROR_PATTERN = 'error_pattern',
  HELP_SEEKING = 'help_seeking',
  CUSTOMIZATION = 'customization'
}

export interface PatternTrend {
  direction: TrendDirection;
  strength: number; // 0-1
  stability: number; // 0-1
  recentChange: number; // -1 to 1
}

export enum TrendDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export interface UserPreferences {
  userId: string;
  layout: LayoutPreferences;
  interaction: InteractionPreferences;
  accessibility: AccessibilityPreferences;
  personalization: PersonalizationPreferences;
  privacy: PrivacyPreferences;
  updatedAt: number;
}

export interface LayoutPreferences {
  density: LayoutDensity;
  theme: Theme;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  panelPositions: Record<string, PanelPosition>;
  shortcuts: Record<string, string>;
  hiddenElements: string[];
  pinnedElements: string[];
}

export enum LayoutDensity {
  COMPACT = 'compact',
  COMFORTABLE = 'comfortable',
  SPACIOUS = 'spacious'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
  HIGH_CONTRAST = 'high_contrast'
}

export enum ColorScheme {
  DEFAULT = 'default',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  CUSTOM = 'custom'
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  pinned: boolean;
}

export interface InteractionPreferences {
  clickBehavior: ClickBehavior;
  hoverDelay: number;
  scrollSensitivity: number;
  keyboardShortcuts: boolean;
  animations: boolean;
  tooltips: boolean;
  confirmations: ConfirmationLevel;
}

export enum ClickBehavior {
  SINGLE = 'single',
  DOUBLE = 'double',
  CONTEXT_MENU = 'context_menu'
}

export enum ConfirmationLevel {
  NONE = 'none',
  DESTRUCTIVE_ONLY = 'destructive_only',
  ALL_ACTIONS = 'all_actions'
}

export interface AccessibilityPreferences {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
  colorBlindness: ColorBlindnessType;
  focusIndicator: FocusIndicatorType;
}

export enum ColorBlindnessType {
  NONE = 'none',
  PROTANOPIA = 'protanopia',
  DEUTERANOPIA = 'deuteranopia',
  TRITANOPIA = 'tritanopia',
  ACHROMATOPSIA = 'achromatopsia'
}

export enum FocusIndicatorType {
  DEFAULT = 'default',
  HIGH_VISIBILITY = 'high_visibility',
  CUSTOM = 'custom'
}

export interface PersonalizationPreferences {
  showWelcomeMessages: boolean;
  showTips: boolean;
  showNotifications: boolean;
  autoSave: boolean;
  defaultViews: Record<string, string>;
  favoriteFeatures: string[];
  recentItems: number;
  workspaceLayout: string;
}

export interface PrivacyPreferences {
  trackingEnabled: boolean;
  analyticsEnabled: boolean;
  personalizationEnabled: boolean;
  dataRetention: DataRetentionPeriod;
  shareUsageData: boolean;
}

export enum DataRetentionPeriod {
  ONE_MONTH = '1_month',
  THREE_MONTHS = '3_months',
  SIX_MONTHS = '6_months',
  ONE_YEAR = '1_year',
  INDEFINITE = 'indefinite'
}

export class InteractionTracker {
  private redis: Redis;
  private readonly INTERACTION_PREFIX = 'interaction';
  private readonly SESSION_PREFIX = 'session';
  private readonly PATTERN_PREFIX = 'pattern';
  private readonly PREFERENCES_PREFIX = 'preferences';
  
  private activeSessions: Map<string, UserSession> = new Map();
  private patternAnalysisInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Interaction Tracker');
    
    // Start pattern analysis
    await this.startPatternAnalysis();
    
    logger.info('Interaction Tracker initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Interaction Tracker');
    
    if (this.patternAnalysisInterval) {
      clearInterval(this.patternAnalysisInterval);
    }
    
    // Save active sessions
    await this.saveActiveSessions();
    
    logger.info('Interaction Tracker shutdown complete');
  }

  async trackInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<void> {
    const fullInteraction: UserInteraction = {
      ...interaction,
      id: this.generateInteractionId(),
      timestamp: Date.now()
    };

    // Store interaction
    await this.storeInteraction(fullInteraction);
    
    // Update active session
    await this.updateSession(fullInteraction);
    
    // Update real-time patterns
    await this.updatePatterns(fullInteraction);
    
    logger.debug(`Tracked interaction: ${fullInteraction.type} on ${fullInteraction.element.component}`);
  }

  async startSession(userId: string, deviceInfo: DeviceInfo): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      id: sessionId,
      userId,
      startTime: Date.now(),
      interactions: [],
      pages: [],
      goals: [],
      outcome: {
        success: false,
        satisfaction: 0,
        efficiency: 0,
        errors: 0,
        helpRequests: 0,
        taskCompletion: 0
      }
    };

    this.activeSessions.set(sessionId, session);
    await this.storeSession(session);
    
    logger.info(`Started session ${sessionId} for user ${userId}`);
    return sessionId;
  }

  async endSession(sessionId: string, outcome?: Partial<SessionOutcome>): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    if (outcome) {
      session.outcome = { ...session.outcome, ...outcome };
    }

    await this.storeSession(session);
    this.activeSessions.delete(sessionId);
    
    // Analyze session for patterns
    await this.analyzeSessionPatterns(session);
    
    logger.info(`Ended session ${sessionId}, duration: ${session.duration}ms`);
  }

  async getUserPatterns(userId: string): Promise<UsagePattern[]> {
    const patternKeys = await this.redis.keys(`${this.PATTERN_PREFIX}:${userId}:*`);
    const patterns: UsagePattern[] = [];

    for (const key of patternKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        patterns.push(JSON.parse(data));
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const data = await this.redis.hget(`${this.PREFERENCES_PREFIX}:${userId}`, 'data');
    return data ? JSON.parse(data) : null;
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const existing = await this.getUserPreferences(userId) || this.getDefaultPreferences(userId);
    const updated: UserPreferences = {
      ...existing,
      ...preferences,
      userId,
      updatedAt: Date.now()
    };

    await this.redis.hset(`${this.PREFERENCES_PREFIX}:${userId}`, 'data', JSON.stringify(updated));
    logger.info(`Updated preferences for user ${userId}`);
  }

  async getSessionHistory(userId: string, limit: number = 10): Promise<UserSession[]> {
    const sessionKeys = await this.redis.keys(`${this.SESSION_PREFIX}:${userId}:*`);
    const sessions: UserSession[] = [];

    for (const key of sessionKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        sessions.push(JSON.parse(data));
      }
    }

    return sessions
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  async getInteractionHistory(
    userId: string, 
    timeRange: { start: number; end: number },
    limit: number = 100
  ): Promise<UserInteraction[]> {
    const interactions: UserInteraction[] = [];
    
    // Get interactions from Redis sorted set by timestamp
    const results = await this.redis.zrangebyscore(
      `${this.INTERACTION_PREFIX}:${userId}:timeline`,
      timeRange.start,
      timeRange.end,
      'LIMIT',
      0,
      limit
    );

    for (const interactionId of results) {
      const data = await this.redis.hget(`${this.INTERACTION_PREFIX}:${interactionId}`, 'data');
      if (data) {
        interactions.push(JSON.parse(data));
      }
    }

    return interactions;
  }

  private async storeInteraction(interaction: UserInteraction): Promise<void> {
    // Store interaction data
    await this.redis.hset(
      `${this.INTERACTION_PREFIX}:${interaction.id}`,
      'data',
      JSON.stringify(interaction)
    );

    // Add to user timeline
    await this.redis.zadd(
      `${this.INTERACTION_PREFIX}:${interaction.userId}:timeline`,
      interaction.timestamp,
      interaction.id
    );

    // Set expiration (keep for 90 days)
    await this.redis.expire(`${this.INTERACTION_PREFIX}:${interaction.id}`, 90 * 24 * 60 * 60);
  }

  private async updateSession(interaction: UserInteraction): Promise<void> {
    const session = this.activeSessions.get(interaction.sessionId);
    if (!session) return;

    session.interactions.push(interaction);
    
    // Update page visit if needed
    const currentPage = session.pages.find(p => p.page === interaction.context.page && !p.endTime);
    if (!currentPage) {
      session.pages.push({
        page: interaction.context.page,
        startTime: interaction.timestamp,
        scrollDepth: 0,
        interactions: 1,
        exitType: ExitType.NAVIGATION
      });
    } else {
      currentPage.interactions++;
    }

    await this.storeSession(session);
  }

  private async storeSession(session: UserSession): Promise<void> {
    await this.redis.hset(
      `${this.SESSION_PREFIX}:${session.userId}:${session.id}`,
      'data',
      JSON.stringify(session)
    );

    // Set expiration (keep for 30 days)
    await this.redis.expire(`${this.SESSION_PREFIX}:${session.userId}:${session.id}`, 30 * 24 * 60 * 60);
  }

  private async updatePatterns(interaction: UserInteraction): Promise<void> {
    // Update element usage patterns
    await this.updateElementPattern(interaction);
    
    // Update workflow patterns
    await this.updateWorkflowPattern(interaction);
    
    // Update time-based patterns
    await this.updateTimePattern(interaction);
  }

  private async updateElementPattern(interaction: UserInteraction): Promise<void> {
    const patternKey = `${this.PATTERN_PREFIX}:${interaction.userId}:element:${interaction.element.id}`;
    const existing = await this.redis.hget(patternKey, 'data');
    
    let pattern: UsagePattern;
    if (existing) {
      pattern = JSON.parse(existing);
      pattern.frequency++;
      pattern.lastSeen = interaction.timestamp;
    } else {
      pattern = {
        userId: interaction.userId,
        pattern: PatternType.FEATURE_PREFERENCE,
        frequency: 1,
        confidence: 0.1,
        elements: [interaction.element.id],
        timeOfDay: [new Date(interaction.timestamp).getHours()],
        dayOfWeek: [new Date(interaction.timestamp).getDay()],
        context: [interaction.context.page],
        trend: {
          direction: TrendDirection.STABLE,
          strength: 0.1,
          stability: 0.5,
          recentChange: 0
        },
        lastSeen: interaction.timestamp
      };
    }

    // Update confidence based on frequency
    pattern.confidence = Math.min(1, pattern.frequency / 100);
    
    await this.redis.hset(patternKey, 'data', JSON.stringify(pattern));
  }

  private async updateWorkflowPattern(interaction: UserInteraction): Promise<void> {
    // Track sequences of interactions for workflow patterns
    const recentInteractions = await this.getRecentInteractions(interaction.userId, 5);
    
    if (recentInteractions.length >= 3) {
      const sequence = recentInteractions.map(i => i.element.component).join(' -> ');
      const patternKey = `${this.PATTERN_PREFIX}:${interaction.userId}:workflow:${this.hashString(sequence)}`;
      
      const existing = await this.redis.hget(patternKey, 'data');
      let pattern: UsagePattern;
      
      if (existing) {
        pattern = JSON.parse(existing);
        pattern.frequency++;
      } else {
        pattern = {
          userId: interaction.userId,
          pattern: PatternType.WORKFLOW_SEQUENCE,
          frequency: 1,
          confidence: 0.1,
          elements: recentInteractions.map(i => i.element.id),
          timeOfDay: [new Date(interaction.timestamp).getHours()],
          dayOfWeek: [new Date(interaction.timestamp).getDay()],
          context: [interaction.context.workflow],
          trend: {
            direction: TrendDirection.STABLE,
            strength: 0.1,
            stability: 0.5,
            recentChange: 0
          },
          lastSeen: interaction.timestamp
        };
      }

      pattern.confidence = Math.min(1, pattern.frequency / 50);
      await this.redis.hset(patternKey, 'data', JSON.stringify(pattern));
    }
  }

  private async updateTimePattern(interaction: UserInteraction): Promise<void> {
    const hour = new Date(interaction.timestamp).getHours();
    const day = new Date(interaction.timestamp).getDay();
    
    const patternKey = `${this.PATTERN_PREFIX}:${interaction.userId}:time:${hour}:${day}`;
    const existing = await this.redis.hget(patternKey, 'data');
    
    let pattern: UsagePattern;
    if (existing) {
      pattern = JSON.parse(existing);
      pattern.frequency++;
    } else {
      pattern = {
        userId: interaction.userId,
        pattern: PatternType.FREQUENT_PATH,
        frequency: 1,
        confidence: 0.1,
        elements: [],
        timeOfDay: [hour],
        dayOfWeek: [day],
        context: [interaction.context.page],
        trend: {
          direction: TrendDirection.STABLE,
          strength: 0.1,
          stability: 0.5,
          recentChange: 0
        },
        lastSeen: interaction.timestamp
      };
    }

    pattern.confidence = Math.min(1, pattern.frequency / 200);
    await this.redis.hset(patternKey, 'data', JSON.stringify(pattern));
  }

  private async getRecentInteractions(userId: string, count: number): Promise<UserInteraction[]> {
    const interactionIds = await this.redis.zrevrange(
      `${this.INTERACTION_PREFIX}:${userId}:timeline`,
      0,
      count - 1
    );

    const interactions: UserInteraction[] = [];
    for (const id of interactionIds) {
      const data = await this.redis.hget(`${this.INTERACTION_PREFIX}:${id}`, 'data');
      if (data) {
        interactions.push(JSON.parse(data));
      }
    }

    return interactions;
  }

  private async startPatternAnalysis(): Promise<void> {
    // Run pattern analysis every hour
    this.patternAnalysisInterval = setInterval(async () => {
      try {
        await this.analyzeAllUserPatterns();
      } catch (error) {
        logger.error('Error in pattern analysis:', error);
      }
    }, 60 * 60 * 1000);
  }

  private async analyzeAllUserPatterns(): Promise<void> {
    // Get all users with recent activity
    const userKeys = await this.redis.keys(`${this.INTERACTION_PREFIX}:*:timeline`);
    const users = userKeys.map(key => key.split(':')[1]);

    for (const userId of users) {
      try {
        await this.analyzeUserPatterns(userId);
      } catch (error) {
        logger.error(`Error analyzing patterns for user ${userId}:`, error);
      }
    }
  }

  private async analyzeUserPatterns(userId: string): Promise<void> {
    const patterns = await this.getUserPatterns(userId);
    
    // Analyze pattern trends
    for (const pattern of patterns) {
      const trend = await this.calculatePatternTrend(pattern);
      pattern.trend = trend;
      
      // Update pattern in Redis
      const patternKey = `${this.PATTERN_PREFIX}:${userId}:${pattern.pattern}:${this.hashString(pattern.elements.join(','))}`;
      await this.redis.hset(patternKey, 'data', JSON.stringify(pattern));
    }
  }

  private async calculatePatternTrend(pattern: UsagePattern): Promise<PatternTrend> {
    // Simplified trend calculation
    const recentActivity = pattern.lastSeen > Date.now() - (7 * 24 * 60 * 60 * 1000);
    const direction = recentActivity ? TrendDirection.STABLE : TrendDirection.DECREASING;
    
    return {
      direction,
      strength: pattern.confidence,
      stability: pattern.frequency > 10 ? 0.8 : 0.4,
      recentChange: recentActivity ? 0.1 : -0.1
    };
  }

  private async analyzeSessionPatterns(session: UserSession): Promise<void> {
    // Analyze session for new patterns
    const interactions = session.interactions;
    
    if (interactions.length < 3) return;
    
    // Look for repeated sequences
    const sequences = this.extractSequences(interactions);
    
    for (const sequence of sequences) {
      await this.updateSequencePattern(session.userId, sequence);
    }
  }

  private extractSequences(interactions: UserInteraction[]): string[][] {
    const sequences: string[][] = [];
    
    for (let i = 0; i < interactions.length - 2; i++) {
      const sequence = interactions.slice(i, i + 3).map(interaction => interaction.element.component);
      sequences.push(sequence);
    }
    
    return sequences;
  }

  private async updateSequencePattern(userId: string, sequence: string[]): Promise<void> {
    const sequenceKey = sequence.join(' -> ');
    const patternKey = `${this.PATTERN_PREFIX}:${userId}:sequence:${this.hashString(sequenceKey)}`;
    
    const existing = await this.redis.hget(patternKey, 'data');
    let pattern: UsagePattern;
    
    if (existing) {
      pattern = JSON.parse(existing);
      pattern.frequency++;
    } else {
      pattern = {
        userId,
        pattern: PatternType.WORKFLOW_SEQUENCE,
        frequency: 1,
        confidence: 0.1,
        elements: sequence,
        timeOfDay: [new Date().getHours()],
        dayOfWeek: [new Date().getDay()],
        context: ['sequence'],
        trend: {
          direction: TrendDirection.STABLE,
          strength: 0.1,
          stability: 0.5,
          recentChange: 0
        },
        lastSeen: Date.now()
      };
    }

    pattern.confidence = Math.min(1, pattern.frequency / 20);
    await this.redis.hset(patternKey, 'data', JSON.stringify(pattern));
  }

  private async saveActiveSessions(): Promise<void> {
    for (const [sessionId, session] of this.activeSessions) {
      await this.storeSession(session);
    }
  }

  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      userId,
      layout: {
        density: LayoutDensity.COMFORTABLE,
        theme: Theme.AUTO,
        colorScheme: ColorScheme.DEFAULT,
        fontSize: FontSize.MEDIUM,
        panelPositions: {},
        shortcuts: {},
        hiddenElements: [],
        pinnedElements: []
      },
      interaction: {
        clickBehavior: ClickBehavior.SINGLE,
        hoverDelay: 500,
        scrollSensitivity: 1,
        keyboardShortcuts: true,
        animations: true,
        tooltips: true,
        confirmations: ConfirmationLevel.DESTRUCTIVE_ONLY
      },
      accessibility: {
        screenReader: false,
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        keyboardNavigation: false,
        voiceControl: false,
        colorBlindness: ColorBlindnessType.NONE,
        focusIndicator: FocusIndicatorType.DEFAULT
      },
      personalization: {
        showWelcomeMessages: true,
        showTips: true,
        showNotifications: true,
        autoSave: true,
        defaultViews: {},
        favoriteFeatures: [],
        recentItems: 10,
        workspaceLayout: 'default'
      },
      privacy: {
        trackingEnabled: true,
        analyticsEnabled: true,
        personalizationEnabled: true,
        dataRetention: DataRetentionPeriod.SIX_MONTHS,
        shareUsageData: false
      },
      updatedAt: Date.now()
    };
  }

  private generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}