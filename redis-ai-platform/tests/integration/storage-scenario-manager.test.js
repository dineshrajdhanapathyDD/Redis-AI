/**
 * Integration tests for Storage Service and Scenario Manager interaction
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

// Mock confirm
global.confirm = jest.fn().mockReturnValue(true);

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL = {
    createObjectURL: jest.fn().mockReturnValue('blob:url'),
    revokeObjectURL: jest.fn()
};

// Mock DataModels
global.window.CertificationRoadmap.DataModels = {
    validateAssessment: jest.fn().mockReturnValue({ isValid: true }),
    validateCareerGoals: jest.fn().mockReturnValue({ isValid: true }),
    validateRoadmap: jest.fn().mockReturnValue({ isValid: true }),
    validateStudyPlan: jest.fn().mockReturnValue({ isValid: true }),
    convertDates: jest.fn(data => data)
};

// Import the modules
require('../../assets/js/certification-roadmap/storage-service.js');

// Mock Main for notifications
global.window.CertificationRoadmap.Main = {
    showNotification: jest.fn()
};

// Import Scenario Manager after setting up dependencies
require('../../assets/js/certification-roadmap/scenario-manager.js');

// Get the modules
const StorageService = window.CertificationRoadmap.StorageService;
const ScenarioManager = window.CertificationRoadmap.ScenarioManager;

describe('Storage Service and Scenario Manager Integration', () => {
    beforeEach(() => {
        // Clear localStorage and document body before each test
        localStorage.clear();
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
    });
    
    describe('Scenario Creation and Loading', () => {
        test('should create and load scenarios correctly', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Save some test data
            const assessmentData = { skills: { aws: 3 }, experience: 2 };
            const careerGoalsData = { roles: ['architect'], interests: ['security'] };
            const roadmapData = { certifications: [{ id: 'aws-sa', name: 'AWS Solutions Architect' }] };
            const studyPlanData = { weeks: [{ topics: ['EC2', 'S3'] }] };
            
            StorageService.saveAssessment(assessmentData);
            StorageService.saveCareerGoals(careerGoalsData);
            StorageService.saveRoadmap(roadmapData);
            StorageService.saveStudyPlan(studyPlanData);
            
            // Initialize scenario manager
            ScenarioManager.initScenarioManager();
            
            // Create a new scenario
            // First, we need to simulate the scenario creation process
            
            // 1. Show scenario manager dialog
            ScenarioManager.showScenarioManager();
            
            // 2. Click create new scenario button
            const createButton = document.querySelector('.scenario-manager-button');
            createButton.click();
            
            // 3. Enter scenario name and click create
            const nameInput = document.querySelector('#scenario-name-input');
            nameInput.value = 'Test Scenario';
            
            const createScenarioButton = Array.from(document.querySelectorAll('.scenario-name-button'))
                .find(b => b.textContent === 'Create');
            createScenarioButton.click();
            
            // Verify scenario was created
            const scenariosJson = localStorage.getItem('certificationRoadmap.scenarios');
            expect(scenariosJson).not.toBeNull();
            
            const scenarios = JSON.parse(scenariosJson);
            expect(scenarios.length).toBe(1);
            expect(scenarios[0].name).toBe('Test Scenario');
            expect(scenarios[0].assessment).toEqual(assessmentData);
            expect(scenarios[0].careerGoals).toEqual(careerGoalsData);
            expect(scenarios[0].roadmap).toEqual(roadmapData);
            expect(scenarios[0].studyPlan).toEqual(studyPlanData);
            
            // Clear current data
            StorageService.clearAllData();
            
            // Verify data is cleared
            expect(StorageService.loadAssessment()).toBeNull();
            expect(StorageService.loadCareerGoals()).toBeNull();
            expect(StorageService.loadRoadmap()).toBeNull();
            expect(StorageService.loadStudyPlan()).toBeNull();
            
            // Load the scenario
            ScenarioManager.loadScenario(scenarios[0].id);
            
            // Verify data is restored
            expect(StorageService.saveAssessment).toHaveBeenCalledWith(assessmentData);
            expect(StorageService.saveCareerGoals).toHaveBeenCalledWith(careerGoalsData);
            expect(StorageService.saveRoadmap).toHaveBeenCalledWith(roadmapData);
            expect(StorageService.saveStudyPlan).toHaveBeenCalledWith(studyPlanData);
        });
    });
    
    describe('Scenario Management', () => {
        test('should manage multiple scenarios', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Save some test data
            StorageService.saveAssessment({ skills: { aws: 3 } });
            StorageService.saveCareerGoals({ roles: ['architect'] });
            StorageService.saveRoadmap({ certifications: [] });
            StorageService.saveStudyPlan({ weeks: [] });
            
            // Initialize scenario manager
            ScenarioManager.initScenarioManager();
            
            // Create first scenario
            ScenarioManager.showScenarioManager();
            const createButton = document.querySelector('.scenario-manager-button');
            createButton.click();
            
            const nameInput = document.querySelector('#scenario-name-input');
            nameInput.value = 'Scenario 1';
            
            const createScenarioButton = Array.from(document.querySelectorAll('.scenario-name-button'))
                .find(b => b.textContent === 'Create');
            createScenarioButton.click();
            
            // Update data
            StorageService.saveAssessment({ skills: { aws: 4 } });
            StorageService.saveCareerGoals({ roles: ['developer'] });
            
            // Create second scenario
            ScenarioManager.showScenarioManager();
            document.querySelector('.scenario-manager-button').click();
            
            document.querySelector('#scenario-name-input').value = 'Scenario 2';
            Array.from(document.querySelectorAll('.scenario-name-button'))
                .find(b => b.textContent === 'Create')
                .click();
            
            // Verify two scenarios were created
            const scenariosJson = localStorage.getItem('certificationRoadmap.scenarios');
            const scenarios = JSON.parse(scenariosJson);
            expect(scenarios.length).toBe(2);
            expect(scenarios[0].name).toBe('Scenario 1');
            expect(scenarios[1].name).toBe('Scenario 2');
            
            // Verify different data in scenarios
            expect(scenarios[0].assessment.skills.aws).toBe(3);
            expect(scenarios[1].assessment.skills.aws).toBe(4);
            expect(scenarios[0].careerGoals.roles[0]).toBe('architect');
            expect(scenarios[1].careerGoals.roles[0]).toBe('developer');
            
            // Current scenario ID should be set to the last created scenario
            expect(ScenarioManager.getCurrentScenarioId()).toBe(scenarios[1].id);
        });
    });
});