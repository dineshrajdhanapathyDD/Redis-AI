import { Redis } from 'ioredis';
import { AdaptiveUIService } from '../../../src/services/adaptive-ui';
import { UserInteraction, InteractionType, UsagePattern } from '../../../src/services/adaptive-ui/interaction-tracker';
import { PersonalizationType } from '../../../src/services/adaptive-ui/ui-personalizer';
import { AdaptationType } from '../../../src/services/adaptive-ui/accessibility-adapter';

describe('AdaptiveUIService', () => {
  let redis: Redis;
  let adaptiveUIService: AdaptiveUIService;
  const userId = 'test-user-123';

  beforeEach(async () => {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1 // Use test database
    });

    // Clear test data
    await redis.flushdb();

    adaptiveUIService = new AdaptiveUIService(redis);
    await adaptiveUIService.initialize();
  });

  afterEach(async () => {
    await adaptiveUIService.shutdown();
    await redis.quit();
  });

  describe('Interaction Tracking', () => {
    it('should track user interactions', async () => {
      const interaction: UserInteraction = {
        id: 'interaction-1',
        userId,
        type: InteractionType.CLICK,
        timestamp: Date.now(),
        element: {
          id: 'submit-button',
          type: 'button',
          component: 'form',
          properties: { text: 'Submit' }
        },
        context: {
          page: '/dashboard',
          task: 'form-submission',
          sessionId: 'session-1'
        },
        metadata: {
          duration: 150,
          successful: true
        }
      };

      await adaptiveUIService.interactionTracker.trackInteraction(interaction);

      const interactions = await adaptiveUIService.interactionTracker.getUserInteractions(userId);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].id).toBe('interaction-1');
      expect(interactions[0].type).toBe(InteractionType.CLICK);
    });

    it('should analyze usage patterns', async () => {
      // Create multiple interactions
      const interactions: UserInteraction[] = [
        {
          id: 'interaction-1',
          userId,
          type: InteractionType.CLICK,
          timestamp: Date.now() - 3600000, // 1 hour ago
          element: { id: 'nav-dashboard', type: 'link', component: 'navigation', properties: {} },
          context: { page: '/home', task: 'navigation', sessionId: 'session-1' },
          metadata: { duration: 100, successful: true }
        },
        {
          id: 'interaction-2',
          userId,
          type: InteractionType.CLICK,
          timestamp: Date.now() - 3000000, // 50 minutes ago
          element: { id: 'create-project', type: 'button', component: 'toolbar', properties: {} },
          context: { page: '/dashboard', task: 'project-creation', sessionId: 'session-1' },
          metadata: { duration: 200, successful: true }
        },
        {
          id: 'interaction-3',
          userId,
          type: InteractionType.FORM_SUBMIT,
          timestamp: Date.now() - 2400000, // 40 minutes ago
          element: { id: 'project-form', type: 'form', component: 'form', properties: {} },
          context: { page: '/dashboard', task: 'project-creation', sessionId: 'session-1' },
          metadata: { duration: 5000, successful: true }
        }
      ];

      for (const interaction of interactions) {
        await adaptiveUIService.interactionTracker.trackInteraction(interaction);
      }

      const patterns = await adaptiveUIService.interactionTracker.analyzeUsagePatterns(userId);
      expect(patterns.length).toBeGreaterThan(0);
      
      const navigationPattern = patterns.find(p => p.category === 'navigation');
      expect(navigationPattern).toBeDefined();
      expect(navigationPattern?.frequency).toBeGreaterThan(0);
    });
  });

  describe('UI Personalization', () => {
    it('should generate personalization suggestions', async () => {
      const patterns: UsagePattern[] = [
        {
          id: 'pattern-1',
          userId,
          category: 'navigation',
          pattern: 'frequent_dashboard_access',
          frequency: 0.8,
          confidence: 0.9,
          context: { timeOfDay: 'morning', device: 'desktop' },
          metadata: { avgDuration: 150, successRate: 0.95 },
          firstSeen: Date.now() - 86400000,
          lastSeen: Date.now(),
          strength: 0.85
        }
      ];

      const suggestions = await adaptiveUIService.uiPersonalizer.generatePersonalizationSuggestions(
        userId,
        patterns
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe(PersonalizationType.LAYOUT_OPTIMIZATION);
      expect(suggestions[0].confidence).toBeGreaterThan(0.5);
    });

    it('should create custom shortcuts', async () => {
      const patterns: UsagePattern[] = [
        {
          id: 'pattern-1',
          userId,
          category: 'workflow',
          pattern: 'create_project_sequence',
          frequency: 0.7,
          confidence: 0.8,
          context: { page: '/dashboard' },
          metadata: { steps: ['nav-projects', 'create-button', 'form-submit'] },
          firstSeen: Date.now() - 86400000,
          lastSeen: Date.now(),
          strength: 0.75
        }
      ];

      const shortcuts = await adaptiveUIService.uiPersonalizer.createCustomShortcuts(userId, patterns);
      expect(shortcuts.length).toBeGreaterThan(0);
      expect(shortcuts[0].trigger).toBeDefined();
      expect(shortcuts[0].actions.length).toBeGreaterThan(0);
    });
  });

  describe('Contextual Assistance', () => {
    it('should detect user struggles', async () => {
      // Simulate struggling interactions
      const strugglingInteractions: UserInteraction[] = [
        {
          id: 'struggle-1',
          userId,
          type: InteractionType.CLICK,
          timestamp: Date.now() - 1000,
          element: { id: 'complex-button', type: 'button', component: 'toolbar', properties: {} },
          context: { page: '/dashboard', task: 'complex-task', sessionId: 'session-1' },
          metadata: { duration: 5000, successful: false, errorCount: 3 }
        },
        {
          id: 'struggle-2',
          userId,
          type: InteractionType.CLICK,
          timestamp: Date.now() - 500,
          element: { id: 'complex-button', type: 'button', component: 'toolbar', properties: {} },
          context: { page: '/dashboard', task: 'complex-task', sessionId: 'session-1' },
          metadata: { duration: 8000, successful: false, errorCount: 2 }
        }
      ];

      for (const interaction of strugglingInteractions) {
        await adaptiveUIService.interactionTracker.trackInteraction(interaction);
      }

      const struggles = await adaptiveUIService.contextualAssistant.detectUserStruggles(userId);
      expect(struggles.length).toBeGreaterThan(0);
      expect(struggles[0].severity).toBeDefined();
      expect(struggles[0].component).toBe('toolbar');
    });

    it('should provide contextual help', async () => {
      const context = {
        userId,
        currentTask: 'project-creation',
        strugglingAreas: ['form-validation'],
        helpHistory: [],
        preferences: {
          proactiveHelp: true,
          tutorialStyle: 'interactive',
          helpFrequency: 'moderate'
        },
        lastUpdated: Date.now()
      };

      const help = await adaptiveUIService.contextualAssistant.provideContextualHelp(context);
      expect(help).toBeDefined();
      expect(help.type).toBeDefined();
      expect(help.content).toBeDefined();
      expect(help.priority).toBeDefined();
    });
  });

  describe('Feature Introduction', () => {
    it('should assess feature readiness', async () => {
      const patterns: UsagePattern[] = [
        {
          id: 'pattern-1',
          userId,
          category: 'feature_usage',
          pattern: 'advanced_user_behavior',
          frequency: 0.9,
          confidence: 0.95,
          context: { experienceLevel: 'advanced' },
          metadata: { completedTasks: 50, errorRate: 0.05 },
          firstSeen: Date.now() - 2592000000, // 30 days ago
          lastSeen: Date.now(),
          strength: 0.92
        }
      ];

      const readiness = await adaptiveUIService.featureIntroducer.assessFeatureReadiness(
        userId,
        'advanced-analytics',
        patterns
      );

      expect(readiness.ready).toBe(true);
      expect(readiness.confidence).toBeGreaterThan(0.8);
      expect(readiness.recommendedTiming).toBeDefined();
    });

    it('should introduce features at optimal times', async () => {
      const context = {
        userId,
        currentPage: '/dashboard',
        currentTask: 'data-analysis',
        userState: 'focused',
        sessionDuration: 1800000, // 30 minutes
        recentActions: ['view-chart', 'filter-data']
      };

      const introduction = await adaptiveUIService.featureIntroducer.introduceFeature(
        'advanced-filters',
        context
      );

      expect(introduction).toBeDefined();
      expect(introduction.featureId).toBe('advanced-filters');
      expect(introduction.timing).toBeDefined();
      expect(introduction.method).toBeDefined();
    });
  });

  describe('Workflow Suggestions', () => {
    it('should analyze workflow patterns', async () => {
      const interactions: UserInteraction[] = [
        {
          id: 'workflow-1',
          userId,
          type: InteractionType.CLICK,
          timestamp: Date.now() - 300000,
          element: { id: 'step1', type: 'button', component: 'workflow', properties: {} },
          context: { page: '/workflow', task: 'data-processing', sessionId: 'session-1' },
          metadata: { duration: 1000, successful: true }
        },
        {
          id: 'workflow-2',
          userId,
          type: InteractionType.FORM_SUBMIT,
          timestamp: Date.now() - 240000,
          element: { id: 'step2', type: 'form', component: 'workflow', properties: {} },
          context: { page: '/workflow', task: 'data-processing', sessionId: 'session-1' },
          metadata: { duration: 2000, successful: true }
        },
        {
          id: 'workflow-3',
          userId,
          type: InteractionType.CLICK,
          timestamp: Date.now() - 180000,
          element: { id: 'step3', type: 'button', component: 'workflow', properties: {} },
          context: { page: '/workflow', task: 'data-processing', sessionId: 'session-1' },
          metadata: { duration: 1500, successful: true }
        }
      ];

      for (const interaction of interactions) {
        await adaptiveUIService.interactionTracker.trackInteraction(interaction);
      }

      const workflows = await adaptiveUIService.workflowSuggester.analyzeWorkflowPatterns(
        userId,
        interactions
      );

      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0].steps.length).toBeGreaterThanOrEqual(3);
      expect(workflows[0].frequency).toBeDefined();
    });

    it('should generate automation suggestions', async () => {
      const patterns: UsagePattern[] = [
        {
          id: 'pattern-1',
          userId,
          category: 'workflow',
          pattern: 'repetitive_data_processing',
          frequency: 0.8,
          confidence: 0.9,
          context: { complexity: 'moderate', timeSpent: 1800 },
          metadata: { stepCount: 5, errorRate: 0.1 },
          firstSeen: Date.now() - 604800000, // 7 days ago
          lastSeen: Date.now(),
          strength: 0.85
        }
      ];

      const suggestions = await adaptiveUIService.workflowSuggester.generateAutomationSuggestions(
        userId,
        patterns
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].automation.type).toBeDefined();
      expect(suggestions[0].confidence).toBeGreaterThan(0.5);
      expect(suggestions[0].impact).toBeDefined();
    });
  });

  describe('Accessibility Adaptation', () => {
    it('should create accessibility profile', async () => {
      const preferences = {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: false,
          inApp: true
        },
        accessibility: {
          highContrast: true,
          largeText: false,
          reducedMotion: true,
          keyboardNavigation: true,
          screenReader: false
        }
      };

      const profile = await adaptiveUIService.accessibilityAdapter.createAccessibilityProfile(
        userId,
        preferences
      );

      expect(profile.userId).toBe(userId);
      expect(profile.needs.length).toBeGreaterThan(0);
      expect(profile.preferences.highContrast).toBe(true);
      expect(profile.preferences.reducedMotion).toBe(true);
    });

    it('should generate accessibility adaptations', async () => {
      const preferences = {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: false,
          inApp: true
        },
        accessibility: {
          highContrast: true,
          largeText: true,
          reducedMotion: false,
          keyboardNavigation: true,
          screenReader: false
        }
      };

      const profile = await adaptiveUIService.accessibilityAdapter.createAccessibilityProfile(
        userId,
        preferences
      );

      const adaptations = await adaptiveUIService.accessibilityAdapter.generateAdaptations(
        userId,
        profile
      );

      expect(adaptations.length).toBeGreaterThan(0);
      
      const visualAdaptation = adaptations.find(a => a.adaptationType === AdaptationType.VISUAL);
      expect(visualAdaptation).toBeDefined();
      expect(visualAdaptation?.modifications.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should process complete adaptation request', async () => {
      // Set up user data
      const preferences = {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: { email: true, push: true, inApp: true },
        accessibility: {
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          keyboardNavigation: false,
          screenReader: false
        }
      };

      // Track some interactions
      const interactions: UserInteraction[] = [
        {
          id: 'int-1',
          userId,
          type: InteractionType.CLICK,
          timestamp: Date.now() - 1000,
          element: { id: 'dashboard-nav', type: 'link', component: 'navigation', properties: {} },
          context: { page: '/home', task: 'navigation', sessionId: 'session-1' },
          metadata: { duration: 150, successful: true }
        }
      ];

      for (const interaction of interactions) {
        await adaptiveUIService.interactionTracker.trackInteraction(interaction);
      }

      // Process adaptation request
      const request = {
        userId,
        context: {
          page: '/dashboard',
          component: 'main-content',
          task: 'data-analysis',
          userState: {
            authenticated: true,
            role: 'user',
            experience: 'intermediate' as const,
            currentSession: {
              startTime: Date.now() - 1800000,
              duration: 1800000,
              interactions: 10,
              errors: 1,
              completedTasks: ['navigation', 'data-view']
            }
          },
          environment: {
            device: {
              type: 'desktop' as const,
              screenSize: { width: 1920, height: 1080, density: 1, orientation: 'landscape' as const },
              inputMethods: ['mouse' as const, 'keyboard' as const],
              capabilities: []
            },
            network: {
              type: 'wifi' as const,
              speed: 'fast' as const,
              latency: 20,
              reliability: 0.99
            },
            accessibility: {
              assistiveTechnology: [],
              preferences: [],
              limitations: []
            }
          }
        },
        priority: 'medium' as const,
        constraints: []
      };

      const result = await adaptiveUIService.adaptiveUIController.processAdaptationRequest(request);

      expect(result.success).toBe(true);
      expect(result.metrics.executionTime).toBeGreaterThan(0);
      expect(result.metrics.adaptationsApplied).toBeGreaterThanOrEqual(0);
    });
  });
});