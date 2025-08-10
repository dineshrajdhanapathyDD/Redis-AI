import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
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

export enum LayoutZone {
  HEADER = 'header',
  SIDEBAR_LEFT = 'sidebar_left',
  SIDEBAR_RIGHT = 'sidebar_right',
  MAIN = 'main',
  FOOTER = 'footer',
  FLOATING = 'floating'
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

export enum QuickAccessType {
  BUTTON = 'button',
  MENU_ITEM = 'menu_item',
  TOOLBAR_ITEM = 'toolbar_item',
  FLOATING_ACTION = 'floating_action'
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

export enum MenuPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  CONTEXT = 'context'
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

export enum RecommendationType {
  LAYOUT_OPTIMIZATION = 'layout_optimization',
  SHORTCUT_SUGGESTION = 'shortcut_suggestion',
  FEATURE_DISCOVERY = 'feature_discovery',
  WORKFLOW_IMPROVEMENT = 'workflow_improvement',
  ACCESSIBILITY_ENHANCEMENT = 'accessibility_enhancement'
}

export interface RecommendationAction {
  type: ActionType;
  parameters: Record<string, any>;
  reversible: boolean;
}

export enum ActionType {
  MOVE_PANEL = 'move_panel',
  HIDE_ELEMENT = 'hide_element',
  ADD_SHORTCUT = 'add_shortcut',
  CHANGE_THEME = 'change_theme',
  RESIZE_ELEMENT = 'resize_element',
  ADD_QUICK_ACCESS = 'add_quick_access'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum RecommendationCategory {
  EFFICIENCY = 'efficiency',
  ACCESSIBILITY = 'accessibility',
  AESTHETICS = 'aesthetics',
  FUNCTIONALITY = 'functionality'
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

export enum AdaptationType {
  POSITION_CHANGE = 'position_change',
  SIZE_CHANGE = 'size_change',
  VISIBILITY_CHANGE = 'visibility_change',
  STYLE_CHANGE = 'style_change',
  BEHAVIOR_CHANGE = 'behavior_change'
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

export class UIPersonalizer {
  private redis: Redis;
  private readonly PERSONALIZATION_PREFIX = 'ui_personalization';
  private readonly ADAPTATION_PREFIX = 'ui_adaptation';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing UI Personalizer');
    logger.info('UI Personalizer initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('UI Personalizer shutdown complete');
  }

  async generatePersonalization(
    userId: string,
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): Promise<UIPersonalization> {
    const layout = await this.generateLayoutPersonalization(patterns, preferences);
    const shortcuts = await this.generateShortcutPersonalization(patterns);
    const recommendations = await this.generateRecommendations(patterns, preferences);
    const adaptations = await this.generateAdaptations(patterns, preferences);

    const personalization: UIPersonalization = {
      userId,
      layout,
      shortcuts,
      recommendations,
      adaptations,
      generatedAt: Date.now()
    };

    await this.storePersonalization(personalization);
    return personalization;
  }

  private async generateLayoutPersonalization(
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): Promise<LayoutPersonalization> {
    // Generate panel arrangements based on usage patterns
    const panelArrangement = this.optimizePanelLayout(patterns);
    
    // Determine elements to hide/show based on usage
    const { hiddenElements, pinnedElements } = this.optimizeElementVisibility(patterns);
    
    // Generate custom sizes based on interaction patterns
    const customSizes = this.optimizeElementSizes(patterns);
    
    // Create theme configuration
    const theme = this.generateThemeConfiguration(preferences);

    return {
      panelArrangement,
      hiddenElements,
      pinnedElements,
      customSizes,
      theme
    };
  }

  private optimizePanelLayout(patterns: UsagePattern[]): PanelArrangement[] {
    const arrangements: PanelArrangement[] = [];
    
    // Find frequently used panels
    const panelPatterns = patterns.filter(p => p.elements.some(e => e.includes('panel')));
    
    panelPatterns.forEach((pattern, index) => {
      arrangements.push({
        panelId: pattern.elements[0],
        position: {
          x: index * 300,
          y: 0,
          zone: index === 0 ? LayoutZone.SIDEBAR_LEFT : LayoutZone.MAIN
        },
        size: {
          width: 300,
          height: 400
        },
        collapsed: pattern.frequency < 10,
        priority: pattern.confidence
      });
    });

    return arrangements;
  }

  private optimizeElementVisibility(patterns: UsagePattern[]): {
    hiddenElements: string[];
    pinnedElements: string[];
  } {
    const hiddenElements: string[] = [];
    const pinnedElements: string[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.8) {
        pinnedElements.push(...pattern.elements);
      } else if (pattern.confidence < 0.2) {
        hiddenElements.push(...pattern.elements);
      }
    });

    return { hiddenElements, pinnedElements };
  }

  private optimizeElementSizes(patterns: UsagePattern[]): Record<string, ElementSize> {
    const customSizes: Record<string, ElementSize> = {};
    
    patterns.forEach(pattern => {
      if (pattern.frequency > 50) {
        pattern.elements.forEach(element => {
          customSizes[element] = {
            width: 250,
            height: 200,
            minWidth: 200,
            minHeight: 150
          };
        });
      }
    });

    return customSizes;
  }

  private generateThemeConfiguration(preferences: UserPreferences): ThemeConfiguration {
    return {
      primaryColor: preferences.layout.colorScheme === 'blue' ? '#0066cc' : '#6366f1',
      secondaryColor: '#64748b',
      backgroundColor: preferences.layout.theme === 'dark' ? '#1e293b' : '#ffffff',
      textColor: preferences.layout.theme === 'dark' ? '#f1f5f9' : '#1e293b',
      accentColor: '#f59e0b',
      borderRadius: 8,
      spacing: preferences.layout.density === 'compact' ? 4 : 8,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: preferences.layout.fontSize === 'large' ? 16 : 14
    };
  }

  private async generateShortcutPersonalization(patterns: UsagePattern[]): Promise<ShortcutPersonalization> {
    const frequentActions = this.identifyFrequentActions(patterns);
    const customShortcuts = this.generateCustomShortcuts(frequentActions);
    const quickAccess = this.generateQuickAccess(frequentActions);
    const contextualMenus = this.generateContextualMenus(patterns);

    return {
      customShortcuts,
      frequentActions,
      quickAccess,
      contextualMenus
    };
  }

  private identifyFrequentActions(patterns: UsagePattern[]): FrequentAction[] {
    const actions: FrequentAction[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.frequency > 20) {
        actions.push({
          actionId: pattern.elements[0],
          frequency: pattern.frequency,
          lastUsed: pattern.lastSeen,
          context: pattern.context,
          shortcut: this.generateShortcut(pattern.elements[0])
        });
      }
    });

    return actions.sort((a, b) => b.frequency - a.frequency);
  }

  private generateCustomShortcuts(actions: FrequentAction[]): Record<string, string> {
    const shortcuts: Record<string, string> = {};
    
    actions.slice(0, 10).forEach((action, index) => {
      shortcuts[action.actionId] = `Ctrl+${index + 1}`;
    });

    return shortcuts;
  }

  private generateQuickAccess(actions: FrequentAction[]): QuickAccessItem[] {
    return actions.slice(0, 5).map((action, index) => ({
      id: `quick_${action.actionId}`,
      type: QuickAccessType.TOOLBAR_ITEM,
      label: action.actionId.replace('_', ' '),
      action: action.actionId,
      position: index
    }));
  }

  private generateContextualMenus(patterns: UsagePattern[]): ContextualMenu[] {
    const menus: ContextualMenu[] = [];
    
    // Group patterns by context
    const contextGroups = patterns.reduce((groups, pattern) => {
      pattern.context.forEach(context => {
        if (!groups[context]) groups[context] = [];
        groups[context].push(pattern);
      });
      return groups;
    }, {} as Record<string, UsagePattern[]>);

    Object.entries(contextGroups).forEach(([context, contextPatterns]) => {
      const items = contextPatterns.slice(0, 5).map(pattern => ({
        id: pattern.elements[0],
        label: pattern.elements[0].replace('_', ' '),
        action: pattern.elements[0],
        frequency: pattern.frequency
      }));

      menus.push({
        context,
        items,
        position: MenuPosition.CONTEXT
      });
    });

    return menus;
  }

  private async generateRecommendations(
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): Promise<UIRecommendation[]> {
    const recommendations: UIRecommendation[] = [];

    // Layout optimization recommendations
    const layoutRecs = this.generateLayoutRecommendations(patterns);
    recommendations.push(...layoutRecs);

    // Shortcut suggestions
    const shortcutRecs = this.generateShortcutRecommendations(patterns);
    recommendations.push(...shortcutRecs);

    // Accessibility recommendations
    const accessibilityRecs = this.generateAccessibilityRecommendations(preferences);
    recommendations.push(...accessibilityRecs);

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private generateLayoutRecommendations(patterns: UsagePattern[]): UIRecommendation[] {
    const recommendations: UIRecommendation[] = [];
    
    // Find underused panels
    const underusedPanels = patterns.filter(p => p.frequency < 5 && p.elements.some(e => e.includes('panel')));
    
    underusedPanels.forEach(pattern => {
      recommendations.push({
        id: `hide_${pattern.elements[0]}`,
        type: RecommendationType.LAYOUT_OPTIMIZATION,
        title: 'Hide Unused Panel',
        description: `Consider hiding ${pattern.elements[0]} as it's rarely used`,
        action: {
          type: ActionType.HIDE_ELEMENT,
          parameters: { elementId: pattern.elements[0] },
          reversible: true
        },
        confidence: 1 - pattern.confidence,
        impact: ImpactLevel.LOW,
        category: RecommendationCategory.EFFICIENCY
      });
    });

    return recommendations;
  }

  private generateShortcutRecommendations(patterns: UsagePattern[]): UIRecommendation[] {
    const recommendations: UIRecommendation[] = [];
    
    const frequentActions = patterns.filter(p => p.frequency > 30);
    
    frequentActions.forEach(pattern => {
      recommendations.push({
        id: `shortcut_${pattern.elements[0]}`,
        type: RecommendationType.SHORTCUT_SUGGESTION,
        title: 'Add Keyboard Shortcut',
        description: `Add a shortcut for ${pattern.elements[0]} (used ${pattern.frequency} times)`,
        action: {
          type: ActionType.ADD_SHORTCUT,
          parameters: { 
            actionId: pattern.elements[0],
            shortcut: this.generateShortcut(pattern.elements[0])
          },
          reversible: true
        },
        confidence: pattern.confidence,
        impact: ImpactLevel.MEDIUM,
        category: RecommendationCategory.EFFICIENCY
      });
    });

    return recommendations;
  }

  private generateAccessibilityRecommendations(preferences: UserPreferences): UIRecommendation[] {
    const recommendations: UIRecommendation[] = [];
    
    if (!preferences.accessibility.highContrast && preferences.layout.theme === 'light') {
      recommendations.push({
        id: 'high_contrast_suggestion',
        type: RecommendationType.ACCESSIBILITY_ENHANCEMENT,
        title: 'Enable High Contrast',
        description: 'High contrast mode can improve readability',
        action: {
          type: ActionType.CHANGE_THEME,
          parameters: { highContrast: true },
          reversible: true
        },
        confidence: 0.6,
        impact: ImpactLevel.MEDIUM,
        category: RecommendationCategory.ACCESSIBILITY
      });
    }

    return recommendations;
  }

  private async generateAdaptations(
    patterns: UsagePattern[],
    preferences: UserPreferences
  ): Promise<UIAdaptation[]> {
    const adaptations: UIAdaptation[] = [];
    
    // Generate position adaptations based on usage patterns
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.7) {
        adaptations.push({
          id: `adapt_${pattern.elements[0]}`,
          type: AdaptationType.POSITION_CHANGE,
          element: pattern.elements[0],
          change: {
            property: 'position',
            oldValue: 'default',
            newValue: 'prominent',
            transition: {
              duration: 300,
              easing: 'ease-in-out'
            }
          },
          reason: `High usage frequency (${pattern.frequency})`,
          confidence: pattern.confidence,
          appliedAt: Date.now()
        });
      }
    });

    return adaptations;
  }

  private generateShortcut(actionId: string): string {
    // Simple shortcut generation based on action name
    const shortcuts = {
      'search': 'Ctrl+F',
      'save': 'Ctrl+S',
      'copy': 'Ctrl+C',
      'paste': 'Ctrl+V',
      'undo': 'Ctrl+Z',
      'redo': 'Ctrl+Y'
    };

    return shortcuts[actionId] || `Ctrl+Shift+${actionId.charAt(0).toUpperCase()}`;
  }

  private async storePersonalization(personalization: UIPersonalization): Promise<void> {
    await this.redis.hset(
      `${this.PERSONALIZATION_PREFIX}:${personalization.userId}`,
      'data',
      JSON.stringify(personalization)
    );
  }
}