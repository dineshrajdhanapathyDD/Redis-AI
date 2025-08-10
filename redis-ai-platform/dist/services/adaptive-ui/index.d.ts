export * from './interaction-tracker';
export * from './ui-personalizer';
export * from './contextual-assistant';
export * from './feature-introducer';
export * from './workflow-suggester';
export * from './accessibility-adapter';
export * from './adaptive-ui-controller';
import { Redis } from 'ioredis';
import { InteractionTracker } from './interaction-tracker';
import { UIPersonalizer } from './ui-personalizer';
import { ContextualAssistant } from './contextual-assistant';
import { FeatureIntroducer } from './feature-introducer';
import { WorkflowSuggester } from './workflow-suggester';
import { AccessibilityAdapter } from './accessibility-adapter';
import { AdaptiveUIController } from './adaptive-ui-controller';
export declare class AdaptiveUIService {
    readonly interactionTracker: InteractionTracker;
    readonly uiPersonalizer: UIPersonalizer;
    readonly contextualAssistant: ContextualAssistant;
    readonly featureIntroducer: FeatureIntroducer;
    readonly workflowSuggester: WorkflowSuggester;
    readonly accessibilityAdapter: AccessibilityAdapter;
    readonly adaptiveUIController: AdaptiveUIController;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map