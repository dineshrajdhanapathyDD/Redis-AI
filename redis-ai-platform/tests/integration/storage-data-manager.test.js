/**
 * Integration tests for Storage Service and Data Manager interaction
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
require('../../assets/js/certification-roadmap/auto-save.js');

// Mock Main for notifications
global.window.CertificationRoadmap.Main = {
    showNotification: jest.fn()
};

// Import Data Manager after setting up dependencies
require('../../assets/js/certification-roadmap/data-manager.js');

// Get the modules
const StorageService = window.CertificationRoadmap.StorageService;
const DataManager = window.CertificationRoadmap.DataManager;
const AutoSave = window.CertificationRoadmap.AutoSave;

describe('Storage Service and Data Manager Integration', () => {
    beforeEach(() => {
        // Clear localStorage and document body before each test
        localStorage.clear();
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
    });
    
    describe('Data Export and Import', () => {
        test('should export and import data correctly', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Save some test data
            const assessmentData = { skills: { aws: 3 }, experience: 2 };
            const careerGoalsData = { roles: ['architect'], interests: ['security'] };
            const roadmapData = { certifications: [{ id: 'aws-sa', name: 'AWS Solutions Architect' }] };
            
            StorageService.saveAssessment(assessmentData);
            StorageService.saveCareerGoals(careerGoalsData);
            StorageService.saveRoadmap(roadmapData);
            
            // Initialize data manager
            DataManager.initDataManager();
            
            // Export data
            const exportData = StorageService.exportData();
            expect(exportData).toBeTruthy();
            
            // Clear data
            StorageService.clearAllData();
            
            // Verify data is cleared
            expect(StorageService.loadAssessment()).toBeNull();
            expect(StorageService.loadCareerGoals()).toBeNull();
            expect(StorageService.loadRoadmap()).toBeNull();
            
            // Import data
            const importResult = StorageService.importData(exportData);
            expect(importResult).toBe(true);
            
            // Verify data is restored
            expect(StorageService.loadAssessment()).toEqual(assessmentData);
            expect(StorageService.loadCareerGoals()).toEqual(careerGoalsData);
            expect(StorageService.loadRoadmap()).toEqual(roadmapData);
        });
    });
    
    describe('Data Manager UI Interaction', () => {
        test('should show data manager dialog and interact with storage', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Save some test data
            StorageService.saveAssessment({ skills: { aws: 3 } });
            
            // Initialize data manager
            DataManager.initDataManager();
            
            // Show data manager dialog
            DataManager.showDataManager();
            
            // Dialog should be visible
            const dialog = document.querySelector('.data-manager-dialog');
            expect(dialog).not.toBeNull();
            expect(dialog.style.display).toBe('flex');
            
            // Find and click the clear all data button
            const clearButton = Array.from(document.querySelectorAll('.data-manager-button'))
                .find(b => b.textContent === 'Clear All Data');
            clearButton.click();
            
            // Confirm dialog should have been shown
            expect(confirm).toHaveBeenCalled();
            
            // Data should be cleared
            expect(StorageService.loadAssessment()).toBeNull();
        });
    });
    
    describe('Auto Save Integration', () => {
        test('should save session data automatically', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Save some test data
            StorageService.saveAssessment({ skills: { aws: 3 } });
            StorageService.saveCareerGoals({ roles: ['architect'] });
            StorageService.saveRoadmap({ certifications: [] });
            
            // Initialize auto save
            await AutoSave.initAutoSave();
            
            // Add active step to document
            const step = document.createElement('div');
            step.className = 'certification-roadmap-workflow__step--active';
            step.setAttribute('data-step', 'roadmap');
            document.body.appendChild(step);
            
            // Manually trigger auto save
            const result = AutoSave.saveSession();
            
            // Session should be saved
            expect(result).toBe(true);
            
            // Load session data
            const sessionData = StorageService.loadSession();
            expect(sessionData).not.toBeNull();
            expect(sessionData.currentStep).toBe('roadmap');
            expect(sessionData.hasAssessment).toBe(true);
            expect(sessionData.hasCareerGoals).toBe(true);
            expect(sessionData.hasRoadmap).toBe(true);
        });
        
        test('should restore session data', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Create session data
            const sessionData = {
                currentStep: 'roadmap',
                hasAssessment: true,
                hasCareerGoals: true,
                hasRoadmap: true,
                timestamp: new Date().toISOString()
            };
            
            // Save session data
            StorageService.saveSession(sessionData);
            
            // Initialize auto save
            await AutoSave.initAutoSave();
            
            // Mock document.dispatchEvent
            document.dispatchEvent = jest.fn();
            
            // Restore session
            const result = AutoSave.restoreSession();
            
            // Session should be restored
            expect(result).toBe(true);
            expect(document.dispatchEvent).toHaveBeenCalled();
            
            // Event should contain session data
            const event = document.dispatchEvent.mock.calls[0][0];
            expect(event.type).toBe('session-restore');
            expect(event.detail.sessionData.currentStep).toBe('roadmap');
        });
    });
    
    describe('Data Integrity', () => {
        test('should save and check data integrity', async () => {
            // Initialize storage service
            await StorageService.initStorage();
            
            // Save some test data
            StorageService.saveAssessment({ skills: { aws: 3 } });
            StorageService.saveCareerGoals({ roles: ['architect'] });
            
            // Save data integrity
            const saveResult = StorageService.saveDataIntegrity();
            expect(saveResult).toBe(true);
            
            // Check data integrity
            const checkResult = StorageService.checkDataIntegrity();
            expect(checkResult).toBe(true);
            
            // Change data
            StorageService.saveAssessment({ skills: { aws: 4 } });
            
            // Check data integrity again
            const checkResult2 = StorageService.checkDataIntegrity();
            expect(checkResult2).toBe(false);
        });
    });
});