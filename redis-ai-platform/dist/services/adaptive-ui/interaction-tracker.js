"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionTracker = exports.DataRetentionPeriod = exports.FocusIndicatorType = exports.ColorBlindnessType = exports.ConfirmationLevel = exports.ClickBehavior = exports.FontSize = exports.ColorScheme = exports.Theme = exports.LayoutDensity = exports.TrendDirection = exports.PatternType = exports.GoalType = exports.ExitType = exports.CompletionStatus = exports.DeviceType = exports.ElementType = exports.InteractionType = void 0;
const logger_1 = require("../../utils/logger");
var InteractionType;
(function (InteractionType) {
    InteractionType["CLICK"] = "click";
    InteractionType["HOVER"] = "hover";
    InteractionType["SCROLL"] = "scroll";
    InteractionType["KEYBOARD"] = "keyboard";
    InteractionType["DRAG"] = "drag";
    InteractionType["RESIZE"] = "resize";
    InteractionType["FOCUS"] = "focus";
    InteractionType["BLUR"] = "blur";
    InteractionType["SEARCH"] = "search";
    InteractionType["NAVIGATION"] = "navigation";
    InteractionType["FORM_SUBMIT"] = "form_submit";
    InteractionType["MODAL_OPEN"] = "modal_open";
    InteractionType["MODAL_CLOSE"] = "modal_close";
    InteractionType["TAB_SWITCH"] = "tab_switch";
    InteractionType["MENU_OPEN"] = "menu_open";
})(InteractionType || (exports.InteractionType = InteractionType = {}));
var ElementType;
(function (ElementType) {
    ElementType["BUTTON"] = "button";
    ElementType["LINK"] = "link";
    ElementType["INPUT"] = "input";
    ElementType["DROPDOWN"] = "dropdown";
    ElementType["MODAL"] = "modal";
    ElementType["TAB"] = "tab";
    ElementType["MENU"] = "menu";
    ElementType["PANEL"] = "panel";
    ElementType["CARD"] = "card";
    ElementType["LIST_ITEM"] = "list_item";
    ElementType["ICON"] = "icon";
    ElementType["TEXT"] = "text";
    ElementType["IMAGE"] = "image";
    ElementType["CHART"] = "chart";
    ElementType["TABLE"] = "table";
})(ElementType || (exports.ElementType = ElementType = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["DESKTOP"] = "desktop";
    DeviceType["TABLET"] = "tablet";
    DeviceType["MOBILE"] = "mobile";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var CompletionStatus;
(function (CompletionStatus) {
    CompletionStatus["COMPLETED"] = "completed";
    CompletionStatus["ABANDONED"] = "abandoned";
    CompletionStatus["ERROR"] = "error";
    CompletionStatus["TIMEOUT"] = "timeout";
})(CompletionStatus || (exports.CompletionStatus = CompletionStatus = {}));
var ExitType;
(function (ExitType) {
    ExitType["NAVIGATION"] = "navigation";
    ExitType["CLOSE"] = "close";
    ExitType["TIMEOUT"] = "timeout";
    ExitType["ERROR"] = "error";
})(ExitType || (exports.ExitType = ExitType = {}));
var GoalType;
(function (GoalType) {
    GoalType["SEARCH"] = "search";
    GoalType["CREATE"] = "create";
    GoalType["EDIT"] = "edit";
    GoalType["DELETE"] = "delete";
    GoalType["ANALYZE"] = "analyze";
    GoalType["CONFIGURE"] = "configure";
    GoalType["LEARN"] = "learn";
})(GoalType || (exports.GoalType = GoalType = {}));
var PatternType;
(function (PatternType) {
    PatternType["FREQUENT_PATH"] = "frequent_path";
    PatternType["PREFERRED_LAYOUT"] = "preferred_layout";
    PatternType["SHORTCUT_USAGE"] = "shortcut_usage";
    PatternType["FEATURE_PREFERENCE"] = "feature_preference";
    PatternType["WORKFLOW_SEQUENCE"] = "workflow_sequence";
    PatternType["ERROR_PATTERN"] = "error_pattern";
    PatternType["HELP_SEEKING"] = "help_seeking";
    PatternType["CUSTOMIZATION"] = "customization";
})(PatternType || (exports.PatternType = PatternType = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["INCREASING"] = "increasing";
    TrendDirection["DECREASING"] = "decreasing";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["VOLATILE"] = "volatile";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var LayoutDensity;
(function (LayoutDensity) {
    LayoutDensity["COMPACT"] = "compact";
    LayoutDensity["COMFORTABLE"] = "comfortable";
    LayoutDensity["SPACIOUS"] = "spacious";
})(LayoutDensity || (exports.LayoutDensity = LayoutDensity = {}));
var Theme;
(function (Theme) {
    Theme["LIGHT"] = "light";
    Theme["DARK"] = "dark";
    Theme["AUTO"] = "auto";
    Theme["HIGH_CONTRAST"] = "high_contrast";
})(Theme || (exports.Theme = Theme = {}));
var ColorScheme;
(function (ColorScheme) {
    ColorScheme["DEFAULT"] = "default";
    ColorScheme["BLUE"] = "blue";
    ColorScheme["GREEN"] = "green";
    ColorScheme["PURPLE"] = "purple";
    ColorScheme["CUSTOM"] = "custom";
})(ColorScheme || (exports.ColorScheme = ColorScheme = {}));
var FontSize;
(function (FontSize) {
    FontSize["SMALL"] = "small";
    FontSize["MEDIUM"] = "medium";
    FontSize["LARGE"] = "large";
    FontSize["EXTRA_LARGE"] = "extra_large";
})(FontSize || (exports.FontSize = FontSize = {}));
var ClickBehavior;
(function (ClickBehavior) {
    ClickBehavior["SINGLE"] = "single";
    ClickBehavior["DOUBLE"] = "double";
    ClickBehavior["CONTEXT_MENU"] = "context_menu";
})(ClickBehavior || (exports.ClickBehavior = ClickBehavior = {}));
var ConfirmationLevel;
(function (ConfirmationLevel) {
    ConfirmationLevel["NONE"] = "none";
    ConfirmationLevel["DESTRUCTIVE_ONLY"] = "destructive_only";
    ConfirmationLevel["ALL_ACTIONS"] = "all_actions";
})(ConfirmationLevel || (exports.ConfirmationLevel = ConfirmationLevel = {}));
var ColorBlindnessType;
(function (ColorBlindnessType) {
    ColorBlindnessType["NONE"] = "none";
    ColorBlindnessType["PROTANOPIA"] = "protanopia";
    ColorBlindnessType["DEUTERANOPIA"] = "deuteranopia";
    ColorBlindnessType["TRITANOPIA"] = "tritanopia";
    ColorBlindnessType["ACHROMATOPSIA"] = "achromatopsia";
})(ColorBlindnessType || (exports.ColorBlindnessType = ColorBlindnessType = {}));
var FocusIndicatorType;
(function (FocusIndicatorType) {
    FocusIndicatorType["DEFAULT"] = "default";
    FocusIndicatorType["HIGH_VISIBILITY"] = "high_visibility";
    FocusIndicatorType["CUSTOM"] = "custom";
})(FocusIndicatorType || (exports.FocusIndicatorType = FocusIndicatorType = {}));
var DataRetentionPeriod;
(function (DataRetentionPeriod) {
    DataRetentionPeriod["ONE_MONTH"] = "1_month";
    DataRetentionPeriod["THREE_MONTHS"] = "3_months";
    DataRetentionPeriod["SIX_MONTHS"] = "6_months";
    DataRetentionPeriod["ONE_YEAR"] = "1_year";
    DataRetentionPeriod["INDEFINITE"] = "indefinite";
})(DataRetentionPeriod || (exports.DataRetentionPeriod = DataRetentionPeriod = {}));
class InteractionTracker {
    redis;
    INTERACTION_PREFIX = 'interaction';
    SESSION_PREFIX = 'session';
    PATTERN_PREFIX = 'pattern';
    PREFERENCES_PREFIX = 'preferences';
    activeSessions = new Map();
    patternAnalysisInterval;
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Interaction Tracker');
        // Start pattern analysis
        await this.startPatternAnalysis();
        logger_1.logger.info('Interaction Tracker initialized');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Interaction Tracker');
        if (this.patternAnalysisInterval) {
            clearInterval(this.patternAnalysisInterval);
        }
        // Save active sessions
        await this.saveActiveSessions();
        logger_1.logger.info('Interaction Tracker shutdown complete');
    }
    async trackInteraction(interaction) {
        const fullInteraction = {
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
        logger_1.logger.debug(`Tracked interaction: ${fullInteraction.type} on ${fullInteraction.element.component}`);
    }
    async startSession(userId, deviceInfo) {
        const sessionId = this.generateSessionId();
        const session = {
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
        logger_1.logger.info(`Started session ${sessionId} for user ${userId}`);
        return sessionId;
    }
    async endSession(sessionId, outcome) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            logger_1.logger.warn(`Session not found: ${sessionId}`);
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
        logger_1.logger.info(`Ended session ${sessionId}, duration: ${session.duration}ms`);
    }
    async getUserPatterns(userId) {
        const patternKeys = await this.redis.keys(`${this.PATTERN_PREFIX}:${userId}:*`);
        const patterns = [];
        for (const key of patternKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                patterns.push(JSON.parse(data));
            }
        }
        return patterns.sort((a, b) => b.confidence - a.confidence);
    }
    async getUserPreferences(userId) {
        const data = await this.redis.hget(`${this.PREFERENCES_PREFIX}:${userId}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async updateUserPreferences(userId, preferences) {
        const existing = await this.getUserPreferences(userId) || this.getDefaultPreferences(userId);
        const updated = {
            ...existing,
            ...preferences,
            userId,
            updatedAt: Date.now()
        };
        await this.redis.hset(`${this.PREFERENCES_PREFIX}:${userId}`, 'data', JSON.stringify(updated));
        logger_1.logger.info(`Updated preferences for user ${userId}`);
    }
    async getSessionHistory(userId, limit = 10) {
        const sessionKeys = await this.redis.keys(`${this.SESSION_PREFIX}:${userId}:*`);
        const sessions = [];
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
    async getInteractionHistory(userId, timeRange, limit = 100) {
        const interactions = [];
        // Get interactions from Redis sorted set by timestamp
        const results = await this.redis.zrangebyscore(`${this.INTERACTION_PREFIX}:${userId}:timeline`, timeRange.start, timeRange.end, 'LIMIT', 0, limit);
        for (const interactionId of results) {
            const data = await this.redis.hget(`${this.INTERACTION_PREFIX}:${interactionId}`, 'data');
            if (data) {
                interactions.push(JSON.parse(data));
            }
        }
        return interactions;
    }
    async storeInteraction(interaction) {
        // Store interaction data
        await this.redis.hset(`${this.INTERACTION_PREFIX}:${interaction.id}`, 'data', JSON.stringify(interaction));
        // Add to user timeline
        await this.redis.zadd(`${this.INTERACTION_PREFIX}:${interaction.userId}:timeline`, interaction.timestamp, interaction.id);
        // Set expiration (keep for 90 days)
        await this.redis.expire(`${this.INTERACTION_PREFIX}:${interaction.id}`, 90 * 24 * 60 * 60);
    }
    async updateSession(interaction) {
        const session = this.activeSessions.get(interaction.sessionId);
        if (!session)
            return;
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
        }
        else {
            currentPage.interactions++;
        }
        await this.storeSession(session);
    }
    async storeSession(session) {
        await this.redis.hset(`${this.SESSION_PREFIX}:${session.userId}:${session.id}`, 'data', JSON.stringify(session));
        // Set expiration (keep for 30 days)
        await this.redis.expire(`${this.SESSION_PREFIX}:${session.userId}:${session.id}`, 30 * 24 * 60 * 60);
    }
    async updatePatterns(interaction) {
        // Update element usage patterns
        await this.updateElementPattern(interaction);
        // Update workflow patterns
        await this.updateWorkflowPattern(interaction);
        // Update time-based patterns
        await this.updateTimePattern(interaction);
    }
    async updateElementPattern(interaction) {
        const patternKey = `${this.PATTERN_PREFIX}:${interaction.userId}:element:${interaction.element.id}`;
        const existing = await this.redis.hget(patternKey, 'data');
        let pattern;
        if (existing) {
            pattern = JSON.parse(existing);
            pattern.frequency++;
            pattern.lastSeen = interaction.timestamp;
        }
        else {
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
    async updateWorkflowPattern(interaction) {
        // Track sequences of interactions for workflow patterns
        const recentInteractions = await this.getRecentInteractions(interaction.userId, 5);
        if (recentInteractions.length >= 3) {
            const sequence = recentInteractions.map(i => i.element.component).join(' -> ');
            const patternKey = `${this.PATTERN_PREFIX}:${interaction.userId}:workflow:${this.hashString(sequence)}`;
            const existing = await this.redis.hget(patternKey, 'data');
            let pattern;
            if (existing) {
                pattern = JSON.parse(existing);
                pattern.frequency++;
            }
            else {
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
    async updateTimePattern(interaction) {
        const hour = new Date(interaction.timestamp).getHours();
        const day = new Date(interaction.timestamp).getDay();
        const patternKey = `${this.PATTERN_PREFIX}:${interaction.userId}:time:${hour}:${day}`;
        const existing = await this.redis.hget(patternKey, 'data');
        let pattern;
        if (existing) {
            pattern = JSON.parse(existing);
            pattern.frequency++;
        }
        else {
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
    async getRecentInteractions(userId, count) {
        const interactionIds = await this.redis.zrevrange(`${this.INTERACTION_PREFIX}:${userId}:timeline`, 0, count - 1);
        const interactions = [];
        for (const id of interactionIds) {
            const data = await this.redis.hget(`${this.INTERACTION_PREFIX}:${id}`, 'data');
            if (data) {
                interactions.push(JSON.parse(data));
            }
        }
        return interactions;
    }
    async startPatternAnalysis() {
        // Run pattern analysis every hour
        this.patternAnalysisInterval = setInterval(async () => {
            try {
                await this.analyzeAllUserPatterns();
            }
            catch (error) {
                logger_1.logger.error('Error in pattern analysis:', error);
            }
        }, 60 * 60 * 1000);
    }
    async analyzeAllUserPatterns() {
        // Get all users with recent activity
        const userKeys = await this.redis.keys(`${this.INTERACTION_PREFIX}:*:timeline`);
        const users = userKeys.map(key => key.split(':')[1]);
        for (const userId of users) {
            try {
                await this.analyzeUserPatterns(userId);
            }
            catch (error) {
                logger_1.logger.error(`Error analyzing patterns for user ${userId}:`, error);
            }
        }
    }
    async analyzeUserPatterns(userId) {
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
    async calculatePatternTrend(pattern) {
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
    async analyzeSessionPatterns(session) {
        // Analyze session for new patterns
        const interactions = session.interactions;
        if (interactions.length < 3)
            return;
        // Look for repeated sequences
        const sequences = this.extractSequences(interactions);
        for (const sequence of sequences) {
            await this.updateSequencePattern(session.userId, sequence);
        }
    }
    extractSequences(interactions) {
        const sequences = [];
        for (let i = 0; i < interactions.length - 2; i++) {
            const sequence = interactions.slice(i, i + 3).map(interaction => interaction.element.component);
            sequences.push(sequence);
        }
        return sequences;
    }
    async updateSequencePattern(userId, sequence) {
        const sequenceKey = sequence.join(' -> ');
        const patternKey = `${this.PATTERN_PREFIX}:${userId}:sequence:${this.hashString(sequenceKey)}`;
        const existing = await this.redis.hget(patternKey, 'data');
        let pattern;
        if (existing) {
            pattern = JSON.parse(existing);
            pattern.frequency++;
        }
        else {
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
    async saveActiveSessions() {
        for (const [sessionId, session] of this.activeSessions) {
            await this.storeSession(session);
        }
    }
    getDefaultPreferences(userId) {
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
    generateInteractionId() {
        return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
}
exports.InteractionTracker = InteractionTracker;
//# sourceMappingURL=interaction-tracker.js.map