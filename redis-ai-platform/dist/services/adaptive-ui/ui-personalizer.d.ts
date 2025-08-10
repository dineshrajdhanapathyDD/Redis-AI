import { Redis } from 'ioredis';
import { UsagePattern, UserPreferences } from './interaction-tracker';
export interface UIPersonalization {
    userId: string;
    layout: LayoutPersonalization;
    shortcuts: ShortcutPersonalization;
    recommendations: UIRecommendation[];
    adaptations: UIAdaptation[];
    generatedAt: number;
}
export interface LayoutPersonalization {
    panelArrangement: PanelArrangement[];
    hiddenElements: string[];
    pinnedElements: string[];
    customSizes: Record<string, ElementSize>;
    theme: ThemeConfiguration;
}
export interface PanelArrangement {
    panelId: string;
    position: Position;
    size: ElementSize;
    collapsed: boolean;
    priority: number;
}
export interface Position {
    x: number;
    y: number;
    zone: LayoutZone;
}
export declare enum LayoutZone {
    HEADER = "header",
    SIDEBAR_LEFT = "sidebar_left",
    SIDEBAR_RIGHT = "sidebar_right",
    MAIN = "main",
    FOOTER = "footer",
    FLOATING = "floating"
}
export interface ElementSize {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}
export interface ThemeConfiguration {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    borderRadius: number;
    spacing: number;
    fontFamily: string;
    fontSize: number;
}
export interface ShortcutPersonalization {
    customShortcuts: Record<string, string>;
    frequentActions: FrequentAction[];
    quickAccess: QuickAccessItem[];
    contextualMenus: ContextualMenu[];
}
export interface FrequentAction {
    actionId: string;
    frequency: number;
    lastUsed: number;
    context: string[];
    shortcut?: string;
}
export interface QuickAccessItem {
    id: string;
    type: QuickAccessType;
    label: string;
    action: string;
    icon?: string;
    position: number;
}
export declare enum QuickAccessType {
    BUTTON = "button",
    MENU_ITEM = "menu_item",
    TOOLBAR_ITEM = "toolbar_item",
    FLOATING_ACTION = "floating_action"
}
export interface ContextualMenu {
    context: string;
    items: ContextualMenuItem[];
    position: MenuPosition;
}
export interface ContextualMenuItem {
    id: string;
    label: string;
    action: string;
    icon?: string;
    shortcut?: string;
    frequency: number;
}
export declare enum MenuPosition {
    TOP = "top",
    BOTTOM = "bottom",
    LEFT = "left",
    RIGHT = "right",
    CONTEXT = "context"
}
export interface UIRecommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    action: RecommendationAction;
    confidence: number;
    impact: ImpactLevel;
    category: RecommendationCategory;
}
export declare enum RecommendationType {
    LAYOUT_OPTIMIZATION = "layout_optimization",
    SHORTCUT_SUGGESTION = "shortcut_suggestion",
    FEATURE_DISCOVERY = "feature_discovery",
    WORKFLOW_IMPROVEMENT = "workflow_improvement",
    ACCESSIBILITY_ENHANCEMENT = "accessibility_enhancement"
}
export interface RecommendationAction {
    type: ActionType;
    parameters: Record<string, any>;
    reversible: boolean;
}
export declare enum ActionType {
    MOVE_PANEL = "move_panel",
    HIDE_ELEMENT = "hide_element",
    ADD_SHORTCUT = "add_shortcut",
    CHANGE_THEME = "change_theme",
    RESIZE_ELEMENT = "resize_element",
    ADD_QUICK_ACCESS = "add_quick_access"
}
export declare enum ImpactLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare enum RecommendationCategory {
    EFFICIENCY = "efficiency",
    ACCESSIBILITY = "accessibility",
    AESTHETICS = "aesthetics",
    FUNCTIONALITY = "functionality"
}
export interface UIAdaptation {
    id: string;
    type: AdaptationType;
    element: string;
    change: AdaptationChange;
    reason: string;
    confidence: number;
    appliedAt: number;
    reverted?: boolean;
}
export declare enum AdaptationType {
    POSITION_CHANGE = "position_change",
    SIZE_CHANGE = "size_change",
    VISIBILITY_CHANGE = "visibility_change",
    STYLE_CHANGE = "style_change",
    BEHAVIOR_CHANGE = "behavior_change"
}
export interface AdaptationChange {
    property: string;
    oldValue: any;
    newValue: any;
    transition?: TransitionConfig;
}
export interface TransitionConfig {
    duration: number;
    easing: string;
    delay?: number;
}
export declare class UIPersonalizer {
    private redis;
    private readonly PERSONALIZATION_PREFIX;
    private readonly ADAPTATION_PREFIX;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    generatePersonalization(userId: string, patterns: UsagePattern[], preferences: UserPreferences): Promise<UIPersonalization>;
    private generateLayoutPersonalization;
    private optimizePanelLayout;
    private optimizeElementVisibility;
    private optimizeElementSizes;
    private generateThemeConfiguration;
    private generateShortcutPersonalization;
    private identifyFrequentActions;
    private generateCustomShortcuts;
    private generateQuickAccess;
    private generateContextualMenus;
    private generateRecommendations;
    private generateLayoutRecommendations;
    private generateShortcutRecommendations;
    private generateAccessibilityRecommendations;
    private generateAdaptations;
    private generateShortcut;
    private storePersonalization;
}
//# sourceMappingURL=ui-personalizer.d.ts.map