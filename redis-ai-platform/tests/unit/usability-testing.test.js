/**
 * Unit tests for the Usability Testing module
 */

// Mock document and body
document.body = document.createElement('body');

// Mock URL search params
const mockURLSearchParams = {
    has: jest.fn()
};
global.URLSearchParams = jest.fn(() => mockURLSearchParams);

// Import the module
require('../../assets/js/certification-roadmap/usability-testing.js');

// Get the module
const UsabilityTesting = window.CertificationRoadmap.UsabilityTesting;

describe('Usability Testing', () => {
    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
    });
    
    describe('init', () => {
        test('should initialize usability testing when test mode is enabled', () => {
            // Mock test mode enabled
            mockURLSearchParams.has.mockReturnValue(true);
            
            // Initialize usability testing
            UsabilityTesting.init();
            
            // Check if test mode is enabled
            expect(UsabilityTesting.isTestModeEnabled()).toBe(true);
            
            // Check if test mode indicator was added
            const indicator = document.querySelector('.usability-test-indicator');
            expect(indicator).not.toBeNull();
            
            // Check if task buttons were added
            const taskButtons = document.querySelector('.usability-test-task-buttons');
            expect(taskButtons).not.toBeNull();
        });
        
        test('should not initialize usability testing when test mode is disabled', () => {
            // Mock test mode disabled
            mockURLSearchParams.has.mockReturnValue(false);
            
            // Initialize usability testing
            UsabilityTesting.init();
            
            // Check if test mode is disabled
            expect(UsabilityTesting.isTestModeEnabled()).toBe(false);
            
            // Check if test mode indicator was not added
            const indicator = document.querySelector('.usability-test-indicator');
            expect(indicator).toBeNull();
            
            // Check if task buttons were not added
            const taskButtons = document.querySelector('.usability-test-task-buttons');
            expect(taskButtons).toBeNull();
        });
    });
    
    describe('exportResults', () => {
        test('should export test results', () => {
            // Mock test mode enabled
            mockURLSearchParams.has.mockReturnValue(true);
            
            // Mock URL.createObjectURL
            const mockURL = 'blob:test';
            global.URL.createObjectURL = jest.fn(() => mockURL);
            
            // Mock document.createElement
            const mockAnchor = {
                href: '',
                download: '',
                click: jest.fn()
            };
            document.createElement = jest.fn().mockImplementation((tag) => {
                if (tag === 'a') {
                    return mockAnchor;
                }
                return document.createElement(tag);
            });
            
            // Initialize usability testing
            UsabilityTesting.init();
            
            // Export results
            UsabilityTesting.exportResults();
            
            // Check if URL.createObjectURL was called
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            
            // Check if anchor was created and clicked
            expect(mockAnchor.href).toBe(mockURL);
            expect(mockAnchor.download).toContain('usability-test-results-');
            expect(mockAnchor.click).toHaveBeenCalled();
        });
    });
});