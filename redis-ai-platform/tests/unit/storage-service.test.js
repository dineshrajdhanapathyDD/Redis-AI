/**
 * Unit tests for the Storage Service module
 */

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

// Mock DataModels
const dataModelsMock = {
    validateAssessment: jest.fn().mockReturnValue({ isValid: true }),
    validateCareerGoals: jest.fn().mockReturnValue({ isValid: true }),
    validateRoadmap: jest.fn().mockReturnValue({ isValid: true }),
    validateStudyPlan: jest.fn().mockReturnValue({ isValid: true }),
    convertDates: jest.fn(data => data)
};

// Setup global objects
global.localStorage = localStorageMock;
global.window = {
    CertificationRoadmap: {
        DataModels: dataModelsMock
    }
};

// Import the module (this will use the mocks)
require('../../assets/js/certification-roadmap/storage-service.js');

// Get the module
const StorageService = window.CertificationRoadmap.StorageService;

describe('Storage Service', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Reset mock function calls
        jest.clearAllMocks();
    });
    
    describe('initStorage', () => {
        test('should initialize storage and set version if not present', async () => {
            await StorageService.initStorage();
            
            expect(localStorage.getItem('certificationRoadmap.version')).toBe('1.0.0');
        });
        
        test('should call migrateData if version mismatch', async () => {
            // Set old version
            localStorage.setItem('certificationRoadmap.version', '0.9.0');
            
            // Spy on migrateData
            const migrateSpy = jest.spyOn(StorageService, 'migrateData');
            
            await StorageService.initStorage();
            
            expect(migrateSpy).toHaveBeenCalledWith('0.9.0', '1.0.0');
            expect(localStorage.getItem('certificationRoadmap.version')).toBe('1.0.0');
        });
        
        test('should reject if localStorage is not available', async () => {
            // Temporarily remove localStorage
            const tempLocalStorage = global.localStorage;
            delete global.localStorage;
            
            await expect(StorageService.initStorage()).rejects.toThrow('Local storage is not available');
            
            // Restore localStorage
            global.localStorage = tempLocalStorage;
        });
    });
    
    describe('saveAssessment', () => {
        test('should save valid assessment data', () => {
            const assessmentData = { skills: { aws: 3 }, experience: 2 };
            
            const result = StorageService.saveAssessment(assessmentData);
            
            expect(result).toBe(true);
            expect(dataModelsMock.validateAssessment).toHaveBeenCalledWith(assessmentData);
            expect(localStorage.getItem('certificationRoadmap.assessment')).toBe(JSON.stringify(assessmentData));
        });
        
        test('should not save invalid assessment data', () => {
            const invalidData = { invalid: true };
            
            // Mock validation failure
            dataModelsMock.validateAssessment.mockReturnValueOnce({ isValid: false, errors: ['Invalid data'] });
            
            const result = StorageService.saveAssessment(invalidData);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateAssessment).toHaveBeenCalledWith(invalidData);
            expect(localStorage.getItem('certificationRoadmap.assessment')).toBeNull();
        });
        
        test('should return false if no data provided', () => {
            const result = StorageService.saveAssessment(null);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateAssessment).not.toHaveBeenCalled();
        });
    });
    
    describe('loadAssessment', () => {
        test('should load assessment data and convert dates', () => {
            const assessmentData = { skills: { aws: 3 }, experience: 2 };
            localStorage.setItem('certificationRoadmap.assessment', JSON.stringify(assessmentData));
            
            const result = StorageService.loadAssessment();
            
            expect(result).toEqual(assessmentData);
            expect(dataModelsMock.convertDates).toHaveBeenCalledWith(assessmentData);
        });
        
        test('should return null if no data exists', () => {
            const result = StorageService.loadAssessment();
            
            expect(result).toBeNull();
        });
    });
    
    describe('saveCareerGoals', () => {
        test('should save valid career goals data', () => {
            const careerGoalsData = { roles: ['architect'], interests: ['security'] };
            
            const result = StorageService.saveCareerGoals(careerGoalsData);
            
            expect(result).toBe(true);
            expect(dataModelsMock.validateCareerGoals).toHaveBeenCalledWith(careerGoalsData);
            expect(localStorage.getItem('certificationRoadmap.careerGoals')).toBe(JSON.stringify(careerGoalsData));
        });
        
        test('should not save invalid career goals data', () => {
            const invalidData = { invalid: true };
            
            // Mock validation failure
            dataModelsMock.validateCareerGoals.mockReturnValueOnce({ isValid: false, errors: ['Invalid data'] });
            
            const result = StorageService.saveCareerGoals(invalidData);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateCareerGoals).toHaveBeenCalledWith(invalidData);
            expect(localStorage.getItem('certificationRoadmap.careerGoals')).toBeNull();
        });
        
        test('should return false if no data provided', () => {
            const result = StorageService.saveCareerGoals(null);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateCareerGoals).not.toHaveBeenCalled();
        });
    });
    
    describe('loadCareerGoals', () => {
        test('should load career goals data and convert dates', () => {
            const careerGoalsData = { roles: ['architect'], interests: ['security'] };
            localStorage.setItem('certificationRoadmap.careerGoals', JSON.stringify(careerGoalsData));
            
            const result = StorageService.loadCareerGoals();
            
            expect(result).toEqual(careerGoalsData);
            expect(dataModelsMock.convertDates).toHaveBeenCalledWith(careerGoalsData);
        });
        
        test('should return null if no data exists', () => {
            const result = StorageService.loadCareerGoals();
            
            expect(result).toBeNull();
        });
    });
    
    describe('saveRoadmap', () => {
        test('should save valid roadmap data', () => {
            const roadmapData = { certifications: [{ id: 'aws-sa', name: 'AWS Solutions Architect' }] };
            
            const result = StorageService.saveRoadmap(roadmapData);
            
            expect(result).toBe(true);
            expect(dataModelsMock.validateRoadmap).toHaveBeenCalledWith(roadmapData);
            expect(localStorage.getItem('certificationRoadmap.roadmap')).toBe(JSON.stringify(roadmapData));
        });
        
        test('should not save invalid roadmap data', () => {
            const invalidData = { invalid: true };
            
            // Mock validation failure
            dataModelsMock.validateRoadmap.mockReturnValueOnce({ isValid: false, errors: ['Invalid data'] });
            
            const result = StorageService.saveRoadmap(invalidData);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateRoadmap).toHaveBeenCalledWith(invalidData);
            expect(localStorage.getItem('certificationRoadmap.roadmap')).toBeNull();
        });
        
        test('should return false if no data provided', () => {
            const result = StorageService.saveRoadmap(null);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateRoadmap).not.toHaveBeenCalled();
        });
    });
    
    describe('loadRoadmap', () => {
        test('should load roadmap data and convert dates', () => {
            const roadmapData = { certifications: [{ id: 'aws-sa', name: 'AWS Solutions Architect' }] };
            localStorage.setItem('certificationRoadmap.roadmap', JSON.stringify(roadmapData));
            
            const result = StorageService.loadRoadmap();
            
            expect(result).toEqual(roadmapData);
            expect(dataModelsMock.convertDates).toHaveBeenCalledWith(roadmapData);
        });
        
        test('should return null if no data exists', () => {
            const result = StorageService.loadRoadmap();
            
            expect(result).toBeNull();
        });
    });
    
    describe('saveStudyPlan', () => {
        test('should save valid study plan data', () => {
            const studyPlanData = { weeks: [{ topics: ['EC2', 'S3'] }] };
            
            const result = StorageService.saveStudyPlan(studyPlanData);
            
            expect(result).toBe(true);
            expect(dataModelsMock.validateStudyPlan).toHaveBeenCalledWith(studyPlanData);
            expect(localStorage.getItem('certificationRoadmap.studyPlan')).toBe(JSON.stringify(studyPlanData));
        });
        
        test('should not save invalid study plan data', () => {
            const invalidData = { invalid: true };
            
            // Mock validation failure
            dataModelsMock.validateStudyPlan.mockReturnValueOnce({ isValid: false, errors: ['Invalid data'] });
            
            const result = StorageService.saveStudyPlan(invalidData);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateStudyPlan).toHaveBeenCalledWith(invalidData);
            expect(localStorage.getItem('certificationRoadmap.studyPlan')).toBeNull();
        });
        
        test('should return false if no data provided', () => {
            const result = StorageService.saveStudyPlan(null);
            
            expect(result).toBe(false);
            expect(dataModelsMock.validateStudyPlan).not.toHaveBeenCalled();
        });
    });
    
    describe('loadStudyPlan', () => {
        test('should load study plan data and convert dates', () => {
            const studyPlanData = { weeks: [{ topics: ['EC2', 'S3'] }] };
            localStorage.setItem('certificationRoadmap.studyPlan', JSON.stringify(studyPlanData));
            
            const result = StorageService.loadStudyPlan();
            
            expect(result).toEqual(studyPlanData);
            expect(dataModelsMock.convertDates).toHaveBeenCalledWith(studyPlanData);
        });
        
        test('should return null if no data exists', () => {
            const result = StorageService.loadStudyPlan();
            
            expect(result).toBeNull();
        });
    });
    
    describe('saveSettings', () => {
        test('should save settings data', () => {
            const settingsData = { theme: 'dark', autoSave: true };
            
            const result = StorageService.saveSettings(settingsData);
            
            expect(result).toBe(true);
            expect(localStorage.getItem('certificationRoadmap.settings')).toBe(JSON.stringify(settingsData));
        });
        
        test('should return false if no data provided', () => {
            const result = StorageService.saveSettings(null);
            
            expect(result).toBe(false);
        });
    });
    
    describe('loadSettings', () => {
        test('should load settings data', () => {
            const settingsData = { theme: 'dark', autoSave: true };
            localStorage.setItem('certificationRoadmap.settings', JSON.stringify(settingsData));
            
            const result = StorageService.loadSettings();
            
            expect(result).toEqual(settingsData);
        });
        
        test('should return null if no data exists', () => {
            const result = StorageService.loadSettings();
            
            expect(result).toBeNull();
        });
    });
    
    describe('clearAllData', () => {
        test('should clear all data from localStorage', () => {
            // Set some data
            localStorage.setItem('certificationRoadmap.assessment', '{}');
            localStorage.setItem('certificationRoadmap.careerGoals', '{}');
            localStorage.setItem('certificationRoadmap.roadmap', '{}');
            
            const result = StorageService.clearAllData();
            
            expect(result).toBe(true);
            expect(localStorage.getItem('certificationRoadmap.assessment')).toBeNull();
            expect(localStorage.getItem('certificationRoadmap.careerGoals')).toBeNull();
            expect(localStorage.getItem('certificationRoadmap.roadmap')).toBeNull();
        });
    });
    
    describe('clearRoadmapData', () => {
        test('should clear only roadmap-related data', () => {
            // Set some data
            localStorage.setItem('certificationRoadmap.assessment', '{}');
            localStorage.setItem('certificationRoadmap.careerGoals', '{}');
            localStorage.setItem('certificationRoadmap.roadmap', '{}');
            localStorage.setItem('certificationRoadmap.studyPlan', '{}');
            localStorage.setItem('certificationRoadmap.resources', '{}');
            
            const result = StorageService.clearRoadmapData();
            
            expect(result).toBe(true);
            expect(localStorage.getItem('certificationRoadmap.assessment')).toBe('{}');
            expect(localStorage.getItem('certificationRoadmap.careerGoals')).toBe('{}');
            expect(localStorage.getItem('certificationRoadmap.roadmap')).toBeNull();
            expect(localStorage.getItem('certificationRoadmap.studyPlan')).toBeNull();
            expect(localStorage.getItem('certificationRoadmap.resources')).toBeNull();
        });
    });
    
    describe('exportData', () => {
        test('should export all data as JSON string', () => {
            // Mock the load methods
            jest.spyOn(StorageService, 'loadAssessment').mockReturnValue({ skills: { aws: 3 } });
            jest.spyOn(StorageService, 'loadCareerGoals').mockReturnValue({ roles: ['architect'] });
            jest.spyOn(StorageService, 'loadRoadmap').mockReturnValue({ certifications: [] });
            jest.spyOn(StorageService, 'loadStudyPlan').mockReturnValue({ weeks: [] });
            jest.spyOn(StorageService, 'loadSettings').mockReturnValue({ theme: 'dark' });
            
            const result = StorageService.exportData();
            const parsed = JSON.parse(result);
            
            expect(parsed.version).toBe('1.0.0');
            expect(parsed.assessment).toEqual({ skills: { aws: 3 } });
            expect(parsed.careerGoals).toEqual({ roles: ['architect'] });
            expect(parsed.roadmap).toEqual({ certifications: [] });
            expect(parsed.studyPlan).toEqual({ weeks: [] });
            expect(parsed.settings).toEqual({ theme: 'dark' });
            expect(parsed.timestamp).toBeDefined();
        });
    });
    
    describe('importData', () => {
        test('should import data from JSON string', () => {
            const jsonData = JSON.stringify({
                version: '1.0.0',
                assessment: { skills: { aws: 3 } },
                careerGoals: { roles: ['architect'] },
                roadmap: { certifications: [] },
                studyPlan: { weeks: [] },
                settings: { theme: 'dark' }
            });
            
            // Spy on save methods
            jest.spyOn(StorageService, 'saveAssessment').mockReturnValue(true);
            jest.spyOn(StorageService, 'saveCareerGoals').mockReturnValue(true);
            jest.spyOn(StorageService, 'saveRoadmap').mockReturnValue(true);
            jest.spyOn(StorageService, 'saveStudyPlan').mockReturnValue(true);
            jest.spyOn(StorageService, 'saveSettings').mockReturnValue(true);
            
            const result = StorageService.importData(jsonData);
            
            expect(result).toBe(true);
            expect(StorageService.saveAssessment).toHaveBeenCalledWith({ skills: { aws: 3 } });
            expect(StorageService.saveCareerGoals).toHaveBeenCalledWith({ roles: ['architect'] });
            expect(StorageService.saveRoadmap).toHaveBeenCalledWith({ certifications: [] });
            expect(StorageService.saveStudyPlan).toHaveBeenCalledWith({ weeks: [] });
            expect(StorageService.saveSettings).toHaveBeenCalledWith({ theme: 'dark' });
            expect(localStorage.getItem('certificationRoadmap.version')).toBe('1.0.0');
        });
        
        test('should call migrateData if version mismatch', () => {
            const jsonData = JSON.stringify({
                version: '0.9.0',
                assessment: { skills: { aws: 3 } }
            });
            
            // Spy on migrateData
            const migrateSpy = jest.spyOn(StorageService, 'migrateData');
            jest.spyOn(StorageService, 'saveAssessment').mockReturnValue(true);
            
            const result = StorageService.importData(jsonData);
            
            expect(result).toBe(true);
            expect(migrateSpy).toHaveBeenCalledWith('0.9.0', '1.0.0');
        });
        
        test('should return false if no data provided', () => {
            const result = StorageService.importData(null);
            
            expect(result).toBe(false);
        });
        
        test('should return false if invalid JSON', () => {
            const result = StorageService.importData('invalid json');
            
            expect(result).toBe(false);
        });
        
        test('should return false if missing version', () => {
            const jsonData = JSON.stringify({
                assessment: { skills: { aws: 3 } }
            });
            
            const result = StorageService.importData(jsonData);
            
            expect(result).toBe(false);
        });
    });
    
    describe('checkDataExists', () => {
        test('should return object with boolean flags for each data type', () => {
            // Set some data
            localStorage.setItem('certificationRoadmap.assessment', '{}');
            localStorage.setItem('certificationRoadmap.roadmap', '{}');
            
            const result = StorageService.checkDataExists();
            
            expect(result.assessment).toBe(true);
            expect(result.careerGoals).toBe(false);
            expect(result.roadmap).toBe(true);
            expect(result.studyPlan).toBe(false);
            expect(result.resources).toBe(false);
            expect(result.settings).toBe(false);
        });
    });
    
    describe('saveSession and loadSession', () => {
        test('should save and load session data', () => {
            const sessionData = { currentStep: 'roadmap', hasAssessment: true };
            
            const saveResult = StorageService.saveSession(sessionData);
            expect(saveResult).toBe(true);
            
            const loadedData = StorageService.loadSession();
            expect(loadedData.currentStep).toBe('roadmap');
            expect(loadedData.hasAssessment).toBe(true);
            expect(loadedData.timestamp).toBeDefined();
        });
        
        test('should convert timestamp to Date object when loading', () => {
            const sessionData = { 
                currentStep: 'roadmap',
                timestamp: new Date().toISOString()
            };
            
            StorageService.saveSession(sessionData);
            const loadedData = StorageService.loadSession();
            
            expect(loadedData.timestamp instanceof Date).toBe(true);
        });
        
        test('should return false when saving null data', () => {
            const result = StorageService.saveSession(null);
            expect(result).toBe(false);
        });
        
        test('should return null when no session data exists', () => {
            const result = StorageService.loadSession();
            expect(result).toBeNull();
        });
    });
    
    describe('saveDataIntegrity and checkDataIntegrity', () => {
        test('should save and check data integrity', () => {
            // Set some data
            localStorage.setItem('certificationRoadmap.assessment', '{"skills":{"aws":3}}');
            localStorage.setItem('certificationRoadmap.careerGoals', '{"roles":["architect"]}');
            
            const saveResult = StorageService.saveDataIntegrity();
            expect(saveResult).toBe(true);
            
            const checkResult = StorageService.checkDataIntegrity();
            expect(checkResult).toBe(true);
        });
        
        test('should return false when integrity check fails', () => {
            // Save integrity hash
            StorageService.saveDataIntegrity();
            
            // Change data
            localStorage.setItem('certificationRoadmap.assessment', '{"skills":{"aws":4}}');
            
            const checkResult = StorageService.checkDataIntegrity();
            expect(checkResult).toBe(false);
        });
        
        test('should return false when no integrity data exists', () => {
            const checkResult = StorageService.checkDataIntegrity();
            expect(checkResult).toBe(false);
        });
    });
});