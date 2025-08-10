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
import { logger } from '../../utils/logger';

export class AdaptiveUIService {
  public readonly interactionTracker: InteractionTracker;
  public readonly uiPersonalizer: UIPersonalizer;
  public readonly contextualAssistant: ContextualAssistant;
  public readonly featureIntroducer: FeatureIntroducer;
  public readonly workflowSuggester: WorkflowSuggester;
  public readonly accessibilityAdapter: AccessibilityAdapter;
  public readonly adaptiveUIController: AdaptiveUIController;

  constructor(redis: Redis) {
    this.interactionTracker = new InteractionTracker(redis);
    this.uiPersonalizer = new UIPersonalizer(redis);
    this.contextualAssistant = new ContextualAssistant(redis);
    this.featureIntroducer = new FeatureIntroducer(redis);
    this.workflowSuggester = new WorkflowSuggester(redis);
    this.accessibilityAdapter = new AccessibilityAdapter(redis);
    this.adaptiveUIController = new AdaptiveUIController(
      redis,
      this.interactionTracker,
      this.uiPersonalizer,
      this.contextualAssistant,
      this.featureIntroducer,
      this.workflowSuggester,
      this.accessibilityAdapter
    );
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Adaptive UI Service');
    
    // Initialize all components
    await this.interactionTracker.initialize();
    await this.uiPersonalizer.initialize();
    await this.contextualAssistant.initialize();
    await this.featureIntroducer.initialize();
    await this.workflowSuggester.initialize();
    await this.accessibilityAdapter.initialize();
    await this.adaptiveUIController.initialize();
    
    logger.info('Adaptive UI Service initialized successfully');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Adaptive UI Service');
    
    // Shutdown all components
    await this.adaptiveUIController.shutdown();
    await this.accessibilityAdapter.shutdown();
    await this.workflowSuggester.shutdown();
    await this.featureIntroducer.shutdown();
    await this.contextualAssistant.shutdown();
    await this.uiPersonalizer.shutdown();
    await this.interactionTracker.shutdown();
    
    logger.info('Adaptive UI Service shutdown complete');
  }
}