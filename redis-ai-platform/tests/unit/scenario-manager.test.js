/**
 * Unit tests for the Scenario Manager module
 */

// Mock document and body
document.body = document.createElement('body');

// Mock StorageService
const storageServiceMock = {
    loadAssessment: jest.fn().mockReturnValue({ skills: {} }),
    loadCareerGoals: jest.fn().mockReturnValue({ roles: [] }),
    loadRoadmap: jest.fn().mockReturnValue({ certifications: [] }),
    loadStudyPlan: jest.fn().mockReturnValue({ weeks: [] }),
    saveAssessment: jest.fn(),
    saveCareerGoals: jest.fn(),
    saveRoadmap: jest.fn(),
    saveStudyPlan: jest.fn()
};

// Mock Main
const mainMock = {
    showNotification: jest.fn()
};

// Setup global objects
global.window = {
    CertificationRoadmap: {
        StorageService: storageServiceMock,
        Main: mainMock
    }
};

// Mock localStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        key: jest.fn(index => Object.keys(store)[index] || null),
        get length() {
            return Object.keys(store).length;
        }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock confirm
global.confirm = jest.fn().mockReturnValue(true);

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL = {
    createObjectURL: jest.fn().mockReturnValue('blob:url'),
    revokeObjectURL: jest.fn()
};

// Import the module (this will use the mocks)
require('../../assets/js/certification-roadmap/scenario-manager.js');

// Get the module
const ScenarioManager = window.CertificationRoadmap.ScenarioManager;

describe('Scenario Manager', () => {
    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
        localStorageMock.clear();
    });
    
    describe('initScenarioManager', () => {
        test('should create scenario manager dialog', () => {
            ScenarioManager.initScenarioManager();
            
            // Dialog should be created but not visible
            const dialog = document.querySelector('.scenario-manager-dialog');
            expect(dialog).not.toBeNull();
            expect(dialog.style.display).toBe('none');
        });
    });
    
    describe('showScenarioManager', () => {
        test('should show scenario manager dialog', () => {
            ScenarioManager.initScenarioManager();
            ScenarioManager.showScenarioManager();
            
            const dialog = document.querySelector('.scenario-manager-dialog');
            expect(dialog.style.display).toBe('flex');
        });
        
        test('should create dialog if not already created', () => {
            // No initialization
            ScenarioManager.showScenarioManager();
            
            const dialog = document.querySelector('.scenario-manager-dialog');
            expect(dialog).not.toBeNull();
            expect(dialog.style.display).toBe('flex');
        });
        
        test('should update scenarios list', () => {
            // Mock localStorage to return scenarios
            const scenarios = [
                { id: 'scenario-1', name: 'Test Scenario', createdAt: new Date().toISOString() }
            ];
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(scenarios));
            
            ScenarioManager.showScenarioManager();
            
            // Should have called getItem with the scenarios key
            expect(localStorageMock.getItem).toHaveBeenCalledWith('certificationRoadmap.scenarios');
            
            // Should have created a scenario item
            const scenarioItem = document.querySelector('.scenario-item');
            expect(scenarioItem).not.toBeNull();
            expect(scenarioItem.querySelector('.scenario-item-title').textContent).toBe('Test Scenario');
        });
    });
    
    describe('createNewScenario', () => {
        beforeEach(() => {
            ScenarioManager.initScenarioManager();
            ScenarioManager.showScenarioManager();
        });
        
        test('should show error if required data is missing', () => {
            // Mock missing data
            storageServiceMock.loadAssessment.mockReturnValueOnce(null);
            
            // Find the create new scenario button
            const createButton = document.querySelector('.scenario-manager-button');
            createButton.click();
            
            expect(mainMock.showNotification).toHaveBeenCalledWith(
                'Please complete the assessment, career goals, and generate a roadmap before creating a scenario.',
                'error'
            );
        });
        
        test('should create name input dialog', () => {
            // Find the create new scenario button
            const createButton = document.querySelector('.scenario-manager-button');
            createButton.click();
            
            // Should create name input dialog
            const nameDialog = document.querySelector('.scenario-name-dialog');
            expect(nameDialog).not.toBeNull();
            
            // Should have input with default name
            const nameInput = nameDialog.querySelector('#scenario-name-input');
            expect(nameInput).not.toBeNull();
            expect(nameInput.value).toContain('Scenario');
        });
        
        test('should create new scenario when name is submitted', () => {
            // Find the create new scenario button and click it
            const createButton = document.querySelector('.scenario-manager-button');
            createButton.click();
            
            // Get the name input and create button
            const nameInput = document.querySelector('#scenario-name-input');
            nameInput.value = 'My Test Scenario';
            
            const createScenarioButton = Array.from(document.querySelectorAll('.scenario-name-button'))
                .find(b => b.textContent === 'Create');
            createScenarioButton.click();
            
            // Should save scenario to localStorage
            expect(localStorageMock.setItem).toHaveBeenCalled();
            const setItemCall = localStorageMock.setItem.mock.calls[0];
            expect(setItemCall[0]).toBe('certificationRoadmap.scenarios');
            
            // Parse the saved scenarios
            const savedScenarios = JSON.parse(setItemCall[1]);
            expect(savedScenarios.length).toBe(1);
            expect(savedScenarios[0].name).toBe('My Test Scenario');
            expect(savedScenarios[0].assessment).toEqual({ skills: {} });
            expect(savedScenarios[0].careerGoals).toEqual({ roles: [] });
            expect(savedScenarios[0].roadmap).toEqual({ certifications: [] });
            expect(savedScenarios[0].studyPlan).toEqual({ weeks: [] });
            
            // Should show notification
            expect(mainMock.showNotification).toHaveBeenCalledWith(
                'Scenario "My Test Scenario" created successfully.',
                'success'
            );
        });
        
        test('should show error if name is empty', () => {
            // Find the create new scenario button and click it
            const createButton = document.querySelector('.scenario-manager-button');
            createButton.click();
            
            // Get the name input and create button
            const nameInput = document.querySelector('#scenario-name-input');
            nameInput.value = '';
            
            const createScenarioButton = Array.from(document.querySelectorAll('.scenario-name-button'))
                .find(b => b.textContent === 'Create');
            createScenarioButton.click();
            
            // Should show error
            expect(mainMock.showNotification).toHaveBeenCalledWith(
                'Please enter a name for your scenario.',
                'error'
            );
            
            // Should not save scenario
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });
    });
    
    describe('loadScenario', () => {
        beforeEach(() => {
            // Create a test scenario
            const scenarios = [
                {
                    id: 'scenario-1',
                    name: 'Test Scenario',
                    createdAt: new Date().toISOString(),
                    assessment: { skills: { aws: 3 } },
                    careerGoals: { roles: ['architect'] },
                    roadmap: { certifications: [{ id: 'aws-sa', name: 'AWS Solutions Architect' }] },
                    studyPlan: { weeks: [{ topics: ['EC2', 'S3'] }] }
                }
            ];
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(scenarios));
            
            ScenarioManager.initScenarioManager();
        });
        
        test('should load scenario data', () => {
            ScenarioManager.loadScenario('scenario-1');
            
            // Should load data from scenario
            expect(storageServiceMock.saveAssessment).toHaveBeenCalledWith({ skills: { aws: 3 } });
            expect(storageServiceMock.saveCareerGoals).toHaveBeenCalledWith({ roles: ['architect'] });
            expect(storageServiceMock.saveRoadmap).toHaveBeenCalledWith({ 
                certifications: [{ id: 'aws-sa', name: 'AWS Solutions Architect' }] 
            });
            expect(storageServiceMock.saveStudyPlan).toHaveBeenCalledWith({ 
                weeks: [{ topics: ['EC2', 'S3'] }] 
            });
            
            // Should set current scenario ID
            expect(ScenarioManager.getCurrentScenarioId()).toBe('scenario-1');
            
            // Should show notification
            expect(mainMock.showNotification).toHaveBeenCalledWith(
                'Scenario "Test Scenario" loaded successfully. Please refresh the page to see the changes.',
                'success'
            );
        });
        
        test('should show error if scenario not found', () => {
            ScenarioManager.loadScenario('non-existent-id');
            
            // Should show error
            expect(mainMock.showNotification).toHaveBeenCalledWith(
                'Scenario with ID non-existent-id not found.',
                'error'
            );
            
            // Should not load any data
            expect(storageServiceMock.saveAssessment).not.toHaveBeenCalled();
            expect(storageServiceMock.saveCareerGoals).not.toHaveBeenCalled();
            expect(storageServiceMock.saveRoadmap).not.toHaveBeenCalled();
            expect(storageServiceMock.saveStudyPlan).not.toHaveBeenCalled();
        });
    });
    
    describe('getCurrentScenarioId and setCurrentScenarioId', () => {
        test('should get and set current scenario ID', () => {
            // Initially null
            expect(ScenarioManager.getCurrentScenarioId()).toBeNull();
            
            // Set ID
            ScenarioManager.setCurrentScenarioId('scenario-1');
            expect(ScenarioManager.getCurrentScenarioId()).toBe('scenario-1');
            
            // Set to different ID
            ScenarioManager.setCurrentScenarioId('scenario-2');
            expect(ScenarioManager.getCurrentScenarioId()).toBe('scenario-2');
        });
    });
});