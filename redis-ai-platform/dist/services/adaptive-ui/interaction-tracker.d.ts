import { Redis } from 'ioredis';
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
export declare enum InteractionType {
    CLICK = "click",
    HOVER = "hover",
    SCROLL = "scroll",
    KEYBOARD = "keyboard",
    DRAG = "drag",
    RESIZE = "resize",
    FOCUS = "focus",
    BLUR = "blur",
    SEARCH = "search",
    NAVIGATION = "navigation",
    FORM_SUBMIT = "form_submit",
    MODAL_OPEN = "modal_open",
    MODAL_CLOSE = "modal_close",
    TAB_SWITCH = "tab_switch",
    MENU_OPEN = "menu_open"
}
export interface UIElement {
    id: string;
    type: ElementType;
    component: string;
    position: ElementPosition;
    properties: ElementProperties;
}
export declare enum ElementType {
    BUTTON = "button",
    LINK = "link",
    INPUT = "input",
    DROPDOWN = "dropdown",
    MODAL = "modal",
    TAB = "tab",
    MENU = "menu",
    PANEL = "panel",
    CARD = "card",
    LIST_ITEM = "list_item",
    ICON = "icon",
    TEXT = "text",
    IMAGE = "image",
    CHART = "chart",
    TABLE = "table"
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
export declare enum DeviceType {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE = "mobile"
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
export declare enum CompletionStatus {
    COMPLETED = "completed",
    ABANDONED = "abandoned",
    ERROR = "error",
    TIMEOUT = "timeout"
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
export declare enum ExitType {
    NAVIGATION = "navigation",
    CLOSE = "close",
    TIMEOUT = "timeout",
    ERROR = "error"
}
export interface SessionGoal {
    id: string;
    type: GoalType;
    description: string;
    completed: boolean;
    completionTime?: number;
    steps: GoalStep[];
}
export declare enum GoalType {
    SEARCH = "search",
    CREATE = "create",
    EDIT = "edit",
    DELETE = "delete",
    ANALYZE = "analyze",
    CONFIGURE = "configure",
    LEARN = "learn"
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
    satisfaction: number;
    efficiency: number;
    errors: number;
    helpRequests: number;
    taskCompletion: number;
}
export interface UsagePattern {
    userId: string;
    pattern: PatternType;
    frequency: number;
    confidence: number;
    elements: string[];
    timeOfDay: number[];
    dayOfWeek: number[];
    context: string[];
    trend: PatternTrend;
    lastSeen: number;
}
export declare enum PatternType {
    FREQUENT_PATH = "frequent_path",
    PREFERRED_LAYOUT = "preferred_layout",
    SHORTCUT_USAGE = "shortcut_usage",
    FEATURE_PREFERENCE = "feature_preference",
    WORKFLOW_SEQUENCE = "workflow_sequence",
    ERROR_PATTERN = "error_pattern",
    HELP_SEEKING = "help_seeking",
    CUSTOMIZATION = "customization"
}
export interface PatternTrend {
    direction: TrendDirection;
    strength: number;
    stability: number;
    recentChange: number;
}
export declare enum TrendDirection {
    INCREASING = "increasing",
    DECREASING = "decreasing",
    STABLE = "stable",
    VOLATILE = "volatile"
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
export declare enum LayoutDensity {
    COMPACT = "compact",
    COMFORTABLE = "comfortable",
    SPACIOUS = "spacious"
}
export declare enum Theme {
    LIGHT = "light",
    DARK = "dark",
    AUTO = "auto",
    HIGH_CONTRAST = "high_contrast"
}
export declare enum ColorScheme {
    DEFAULT = "default",
    BLUE = "blue",
    GREEN = "green",
    PURPLE = "purple",
    CUSTOM = "custom"
}
export declare enum FontSize {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    EXTRA_LARGE = "extra_large"
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
export declare enum ClickBehavior {
    SINGLE = "single",
    DOUBLE = "double",
    CONTEXT_MENU = "context_menu"
}
export declare enum ConfirmationLevel {
    NONE = "none",
    DESTRUCTIVE_ONLY = "destructive_only",
    ALL_ACTIONS = "all_actions"
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
export declare enum ColorBlindnessType {
    NONE = "none",
    PROTANOPIA = "protanopia",
    DEUTERANOPIA = "deuteranopia",
    TRITANOPIA = "tritanopia",
    ACHROMATOPSIA = "achromatopsia"
}
export declare enum FocusIndicatorType {
    DEFAULT = "default",
    HIGH_VISIBILITY = "high_visibility",
    CUSTOM = "custom"
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
export declare enum DataRetentionPeriod {
    ONE_MONTH = "1_month",
    THREE_MONTHS = "3_months",
    SIX_MONTHS = "6_months",
    ONE_YEAR = "1_year",
    INDEFINITE = "indefinite"
}
export declare class InteractionTracker {
    private redis;
    private readonly INTERACTION_PREFIX;
    private readonly SESSION_PREFIX;
    private readonly PATTERN_PREFIX;
    private readonly PREFERENCES_PREFIX;
    private activeSessions;
    private patternAnalysisInterval?;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    trackInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<void>;
    startSession(userId: string, deviceInfo: DeviceInfo): Promise<string>;
    endSession(sessionId: string, outcome?: Partial<SessionOutcome>): Promise<void>;
    getUserPatterns(userId: string): Promise<UsagePattern[]>;
    getUserPreferences(userId: string): Promise<UserPreferences | null>;
    updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void>;
    getSessionHistory(userId: string, limit?: number): Promise<UserSession[]>;
    getInteractionHistory(userId: string, timeRange: {
        start: number;
        end: number;
    }, limit?: number): Promise<UserInteraction[]>;
    private storeInteraction;
    private updateSession;
    private storeSession;
    private updatePatterns;
    private updateElementPattern;
    private updateWorkflowPattern;
    private updateTimePattern;
    private getRecentInteractions;
    private startPatternAnalysis;
    private analyzeAllUserPatterns;
    private analyzeUserPatterns;
    private calculatePatternTrend;
    private analyzeSessionPatterns;
    private extractSequences;
    private updateSequencePattern;
    private saveActiveSessions;
    private getDefaultPreferences;
    private generateInteractionId;
    private generateSessionId;
    private hashString;
}
//# sourceMappingURL=interaction-tracker.d.ts.map