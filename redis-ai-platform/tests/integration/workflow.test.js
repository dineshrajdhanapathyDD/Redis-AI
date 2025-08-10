/**
 * Integration tests for the complete workflow
 */

// Mock document and body
document.body = document.createElement('body');

// Mock localStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: function(key) {
            return store[key] || null;
        },
        setItem: function(key, value) {
            store[key] = value.toString();
        },
        removeItem: function(key) {
            delete store[key];
        },
        clear: function() {
            store = {};
        },
        key: function(index) {
            return Object.keys(store)[index] || null;
        },
        get length() {
            return Object.keys(store).length;
        }
    };
})();

// Setup global objects
global.localStorage = localStorageMock;
global.window = {
    CertificationRoadmap: {}
};

// Mock DataModels
global.window.CertificationRoadmap.DataModels = {
    validateAssessment: jest.fn().mockReturnValue({ isValid: true }),
    validateCareerGoals: jest.fn().mockReturnValue({ isValid: true }),
    validateRoadmap: jest.fn().mockReturnValue({ isValid: true }),
    validateStudyPlan: jest.fn().mockReturnValue({ isValid: true }),
    convertDates: jest.fn(data => data)
};

// Mock document.dispatchEvent
document.dispatchEvent = jest.fn();

// Mock CustomEvent
global.CustomEvent = jest.fn().mockImplementation((event, params) => {
    return { type: event, detail: params.detail };
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL = {
    createObjectURL: jest.fn().mockReturnValue('blob:url'),
    revokeObjectURL: jest.fn()
};

// Mock confirm
global.confirm = jest.fn().mockReturnValue(true);

// Import the modules in the correct order
require('../../assets/js/certification-roadmap/storage-service.js');
require('../../assets/js/certification-roadmap/auto-save.js');

// Mock Main for notifications
global.window.CertificationRoadmap.Main = {
    showNotification: jest.fn()
};

// Mock CertificationDatabase
global.window.CertificationRoadmap.CertificationDatabase = {
    initDatabase: jest.fn().mockResolvedValue(true),
    getCertifications: jest.fn().mockReturnValue([
        {
            id: 'aws-ccp',
            name: 'AWS Certified Cloud Practitioner',
            provider: 'aws',
            level: 'foundational',
            domains: ['general'],
            prerequisites: []
        },
        {
            id: 'aws-saa',
            name: 'AWS Certified Solutions Architect - Associate',
            provider: 'aws',
            level: 'associate',
            domains: ['architecture'],
            prerequisites: ['aws-ccp']
        }
    ]),
    getCertificationById: jest.fn().mockImplementation((id) => {
        const certs = {
            'aws-ccp': {
                id: 'aws-ccp',
                name: 'AWS Certified Cloud Practitioner',
                provider: 'aws',
                level: 'foundational',
                domains: ['general'],
                prerequisites: []
            },
            'aws-saa': {
                id: 'aws-saa',
                name: 'AWS Certified Solutions Architect - Associate',
                provider: 'aws',
                level: 'associate',
                domains: ['architecture'],
                prerequisites: ['aws-ccp']
            }
        };
        return certs[id] || null;
    })
};

// Mock ResourceRecommender
global.window.CertificationRoadmap.ResourceRecommender = {
    initRecommender: jest.fn().mockResolvedValue(true),
    recommendResources: jest.fn().mockReturnValue([
        {
            id: 'resource-1',
            title: 'AWS Certified Cloud Practitioner Study Guide',
            provider: 'Amazon',
            format: 'book',
            description: 'Official study guide for the AWS CCP exam',
            url: 'https://example.com/aws-ccp',
            cost: { type: 'paid', amount: 29.99, currency: '$' },
            difficulty: 'beginner',
            duration: { hours: 20 },
            certifications: ['aws-ccp'],
            ratings: { average: 4.5, count: 120 }
        }
    ])
};

// Mock RoadmapGenerator
global.window.CertificationRoadmap.RoadmapGenerator = {
    generateRoadmap: jest.fn().mockImplementation((assessment, careerGoals) => {
        return {
            certifications: [
                {
                    id: 'aws-ccp',
                    name: 'AWS Certified Cloud Practitioner',
                    provider: 'aws',
                    level: 'foundational',
                    domains: ['general'],
                    prerequisites: [],
                    priority: 1
                },
                {
                    id: 'aws-saa',
                    name: 'AWS Certified Solutions Architect - Associate',
                    provider: 'aws',
                    level: 'associate',
                    domains: ['architecture'],
                    prerequisites: ['aws-ccp'],
                    priority: 2
                }
            ],
            paths: [
                {
                    id: 'aws-architect',
                    name: 'AWS Architect Path',
                    certifications: ['aws-ccp', 'aws-saa']
                }
            ],
            timestamp: new Date().toISOString()
        };
    })
};

// Mock RoadmapVisualizer
global.window.CertificationRoadmap.RoadmapVisualizer = {
    initVisualization: jest.fn(),
    visualizeRoadmap: jest.fn()
};

// Mock StudyPlanModule
global.window.CertificationRoadmap.StudyPlanModule = {
    initStudyPlan: jest.fn(),
    generateStudyPlan: jest.fn().mockImplementation((certificationId, options) => {
        return {
            certificationId: certificationId,
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            weeklyHours: options.weeklyHours || 10,
            weeks: [
                {
                    weekNumber: 1,
                    topics: ['EC2', 'S3'],
                    resources: ['resource-1'],
                    totalHours: 10
                }
            ],
            estimatedCompletionTime: {
                months: 3,
                weeks: 0
            },
            timestamp: new Date().toISOString()
        };
    }),
    displayStudyPlan: jest.fn()
};

// Import the remaining modules
require('../../assets/js/certification-roadmap/data-manager.js');
require('../../assets/js/certification-roadmap/scenario-manager.js');
require('../../assets/js/certification-roadmap/main.js');

// Get the modules
const StorageService = window.CertificationRoadmap.StorageService;
const AutoSave = window.CertificationRoadmap.AutoSave;
const DataManager = window.CertificationRoadmap.DataManager;
const ScenarioManager = window.CertificationRoadmap.ScenarioManager;
const Main = window.CertificationRoadmap.Main;
const App = window.CertificationRoadmap.App;

describe('Complete Workflow Integration', () => {
    beforeEach(() => {
        // Clear localStorage and document body before each test
        localStorage.clear();
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
        
        // Create necessary DOM elements for the workflow
        createWorkflowDOM();
    });
    
    function createWorkflowDOM() {
        // Create workflow steps
        const stepsContainer = document.createElement('div');
        stepsContainer.id = 'certification-roadmap-steps';
        
        // Create welcome step
        const welcomeStep = document.createElement('div');
        welcomeStep.id = 'welcome-step';
        welcomeStep.className = 'certification-roadmap__step certification-roadmap__step--active';
        
        // Create assessment step
        const assessmentStep = document.createElement('div');
        assessmentStep.id = 'assessment-step';
        assessmentStep.className = 'certification-roadmap__step';
        
        const assessmentContainer = document.createElement('div');
        assessmentContainer.id = 'assessment-container';
        assessmentStep.appendChild(assessmentContainer);
        
        // Create career goals step
        const careerGoalsStep = document.createElement('div');
        careerGoalsStep.id = 'career-goals-step';
        careerGoalsStep.className = 'certification-roadmap__step';
        
        const careerGoalsContainer = document.createElement('div');
        careerGoalsContainer.id = 'career-goals-container';
        careerGoalsStep.appendChild(careerGoalsContainer);
        
        // Create roadmap step
        const roadmapStep = document.createElement('div');
        roadmapStep.id = 'roadmap-step';
        roadmapStep.className = 'certification-roadmap__step';
        
        const roadmapContainer = document.createElement('div');
        roadmapContainer.id = 'roadmap-container';
        roadmapStep.appendChild(roadmapContainer);
        
        // Create study plan step
        const studyPlanStep = document.createElement('div');
        studyPlanStep.id = 'study-plan-step';
        studyPlanStep.className = 'certification-roadmap__step';
        
        const studyPlanContainer = document.createElement('div');
        studyPlanContainer.id = 'study-plan-container';
        studyPlanStep.appendChild(studyPlanContainer);
        
        // Add steps to container
        stepsContainer.appendChild(welcomeStep);
        stepsContainer.appendChild(assessmentStep);
        stepsContainer.appendChild(careerGoalsStep);
        stepsContainer.appendChild(roadmapStep);
        stepsContainer.appendChild(studyPlanStep);
        
        // Add workflow step indicators
        const workflowSteps = document.createElement('div');
        workflowSteps.className = 'certification-roadmap-workflow__steps';
        
        const steps = ['welcome', 'assessment', 'career-goals', 'roadmap', 'study-plan'];
        steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'certification-roadmap-workflow__step';
            if (step === 'welcome') {
                stepElement.classList.add('certification-roadmap-workflow__step--active');
            }
            stepElement.setAttribute('data-step', step);
            
            const stepNumber = document.createElement('div');
            stepNumber.className = 'certification-roadmap-workflow__step-number';
            stepNumber.textContent = index + 1;
            
            const stepTitle = document.createElement('div');
            stepTitle.className = 'certification-roadmap-workflow__step-title';
            stepTitle.textContent = step.charAt(0).toUpperCase() + step.slice(1);
            
            stepElement.appendChild(stepNumber);
            stepElement.appendChild(stepTitle);
            workflowSteps.appendChild(stepElement);
        });
        
        // Add to document
        document.body.appendChild(workflowSteps);
        document.body.appendChild(stepsContainer);
    }
    
    describe('Complete User Journey', () => {
        test('should complete the entire workflow from assessment to study plan', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Initialize auto save
            await AutoSave.initAutoSave();
            
            // Step 1: Complete assessment
            const assessmentData = {
                skills: {
                    aws: { level: 3, experience: 2 },
                    azure: { level: 1, experience: 0 }
                },
                domains: {
                    architecture: { level: 3, experience: 2 }
                },
                preferences: {
                    learningStyle: 'visual',
                    availableHoursPerWeek: 10,
                    budgetConstraints: 'medium'
                }
            };
            
            // Dispatch assessment-complete event
            document.dispatchEvent(new CustomEvent('assessment-complete', {
                detail: { assessmentData }
            }));
            
            // Verify assessment data is saved
            expect(StorageService.loadAssessment()).toEqual(assessmentData);
            
            // Step 2: Complete career goals
            const careerGoalsData = {
                roles: ['architect'],
                interests: ['cloud-architecture'],
                priorities: {
                    salary: 4,
                    workLifeBalance: 3
                },
                targetTimeframe: 12 // months
            };
            
            // Dispatch career-goals-complete event
            document.dispatchEvent(new CustomEvent('career-goals-complete', {
                detail: { careerGoalsData }
            }));
            
            // Verify career goals data is saved
            expect(StorageService.loadCareerGoals()).toEqual(careerGoalsData);
            
            // Verify roadmap is generated
            expect(window.CertificationRoadmap.RoadmapGenerator.generateRoadmap).toHaveBeenCalledWith(
                assessmentData, careerGoalsData
            );
            
            // Verify roadmap is saved
            const roadmap = StorageService.loadRoadmap();
            expect(roadmap).toBeDefined();
            expect(roadmap.certifications).toBeDefined();
            expect(roadmap.certifications.length).toBeGreaterThan(0);
            
            // Step 3: Select certification for study plan
            const certificationId = 'aws-saa';
            
            // Dispatch certification-selected event
            document.dispatchEvent(new CustomEvent('certification-selected', {
                detail: { certification: { id: certificationId } }
            }));
            
            // Generate study plan
            const studyPlan = window.CertificationRoadmap.StudyPlanModule.generateStudyPlan(certificationId, {
                weeklyHours: 10,
                startDate: new Date()
            });
            
            // Save study plan
            StorageService.saveStudyPlan(studyPlan);
            
            // Verify study plan is saved
            const savedStudyPlan = StorageService.loadStudyPlan();
            expect(savedStudyPlan).toBeDefined();
            expect(savedStudyPlan.certificationId).toBe(certificationId);
            
            // Step 4: Create a scenario
            const scenarioId = 'scenario-1';
            const scenarioName = 'Test Scenario';
            
            // Create scenario
            const scenario = {
                id: scenarioId,
                name: scenarioName,
                createdAt: new Date().toISOString(),
                assessment: assessmentData,
                careerGoals: careerGoalsData,
                roadmap: roadmap,
                studyPlan: studyPlan
            };
            
            // Save scenario
            localStorage.setItem('certificationRoadmap.scenarios', JSON.stringify([scenario]));
            
            // Set current scenario
            ScenarioManager.setCurrentScenarioId(scenarioId);
            
            // Verify current scenario is set
            expect(ScenarioManager.getCurrentScenarioId()).toBe(scenarioId);
            
            // Step 5: Export data
            const exportData = StorageService.exportData();
            expect(exportData).toBeDefined();
            
            // Clear data
            StorageService.clearAllData();
            
            // Verify data is cleared
            expect(StorageService.loadAssessment()).toBeNull();
            expect(StorageService.loadCareerGoals()).toBeNull();
            expect(StorageService.loadRoadmap()).toBeNull();
            expect(StorageService.loadStudyPlan()).toBeNull();
            
            // Import data
            const importResult = StorageService.importData(exportData);
            expect(importResult).toBe(true);
            
            // Verify data is restored
            expect(StorageService.loadAssessment()).toEqual(assessmentData);
            expect(StorageService.loadCareerGoals()).toEqual(careerGoalsData);
            expect(StorageService.loadRoadmap()).toBeDefined();
            expect(StorageService.loadStudyPlan()).toBeDefined();
        });
    });
    
    describe('Session Management', () => {
        test('should save and restore session', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Initialize auto save
            await AutoSave.initAutoSave();
            
            // Save assessment data
            const assessmentData = {
                skills: { aws: { level: 3, experience: 2 } },
                domains: { architecture: { level: 3, experience: 2 } }
            };
            StorageService.saveAssessment(assessmentData);
            
            // Save career goals data
            const careerGoalsData = {
                roles: ['architect'],
                interests: ['cloud-architecture']
            };
            StorageService.saveCareerGoals(careerGoalsData);
            
            // Set active step
            const activeStep = document.querySelector('.certification-roadmap-workflow__step--active');
            activeStep.setAttribute('data-step', 'career-goals');
            
            // Save session
            const saveResult = AutoSave.saveSession();
            expect(saveResult).toBe(true);
            
            // Verify session is saved
            const sessionData = StorageService.loadSession();
            expect(sessionData).toBeDefined();
            expect(sessionData.currentStep).toBe('career-goals');
            expect(sessionData.hasAssessment).toBe(true);
            expect(sessionData.hasCareerGoals).toBe(true);
            
            // Clear data
            StorageService.clearAllData();
            
            // Restore session
            const restoreResult = AutoSave.restoreSession();
            expect(restoreResult).toBe(true);
            
            // Verify session-restore event is dispatched
            expect(document.dispatchEvent).toHaveBeenCalled();
            const event = document.dispatchEvent.mock.calls[0][0];
            expect(event.type).toBe('session-restore');
            expect(event.detail.sessionData).toEqual(sessionData);
        });
    });
    
    describe('Data Integrity', () => {
        test('should save and check data integrity', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Save assessment data
            const assessmentData = {
                skills: { aws: { level: 3, experience: 2 } },
                domains: { architecture: { level: 3, experience: 2 } }
            };
            StorageService.saveAssessment(assessmentData);
            
            // Save data integrity
            const saveResult = StorageService.saveDataIntegrity();
            expect(saveResult).toBe(true);
            
            // Check data integrity
            const checkResult = StorageService.checkDataIntegrity();
            expect(checkResult).toBe(true);
            
            // Change data
            const modifiedData = {
                skills: { aws: { level: 4, experience: 3 } },
                domains: { architecture: { level: 3, experience: 2 } }
            };
            StorageService.saveAssessment(modifiedData);
            
            // Check data integrity again
            const checkResult2 = StorageService.checkDataIntegrity();
            expect(checkResult2).toBe(false);
        });
    });
});