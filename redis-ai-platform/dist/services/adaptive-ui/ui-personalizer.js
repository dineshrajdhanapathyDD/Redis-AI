"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIPersonalizer = exports.AdaptationType = exports.RecommendationCategory = exports.ImpactLevel = exports.ActionType = exports.RecommendationType = exports.MenuPosition = exports.QuickAccessType = exports.LayoutZone = void 0;
const logger_1 = require("../../utils/logger");
var LayoutZone;
(function (LayoutZone) {
    LayoutZone["HEADER"] = "header";
    LayoutZone["SIDEBAR_LEFT"] = "sidebar_left";
    LayoutZone["SIDEBAR_RIGHT"] = "sidebar_right";
    LayoutZone["MAIN"] = "main";
    LayoutZone["FOOTER"] = "footer";
    LayoutZone["FLOATING"] = "floating";
})(LayoutZone || (exports.LayoutZone = LayoutZone = {}));
var QuickAccessType;
(function (QuickAccessType) {
    QuickAccessType["BUTTON"] = "button";
    QuickAccessType["MENU_ITEM"] = "menu_item";
    QuickAccessType["TOOLBAR_ITEM"] = "toolbar_item";
    QuickAccessType["FLOATING_ACTION"] = "floating_action";
})(QuickAccessType || (exports.QuickAccessType = QuickAccessType = {}));
var MenuPosition;
(function (MenuPosition) {
    MenuPosition["TOP"] = "top";
    MenuPosition["BOTTOM"] = "bottom";
    MenuPosition["LEFT"] = "left";
    MenuPosition["RIGHT"] = "right";
    MenuPosition["CONTEXT"] = "context";
})(MenuPosition || (exports.MenuPosition = MenuPosition = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["LAYOUT_OPTIMIZATION"] = "layout_optimization";
    RecommendationType["SHORTCUT_SUGGESTION"] = "shortcut_suggestion";
    RecommendationType["FEATURE_DISCOVERY"] = "feature_discovery";
    RecommendationType["WORKFLOW_IMPROVEMENT"] = "workflow_improvement";
    RecommendationType["ACCESSIBILITY_ENHANCEMENT"] = "accessibility_enhancement";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var ActionType;
(function (ActionType) {
    ActionType["MOVE_PANEL"] = "move_panel";
    ActionType["HIDE_ELEMENT"] = "hide_element";
    ActionType["ADD_SHORTCUT"] = "add_shortcut";
    ActionType["CHANGE_THEME"] = "change_theme";
    ActionType["RESIZE_ELEMENT"] = "resize_element";
    ActionType["ADD_QUICK_ACCESS"] = "add_quick_access";
})(ActionType || (exports.ActionType = ActionType = {}));
var ImpactLevel;
(function (ImpactLevel) {
    ImpactLevel["LOW"] = "low";
    ImpactLevel["MEDIUM"] = "medium";
    ImpactLevel["HIGH"] = "high";
})(ImpactLevel || (exports.ImpactLevel = ImpactLevel = {}));
var RecommendationCategory;
(function (RecommendationCategory) {
    RecommendationCategory["EFFICIENCY"] = "efficiency";
    RecommendationCategory["ACCESSIBILITY"] = "accessibility";
    RecommendationCategory["AESTHETICS"] = "aesthetics";
    RecommendationCategory["FUNCTIONALITY"] = "functionality";
})(RecommendationCategory || (exports.RecommendationCategory = RecommendationCategory = {}));
var AdaptationType;
(function (AdaptationType) {
    AdaptationType["POSITION_CHANGE"] = "position_change";
    AdaptationType["SIZE_CHANGE"] = "size_change";
    AdaptationType["VISIBILITY_CHANGE"] = "visibility_change";
    AdaptationType["STYLE_CHANGE"] = "style_change";
    AdaptationType["BEHAVIOR_CHANGE"] = "behavior_change";
})(AdaptationType || (exports.AdaptationType = AdaptationType = {}));
class UIPersonalizer {
    redis;
    PERSONALIZATION_PREFIX = 'ui_personalization';
    ADAPTATION_PREFIX = 'ui_adaptation';
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing UI Personalizer');
        logger_1.logger.info('UI Personalizer initialized');
    }
    async shutdown() {
        logger_1.logger.info('UI Personalizer shutdown complete');
    }
    async generatePersonalization(userId, patterns, preferences) {
        const layout = await this.generateLayoutPersonalization(patterns, preferences);
        const shortcuts = await this.generateShortcutPersonalization(patterns);
        const recommendations = await this.generateRecommendations(patterns, preferences);
        const adaptations = await this.generateAdaptations(patterns, preferences);
        const personalization = {
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
    async generateLayoutPersonalization(patterns, preferences) {
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
    optimizePanelLayout(patterns) {
        const arrangements = [];
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
    optimizeElementVisibility(patterns) {
        const hiddenElements = [];
        const pinnedElements = [];
        patterns.forEach(pattern => {
            if (pattern.confidence > 0.8) {
                pinnedElements.push(...pattern.elements);
            }
            else if (pattern.confidence < 0.2) {
                hiddenElements.push(...pattern.elements);
            }
        });
        return { hiddenElements, pinnedElements };
    }
    optimizeElementSizes(patterns) {
        const customSizes = {};
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
    generateThemeConfiguration(preferences) {
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
    async generateShortcutPersonalization(patterns) {
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
    identifyFrequentActions(patterns) {
        const actions = [];
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
    generateCustomShortcuts(actions) {
        const shortcuts = {};
        actions.slice(0, 10).forEach((action, index) => {
            shortcuts[action.actionId] = `Ctrl+${index + 1}`;
        });
        return shortcuts;
    }
    generateQuickAccess(actions) {
        return actions.slice(0, 5).map((action, index) => ({
            id: `quick_${action.actionId}`,
            type: QuickAccessType.TOOLBAR_ITEM,
            label: action.actionId.replace('_', ' '),
            action: action.actionId,
            position: index
        }));
    }
    generateContextualMenus(patterns) {
        const menus = [];
        // Group patterns by context
        const contextGroups = patterns.reduce((groups, pattern) => {
            pattern.context.forEach(context => {
                if (!groups[context])
                    groups[context] = [];
                groups[context].push(pattern);
            });
            return groups;
        }, {});
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
    async generateRecommendations(patterns, preferences) {
        const recommendations = [];
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
    generateLayoutRecommendations(patterns) {
        const recommendations = [];
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
    generateShortcutRecommendations(patterns) {
        const recommendations = [];
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
    generateAccessibilityRecommendations(preferences) {
        const recommendations = [];
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
    async generateAdaptations(patterns, preferences) {
        const adaptations = [];
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
    generateShortcut(actionId) {
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
    async storePersonalization(personalization) {
        await this.redis.hset(`${this.PERSONALIZATION_PREFIX}:${personalization.userId}`, 'data', JSON.stringify(personalization));
    }
}
exports.UIPersonalizer = UIPersonalizer;
//# sourceMappingURL=ui-personalizer.js.map