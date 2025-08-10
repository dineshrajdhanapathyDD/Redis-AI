/**
 * Unit tests for the Data Manager module
 */

// Mock document and body
document.body = document.createElement('body');

// Mock StorageService
const storageServiceMock = {
    exportDataAsFile: jest.fn().mockReturnValue(true),
    importDataFromFile: jest.fn().mockResolvedValue(true),
    clearAllData: jest.fn().mockReturnValue(true),
    clearRoadmapData: jest.fn().mockReturnValue(true),
    checkDataIntegrity: jest.fn().mockReturnValue(true),
    loadSavedResources: jest.fn().mockReturnValue([]),
    saveSavedResources: jest.fn(),
    exportData: jest.fn().mockReturnValue('{"data":"test"}'),
    importData: jest.fn().mockReturnValue(true),
    loadRoadmap: jest.fn().mockReturnValue({ certifications: [] })
};

// Mock AutoSave
const autoSaveMock = {
    isAutoSaveEnabled: jest.fn().mockReturnValue(true),
    setAutoSaveEnabled: jest.fn()
};

// Mock Main
const mainMock = {
    showNotification: jest.fn()
};

// Setup global objects
global.window = {
    CertificationRoadmap: {
        StorageService: storageServiceMock,
        AutoSave: autoSaveMock,
        Main: mainMock
    }
};

// Mock confirm
global.confirm = jest.fn().mockReturnValue(true);

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL = {
    createObjectURL: jest.fn().mockReturnValue('blob:url'),
    revokeObjectURL: jest.fn()
};

// Import the module (this will use the mocks)
require('../../assets/js/certification-roadmap/data-manager.js');

// Get the module
const DataManager = window.CertificationRoadmap.DataManager;

describe('Data Manager', () => {
    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
    });
    
    describe('initDataManager', () => {
        test('should create data manager dialog', () => {
            DataManager.initDataManager();
            
            // Dialog should be created but not visible
            const dialog = document.querySelector('.data-manager-dialog');
            expect(dialog).not.toBeNull();
            expect(dialog.style.display).toBe('none');
        });
    });
    
    describe('showDataManager', () => {
        test('should show data manager dialog', () => {
            DataManager.initDataManager();
            DataManager.showDataManager();
            
            const dialog = document.querySelector('.data-manager-dialog');
            expect(dialog.style.display).toBe('flex');
        });
        
        test('should create dialog if not already created', () => {
            // No initialization
            DataManager.showDataManager();
            
            const dialog = document.querySelector('.data-manager-dialog');
            expect(dialog).not.toBeNull();
            expect(dialog.style.display).toBe('flex');
        });
    });
    
    describe('Dialog functionality', () => {
        beforeEach(() => {
            DataManager.initDataManager();
            DataManager.showDataManager();
        });
        
        test('should close dialog when close button is clicked', () => {
            const closeButton = document.querySelector('.data-manager-dialog-close');
            closeButton.click();
            
            const dialog = document.querySelector('.data-manager-dialog');
            expect(dialog.style.display).toBe('none');
        });
        
        test('should export data when export button is clicked', () => {
            const exportButton = document.querySelector('.data-manager-button');
            exportButton.click();
            
            expect(storageServiceMock.exportDataAsFile).toHaveBeenCalled();
            expect(mainMock.showNotification).toHaveBeenCalledWith('Data exported successfully.', 'success');
        });
        
        test('should show integrity warning if integrity check fails', () => {
            // Reset and mock integrity check to fail
            document.body.innerHTML = '';
            storageServiceMock.checkDataIntegrity.mockReturnValueOnce(false);
            
            DataManager.initDataManager();
            
            const warning = document.querySelector('.data-integrity-warning');
            expect(warning).not.toBeNull();
        });
        
        test('should toggle auto-save when checkbox is changed', () => {
            const autoSaveToggle = document.querySelector('#auto-save-toggle');
            autoSaveToggle.checked = false;
            autoSaveToggle.dispatchEvent(new Event('change'));
            
            expect(autoSaveMock.setAutoSaveEnabled).toHaveBeenCalledWith(false);
            expect(mainMock.showNotification).toHaveBeenCalledWith('Auto-save disabled.', 'info');
        });
        
        test('should clear all data when clear button is clicked', () => {
            const clearButton = document.querySelector('.data-manager-button-danger');
            clearButton.click();
            
            expect(confirm).toHaveBeenCalled();
            expect(storageServiceMock.clearAllData).toHaveBeenCalled();
            expect(mainMock.showNotification).toHaveBeenCalledWith('All data cleared successfully. Please refresh the page to see the changes.', 'success');
        });
        
        test('should not clear data if user cancels confirmation', () => {
            confirm.mockReturnValueOnce(false);
            
            const clearButton = document.querySelector('.data-manager-button-danger');
            clearButton.click();
            
            expect(confirm).toHaveBeenCalled();
            expect(storageServiceMock.clearAllData).not.toHaveBeenCalled();
        });
    });
    
    describe('Backup functionality', () => {
        beforeEach(() => {
            DataManager.initDataManager();
            DataManager.showDataManager();
            
            // Mock localStorage for backup keys
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: jest.fn(),
                    setItem: jest.fn(),
                    removeItem: jest.fn(),
                    clear: jest.fn(),
                    key: jest.fn(),
                    length: 2
                },
                writable: true
            });
        });
        
        test('should create backup when create backup button is clicked', () => {
            // Find the create backup button (third button in the dialog)
            const buttons = document.querySelectorAll('.data-manager-button');
            const createBackupButton = Array.from(buttons).find(b => b.textContent === 'Create Backup');
            createBackupButton.click();
            
            expect(storageServiceMock.exportData).toHaveBeenCalled();
            expect(window.localStorage.setItem).toHaveBeenCalled();
            expect(mainMock.showNotification).toHaveBeenCalledWith('Backup created successfully.', 'success');
        });
        
        test('should show notification if no data to backup', () => {
            storageServiceMock.exportData.mockReturnValueOnce(null);
            
            const buttons = document.querySelectorAll('.data-manager-button');
            const createBackupButton = Array.from(buttons).find(b => b.textContent === 'Create Backup');
            createBackupButton.click();
            
            expect(mainMock.showNotification).toHaveBeenCalledWith('Failed to create backup: No data to backup', 'error');
        });
        
        test('should export roadmap only when export roadmap button is clicked', () => {
            const buttons = document.querySelectorAll('.data-manager-button');
            const exportRoadmapButton = Array.from(buttons).find(b => b.textContent === 'Export Roadmap Only');
            exportRoadmapButton.click();
            
            expect(storageServiceMock.loadRoadmap).toHaveBeenCalled();
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(URL.revokeObjectURL).toHaveBeenCalled();
            expect(mainMock.showNotification).toHaveBeenCalledWith('Roadmap exported successfully.', 'success');
        });
        
        test('should show notification if no roadmap data to export', () => {
            storageServiceMock.loadRoadmap.mockReturnValueOnce(null);
            
            const buttons = document.querySelectorAll('.data-manager-button');
            const exportRoadmapButton = Array.from(buttons).find(b => b.textContent === 'Export Roadmap Only');
            exportRoadmapButton.click();
            
            expect(mainMock.showNotification).toHaveBeenCalledWith('No roadmap data to export.', 'error');
        });
    });
});