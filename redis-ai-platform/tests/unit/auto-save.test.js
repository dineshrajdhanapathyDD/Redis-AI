/**
 * Unit tests for the Auto Save module
 */

// Mock document and CustomEvent
document.body = document.createElement('body');
global.CustomEvent = jest.fn().mockImplementation((event, params) => {
    return { type: event, detail: params.detail };
});

// Mock StorageService
const storageServiceMock = {
    loadSettings: jest.fn().mockReturnValue({ autoSave: true }),
    saveSettings: jest.fn(),
    loadAssessment: jest.fn(),
    loadCareerGoals: jest.fn(),
    loadRoadmap: jest.fn(),
    loadStudyPlan: jest.fn(),
    loadResourceData: jest.fn(),
    loadSavedResources: jest.fn(),
    saveSession: jest.fn().mockReturnValue(true),
    loadSession: jest.fn()
};

// Setup global objects
global.window = {
    CertificationRoadmap: {
        StorageService: storageServiceMock
    }
};

// Mock setInterval and clearInterval
jest.useFakeTimers();
global.setInterval = jest.fn();
global.clearInterval = jest.fn();

// Import the module (this will use the mocks)
require('../../assets/js/certification-roadmap/auto-save.js');

// Get the module
const AutoSave = window.CertificationRoadmap.AutoSave;

describe('Auto Save', () => {
    beforeEach(() => {
        // Reset mock function calls
        jest.clearAllMocks();
    });
    
    describe('initAutoSave', () => {
        test('should initialize auto-save with enabled setting', async () => {
            await AutoSave.initAutoSave();
            
            expect(storageServiceMock.loadSettings).toHaveBeenCalled();
            expect(global.setInterval).toHaveBeenCalled();
            expect(AutoSave.isAutoSaveEnabled()).toBe(true);
        });
        
        test('should initialize auto-save with disabled setting', async () => {
            storageServiceMock.loadSettings.mockReturnValueOnce({ autoSave: false });
            
            await AutoSave.initAutoSave();
            
            expect(storageServiceMock.loadSettings).toHaveBeenCalled();
            expect(global.setInterval).not.toHaveBeenCalled();
            expect(AutoSave.isAutoSaveEnabled()).toBe(false);
        });
        
        test('should handle errors during initialization', async () => {
            storageServiceMock.loadSettings.mockImplementationOnce(() => {
                throw new Error('Test error');
            });
            
            await expect(AutoSave.initAutoSave()).rejects.toThrow('Test error');
        });
    });
    
    describe('saveSession', () => {
        test('should save current session data', () => {
            // Mock data
            storageServiceMock.loadAssessment.mockReturnValueOnce({ skills: {} });
            storageServiceMock.loadCareerGoals.mockReturnValueOnce({ roles: [] });
            storageServiceMock.loadRoadmap.mockReturnValueOnce({ certifications: [] });
            
            // Add active step to document
            const step = document.createElement('div');
            step.className = 'certification-roadmap-workflow__step--active';
            step.setAttribute('data-step', 'roadmap');
            document.body.appendChild(step);
            
            const result = AutoSave.saveSession();
            
            expect(result).toBe(true);
            expect(storageServiceMock.saveSession).toHaveBeenCalled();
            const sessionData = storageServiceMock.saveSession.mock.calls[0][0];
            expect(sessionData.currentStep).toBe('roadmap');
            expect(sessionData.hasAssessment).toBe(true);
            expect(sessionData.hasCareerGoals).toBe(true);
            expect(sessionData.hasRoadmap).toBe(true);
            expect(sessionData.timestamp).toBeDefined();
        });
        
        test('should handle errors during save', () => {
            storageServiceMock.loadAssessment.mockImplementationOnce(() => {
                throw new Error('Test error');
            });
            
            const result = AutoSave.saveSession();
            
            expect(result).toBe(false);
        });
    });
    
    describe('restoreSession', () => {
        test('should restore session if session data exists', () => {
            // Mock session data
            const sessionData = {
                currentStep: 'roadmap',
                hasAssessment: true,
                hasCareerGoals: true,
                hasRoadmap: true
            };
            storageServiceMock.loadSession.mockReturnValueOnce(sessionData);
            
            // Mock document.dispatchEvent
            document.dispatchEvent = jest.fn();
            
            const result = AutoSave.restoreSession();
            
            expect(result).toBe(true);
            expect(document.dispatchEvent).toHaveBeenCalled();
            const event = document.dispatchEvent.mock.calls[0][0];
            expect(event.type).toBe('session-restore');
            expect(event.detail.sessionData).toEqual(sessionData);
        });
        
        test('should return false if no session data', () => {
            storageServiceMock.loadSession.mockReturnValueOnce(null);
            
            const result = AutoSave.restoreSession();
            
            expect(result).toBe(false);
        });
        
        test('should return false if no data to restore', () => {
            storageServiceMock.loadSession.mockReturnValueOnce({
                hasAssessment: false,
                hasCareerGoals: false,
                hasRoadmap: false,
                hasStudyPlan: false
            });
            
            const result = AutoSave.restoreSession();
            
            expect(result).toBe(false);
        });
        
        test('should handle errors during restore', () => {
            storageServiceMock.loadSession.mockImplementationOnce(() => {
                throw new Error('Test error');
            });
            
            const result = AutoSave.restoreSession();
            
            expect(result).toBe(false);
        });
    });
    
    describe('setAutoSaveEnabled', () => {
        test('should enable auto-save', () => {
            AutoSave.setAutoSaveEnabled(true);
            
            expect(storageServiceMock.saveSettings).toHaveBeenCalledWith({ autoSave: true });
            expect(global.setInterval).toHaveBeenCalled();
            expect(AutoSave.isAutoSaveEnabled()).toBe(true);
        });
        
        test('should disable auto-save', () => {
            // First enable it
            AutoSave.setAutoSaveEnabled(true);
            jest.clearAllMocks();
            
            // Then disable it
            AutoSave.setAutoSaveEnabled(false);
            
            expect(storageServiceMock.saveSettings).toHaveBeenCalledWith({ autoSave: false });
            expect(global.clearInterval).toHaveBeenCalled();
            expect(AutoSave.isAutoSaveEnabled()).toBe(false);
        });
    });
});