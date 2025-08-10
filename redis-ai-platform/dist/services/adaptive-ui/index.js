"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveUIService = void 0;
__exportStar(require("./interaction-tracker"), exports);
__exportStar(require("./ui-personalizer"), exports);
__exportStar(require("./contextual-assistant"), exports);
__exportStar(require("./feature-introducer"), exports);
__exportStar(require("./workflow-suggester"), exports);
__exportStar(require("./accessibility-adapter"), exports);
__exportStar(require("./adaptive-ui-controller"), exports);
const interaction_tracker_1 = require("./interaction-tracker");
const ui_personalizer_1 = require("./ui-personalizer");
const contextual_assistant_1 = require("./contextual-assistant");
const feature_introducer_1 = require("./feature-introducer");
const workflow_suggester_1 = require("./workflow-suggester");
const accessibility_adapter_1 = require("./accessibility-adapter");
const adaptive_ui_controller_1 = require("./adaptive-ui-controller");
const logger_1 = require("../../utils/logger");
class AdaptiveUIService {
    interactionTracker;
    uiPersonalizer;
    contextualAssistant;
    featureIntroducer;
    workflowSuggester;
    accessibilityAdapter;
    adaptiveUIController;
    constructor(redis) {
        this.interactionTracker = new interaction_tracker_1.InteractionTracker(redis);
        this.uiPersonalizer = new ui_personalizer_1.UIPersonalizer(redis);
        this.contextualAssistant = new contextual_assistant_1.ContextualAssistant(redis);
        this.featureIntroducer = new feature_introducer_1.FeatureIntroducer(redis);
        this.workflowSuggester = new workflow_suggester_1.WorkflowSuggester(redis);
        this.accessibilityAdapter = new accessibility_adapter_1.AccessibilityAdapter(redis);
        this.adaptiveUIController = new adaptive_ui_controller_1.AdaptiveUIController(redis, this.interactionTracker, this.uiPersonalizer, this.contextualAssistant, this.featureIntroducer, this.workflowSuggester, this.accessibilityAdapter);
    }
    async initialize() {
        logger_1.logger.info('Initializing Adaptive UI Service');
        // Initialize all components
        await this.interactionTracker.initialize();
        await this.uiPersonalizer.initialize();
        await this.contextualAssistant.initialize();
        await this.featureIntroducer.initialize();
        await this.workflowSuggester.initialize();
        await this.accessibilityAdapter.initialize();
        await this.adaptiveUIController.initialize();
        logger_1.logger.info('Adaptive UI Service initialized successfully');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Adaptive UI Service');
        // Shutdown all components
        await this.adaptiveUIController.shutdown();
        await this.accessibilityAdapter.shutdown();
        await this.workflowSuggester.shutdown();
        await this.featureIntroducer.shutdown();
        await this.contextualAssistant.shutdown();
        await this.uiPersonalizer.shutdown();
        await this.interactionTracker.shutdown();
        logger_1.logger.info('Adaptive UI Service shutdown complete');
    }
}
exports.AdaptiveUIService = AdaptiveUIService;
//# sourceMappingURL=index.js.map