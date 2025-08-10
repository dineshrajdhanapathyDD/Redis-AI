"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAdaptiveUIDemo = runAdaptiveUIDemo;
const ioredis_1 = require("ioredis");
const adaptive_ui_1 = require("../services/adaptive-ui");
const interaction_tracker_1 = require("../services/adaptive-ui/interaction-tracker");
async function runAdaptiveUIDemo() {
    console.log('🎨 Starting Adaptive UI System Demo...\n');
    // Initialize Redis connection
    const redis = new ioredis_1.Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
    });
    try {
        // Initialize the adaptive UI service
        const adaptiveUIService = new adaptive_ui_1.AdaptiveUIService(redis);
        await adaptiveUIService.initialize();
        const userId = 'demo-user-adaptive-ui';
        console.log(`👤 Demo User ID: ${userId}\n`);
        // Demo 1: User Interaction Tracking
        console.log('📊 Demo 1: User Interaction Tracking');
        console.log('=====================================');
        const interactions = [
            {
                id: 'interaction-1',
                userId,
                type: interaction_tracker_1.InteractionType.CLICK,
                timestamp: Date.now() - 3600000, // 1 hour ago
                element: {
                    id: 'dashboard-nav',
                    type: 'link',
                    component: 'navigation',
                    properties: { text: 'Dashboard', href: '/dashboard' }
                },
                context: {
                    page: '/home',
                    task: 'navigation',
                    sessionId: 'session-demo-1'
                },
                metadata: {
                    duration: 150,
                    successful: true,
                    clickPosition: { x: 120, y: 45 }
                }
            },
            {
                id: 'interaction-2',
                userId,
                type: interaction_tracker_1.InteractionType.FORM_SUBMIT,
                timestamp: Date.now() - 3000000, // 50 minutes ago
                element: {
                    id: 'search-form',
                    type: 'form',
                    component: 'search',
                    properties: { query: 'user analytics' }
                },
                context: {
                    page: '/dashboard',
                    task: 'search',
                    sessionId: 'session-demo-1'
                },
                metadata: {
                    duration: 2500,
                    successful: true,
                    formData: { query: 'user analytics', filters: ['recent'] }
                }
            },
            {
                id: 'interaction-3',
                userId,
                type: interaction_tracker_1.InteractionType.SCROLL,
                timestamp: Date.now() - 2400000, // 40 minutes ago
                element: {
                    id: 'results-list',
                    type: 'div',
                    component: 'search-results',
                    properties: { itemCount: 25 }
                },
                context: {
                    page: '/dashboard',
                    task: 'browse-results',
                    sessionId: 'session-demo-1'
                },
                metadata: {
                    duration: 5000,
                    successful: true,
                    scrollDistance: 1200,
                    scrollDirection: 'down'
                }
            }
        ];
        // Track interactions
        for (const interaction of interactions) {
            await adaptiveUIService.interactionTracker.trackInteraction(interaction);
            console.log(`✅ Tracked ${interaction.type} interaction on ${interaction.element.component}`);
        }
        // Analyze usage patterns
        const patterns = await adaptiveUIService.interactionTracker.analyzeUsagePatterns(userId);
        console.log(`\n📈 Identified ${patterns.length} usage patterns:`);
        patterns.forEach((pattern, index) => {
            console.log(`   ${index + 1}. ${pattern.pattern} (${pattern.category}) - Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        });
        // Demo 2: UI Personalization
        console.log('\n🎯 Demo 2: UI Personalization');
        console.log('==============================');
        const personalizations = await adaptiveUIService.uiPersonalizer.generatePersonalizationSuggestions(userId, patterns);
        console.log(`💡 Generated ${personalizations.length} personalization suggestions:`);
        personalizations.forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion.type} for ${suggestion.component}`);
            console.log(`      Suggestion: ${suggestion.suggestion}`);
            console.log(`      Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
            console.log(`      Expected improvement: ${suggestion.impact.usabilityImprovement}% usability`);
        });
        // Create custom shortcuts
        const shortcuts = await adaptiveUIService.uiPersonalizer.createCustomShortcuts(userId, patterns);
        console.log(`\n⚡ Created ${shortcuts.length} custom shortcuts:`);
        shortcuts.forEach((shortcut, index) => {
            console.log(`   ${index + 1}. ${shortcut.name}: ${shortcut.trigger}`);
            console.log(`      Actions: ${shortcut.actions.length} steps`);
        });
        // Demo 3: Contextual Assistance
        console.log('\n🤝 Demo 3: Contextual Assistance');
        console.log('=================================');
        // Simulate user struggles
        const strugglingInteraction = {
            id: 'struggle-interaction',
            userId,
            type: interaction_tracker_1.InteractionType.CLICK,
            timestamp: Date.now() - 1000,
            element: {
                id: 'complex-filter-button',
                type: 'button',
                component: 'advanced-filters',
                properties: { complexity: 'high' }
            },
            context: {
                page: '/dashboard',
                task: 'advanced-filtering',
                sessionId: 'session-demo-1'
            },
            metadata: {
                duration: 8000, // Long duration indicates struggle
                successful: false,
                errorCount: 3,
                retryCount: 2
            }
        };
        await adaptiveUIService.interactionTracker.trackInteraction(strugglingInteraction);
        const struggles = await adaptiveUIService.contextualAssistant.detectUserStruggles(userId);
        console.log(`🚨 Detected ${struggles.length} user struggles:`);
        struggles.forEach((struggle, index) => {
            console.log(`   ${index + 1}. ${struggle.area} - Severity: ${struggle.severity}`);
            console.log(`      Component: ${struggle.component}`);
            console.log(`      Pattern: ${struggle.pattern}`);
        });
        // Provide contextual help
        const assistanceContext = {
            userId,
            currentTask: 'advanced-filtering',
            strugglingAreas: ['advanced-filters'],
            helpHistory: [],
            preferences: {
                proactiveHelp: true,
                tutorialStyle: 'interactive',
                helpFrequency: 'moderate'
            },
            lastUpdated: Date.now()
        };
        const help = await adaptiveUIService.contextualAssistant.provideContextualHelp(assistanceContext);
        console.log(`\n💬 Contextual help provided:`);
        console.log(`   Type: ${help.type}`);
        console.log(`   Priority: ${help.priority}`);
        console.log(`   Content: ${help.content.title}`);
        console.log(`   Trigger: ${help.trigger.condition}`);
        // Demo 4: Feature Introduction
        console.log('\n🚀 Demo 4: Feature Introduction');
        console.log('===============================');
        const featureReadiness = await adaptiveUIService.featureIntroducer.assessFeatureReadiness(userId, 'advanced-analytics', patterns);
        console.log(`🎯 Feature readiness assessment for 'advanced-analytics':`);
        console.log(`   Ready: ${featureReadiness.ready ? 'Yes' : 'No'}`);
        console.log(`   Confidence: ${(featureReadiness.confidence * 100).toFixed(1)}%`);
        console.log(`   Recommended timing: ${featureReadiness.recommendedTiming}`);
        console.log(`   Factors: ${featureReadiness.factors.map(f => f.name).join(', ')}`);
        if (featureReadiness.ready) {
            const introductionContext = {
                userId,
                currentPage: '/dashboard',
                currentTask: 'data-analysis',
                userState: 'focused',
                sessionDuration: 1800000, // 30 minutes
                recentActions: ['search', 'filter', 'scroll']
            };
            const introduction = await adaptiveUIService.featureIntroducer.introduceFeature('advanced-analytics', introductionContext);
            console.log(`\n✨ Feature introduction planned:`);
            console.log(`   Feature: ${introduction.featureId}`);
            console.log(`   Method: ${introduction.method}`);
            console.log(`   Timing: ${introduction.timing}`);
            console.log(`   Content: ${introduction.content.title}`);
        }
        // Demo 5: Workflow Suggestions
        console.log('\n⚙️ Demo 5: Workflow Suggestions');
        console.log('===============================');
        const workflowInteractions = await adaptiveUIService.interactionTracker.getUserInteractions(userId);
        const workflows = await adaptiveUIService.workflowSuggester.analyzeWorkflowPatterns(userId, workflowInteractions);
        console.log(`🔄 Identified ${workflows.length} workflow patterns:`);
        workflows.forEach((workflow, index) => {
            console.log(`   ${index + 1}. ${workflow.name}`);
            console.log(`      Steps: ${workflow.steps.length}`);
            console.log(`      Frequency: ${workflow.frequency}`);
            console.log(`      Complexity: ${workflow.context.complexity}`);
        });
        const automationSuggestions = await adaptiveUIService.workflowSuggester.generateAutomationSuggestions(userId, patterns);
        console.log(`\n🤖 Generated ${automationSuggestions.length} automation suggestions:`);
        automationSuggestions.forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion.workflow.name}`);
            console.log(`      Automation type: ${suggestion.automation.type}`);
            console.log(`      Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
            console.log(`      Time savings: ${suggestion.impact.efficiency.timeReduction}%`);
        });
        // Demo 6: Accessibility Adaptation
        console.log('\n♿ Demo 6: Accessibility Adaptation');
        console.log('===================================');
        const userPreferences = {
            theme: 'dark',
            language: 'en',
            timezone: 'UTC',
            notifications: {
                email: true,
                push: true,
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
        const accessibilityProfile = await adaptiveUIService.accessibilityAdapter.createAccessibilityProfile(userId, userPreferences);
        console.log(`👤 Accessibility profile created:`);
        console.log(`   Needs identified: ${accessibilityProfile.needs.length}`);
        console.log(`   Assistive technology: ${accessibilityProfile.assistiveTechnology.length} detected`);
        console.log(`   Compliance level: ${accessibilityProfile.compliance.currentLevel}`);
        const accessibilityAdaptations = await adaptiveUIService.accessibilityAdapter.generateAdaptations(userId, accessibilityProfile);
        console.log(`\n🔧 Generated ${accessibilityAdaptations.length} accessibility adaptations:`);
        accessibilityAdaptations.forEach((adaptation, index) => {
            console.log(`   ${index + 1}. ${adaptation.adaptationType} adaptation`);
            console.log(`      Target: ${adaptation.target.component}`);
            console.log(`      Modifications: ${adaptation.modifications.length}`);
            console.log(`      Impact: ${adaptation.impact.usability.taskCompletionRate}% task completion improvement`);
        });
        // Demo 7: Complete Adaptation Request
        console.log('\n🎛️ Demo 7: Complete Adaptation Request');
        console.log('======================================');
        const adaptationRequest = {
            userId,
            context: {
                page: '/dashboard',
                component: 'main-content',
                task: 'data-analysis',
                userState: {
                    authenticated: true,
                    role: 'user',
                    experience: 'intermediate',
                    currentSession: {
                        startTime: Date.now() - 1800000,
                        duration: 1800000,
                        interactions: 15,
                        errors: 2,
                        completedTasks: ['navigation', 'search', 'filtering']
                    }
                },
                environment: {
                    device: {
                        type: 'desktop',
                        screenSize: {
                            width: 1920,
                            height: 1080,
                            density: 1,
                            orientation: 'landscape'
                        },
                        inputMethods: ['mouse', 'keyboard'],
                        capabilities: []
                    },
                    network: {
                        type: 'wifi',
                        speed: 'fast',
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
            priority: 'medium',
            constraints: []
        };
        const adaptationResult = await adaptiveUIService.adaptiveUIController.processAdaptationRequest(adaptationRequest);
        console.log(`🎯 Adaptation request processed:`);
        console.log(`   Success: ${adaptationResult.success ? 'Yes' : 'No'}`);
        console.log(`   Adaptations applied: ${adaptationResult.adaptations.length}`);
        console.log(`   Execution time: ${adaptationResult.metrics.executionTime}ms`);
        console.log(`   Performance impact: ${adaptationResult.metrics.performanceImpact.toFixed(2)}`);
        console.log(`   User satisfaction score: ${adaptationResult.metrics.userSatisfactionScore.toFixed(2)}`);
        if (adaptationResult.adaptations.length > 0) {
            console.log(`\n   Applied adaptations:`);
            adaptationResult.adaptations.forEach((adaptation, index) => {
                console.log(`     ${index + 1}. ${adaptation.type} on ${adaptation.component}`);
                console.log(`        Changes: ${adaptation.changes.length}`);
                console.log(`        Usability impact: ${adaptation.impact.usability.toFixed(1)}%`);
            });
        }
        if (adaptationResult.errors.length > 0) {
            console.log(`\n   Errors encountered:`);
            adaptationResult.errors.forEach((error, index) => {
                console.log(`     ${index + 1}. ${error.type}: ${error.message}`);
            });
        }
        // Cleanup
        await adaptiveUIService.shutdown();
        console.log('\n✅ Adaptive UI System Demo completed successfully!');
    }
    catch (error) {
        console.error('❌ Demo failed:', error);
    }
    finally {
        await redis.quit();
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    runAdaptiveUIDemo().catch(console.error);
}
//# sourceMappingURL=adaptive-ui-demo.js.map