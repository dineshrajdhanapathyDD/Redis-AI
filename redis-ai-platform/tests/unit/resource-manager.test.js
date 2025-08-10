/**
 * Unit tests for the Resource Manager module
 */

// Mock document and body
document.body = document.createElement('body');

// Mock ResourceRecommender
const resourceRecommenderMock = {
    getResourcesForCertification: jest.fn(),
    recommendResources: jest.fn(),
    getResourceById: jest.fn()
};

// Mock StorageService
const storageServiceMock = {
    loadResourceData: jest.fn(),
    saveResourceData: jest.fn(),
    loadSavedResources: jest.fn().mockReturnValue([]),
    saveSavedResources: jest.fn()
};

// Mock Main
const mainMock = {
    showNotification: jest.fn()
};

// Setup global objects
global.window = {
    CertificationRoadmap: {
        ResourceRecommender: resourceRecommenderMock,
        StorageService: storageServiceMock,
        Main: mainMock
    }
};

// Import the module (this will use the mocks)
require('../../assets/js/certification-roadmap/resource-manager.js');

// Get the module
const ResourceManager = window.CertificationRoadmap.ResourceManager;

describe('Resource Manager', () => {
    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
        
        // Create container element
        const container = document.createElement('div');
        container.id = 'resources-container';
        document.body.appendChild(container);
        
        // Setup mock resources
        const mockResources = [
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
            },
            {
                id: 'resource-2',
                title: 'AWS Solutions Architect Associate Course',
                provider: 'Udemy',
                format: 'course',
                description: 'Comprehensive course for the AWS SAA exam',
                url: 'https://example.com/aws-saa',
                cost: { type: 'paid', amount: 19.99, currency: '$' },
                difficulty: 'intermediate',
                duration: { hours: 40 },
                certifications: ['aws-saa'],
                ratings: { average: 4.8, count: 500 }
            }
        ];
        
        resourceRecommenderMock.getResourcesForCertification.mockReturnValue(mockResources);
        resourceRecommenderMock.recommendResources.mockReturnValue(mockResources);
        
        resourceRecommenderMock.getResourceById.mockImplementation((id) => {
            return mockResources.find(resource => resource.id === id);
        });
    });
    
    describe('initManager', () => {
        test('should initialize resource manager', async () => {
            await ResourceManager.initManager('resources-container');
            
            // Container should be populated
            const container = document.getElementById('resources-container');
            expect(container.innerHTML).not.toBe('');
        });
        
        test('should reject if container not found', async () => {
            await expect(ResourceManager.initManager('non-existent-container')).rejects.toThrow();
        });
    });
    
    describe('displayResourcesForRoadmap', () => {
        test('should display resources for roadmap', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Mock roadmap data
            const roadmap = {
                certifications: [
                    { id: 'aws-ccp', name: 'AWS Certified Cloud Practitioner' },
                    { id: 'aws-saa', name: 'AWS Certified Solutions Architect - Associate' }
                ]
            };
            
            // Display resources
            ResourceManager.displayResourcesForRoadmap(roadmap);
            
            // Should call getResourcesForCertification for each certification
            expect(resourceRecommenderMock.getResourcesForCertification).toHaveBeenCalledTimes(2);
            expect(resourceRecommenderMock.getResourcesForCertification).toHaveBeenCalledWith('aws-ccp');
            expect(resourceRecommenderMock.getResourcesForCertification).toHaveBeenCalledWith('aws-saa');
            
            // Container should have resource cards
            const container = document.getElementById('resources-container');
            expect(container.querySelectorAll('.resource-card').length).toBeGreaterThan(0);
        });
        
        test('should handle empty roadmap', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Mock empty roadmap data
            const roadmap = {
                certifications: []
            };
            
            // Display resources
            ResourceManager.displayResourcesForRoadmap(roadmap);
            
            // Should not call getResourcesForCertification
            expect(resourceRecommenderMock.getResourcesForCertification).not.toHaveBeenCalled();
            
            // Container should show no resources message
            const container = document.getElementById('resources-container');
            expect(container.textContent).toContain('No resources found');
        });
    });
    
    describe('displayResourcesForCertification', () => {
        test('should display resources for certification', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Display resources for certification
            ResourceManager.displayResourcesForCertification('aws-ccp');
            
            // Should call getResourcesForCertification
            expect(resourceRecommenderMock.getResourcesForCertification).toHaveBeenCalledWith('aws-ccp');
            
            // Container should have resource cards
            const container = document.getElementById('resources-container');
            expect(container.querySelectorAll('.resource-card').length).toBeGreaterThan(0);
        });
        
        test('should handle no resources found', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Mock no resources
            resourceRecommenderMock.getResourcesForCertification.mockReturnValueOnce([]);
            
            // Display resources for certification
            ResourceManager.displayResourcesForCertification('non-existent-cert');
            
            // Should call getResourcesForCertification
            expect(resourceRecommenderMock.getResourcesForCertification).toHaveBeenCalledWith('non-existent-cert');
            
            // Container should show no resources message
            const container = document.getElementById('resources-container');
            expect(container.textContent).toContain('No resources found');
        });
    });
    
    describe('saveResource', () => {
        test('should save resource', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Mock saved resources
            storageServiceMock.loadSavedResources.mockReturnValueOnce([]);
            
            // Save resource
            ResourceManager.saveResource('resource-1');
            
            // Should call getResourceById
            expect(resourceRecommenderMock.getResourceById).toHaveBeenCalledWith('resource-1');
            
            // Should call saveSavedResources
            expect(storageServiceMock.saveSavedResources).toHaveBeenCalled();
            
            // Should show notification
            expect(mainMock.showNotification).toHaveBeenCalledWith('Resource saved successfully', 'success');
        });
        
        test('should not save already saved resource', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Mock already saved resource
            storageServiceMock.loadSavedResources.mockReturnValueOnce([
                { id: 'resource-1', title: 'AWS Certified Cloud Practitioner Study Guide' }
            ]);
            
            // Try to save resource again
            ResourceManager.saveResource('resource-1');
            
            // Should call getResourceById
            expect(resourceRecommenderMock.getResourceById).toHaveBeenCalledWith('resource-1');
            
            // Should not call saveSavedResources
            expect(storageServiceMock.saveSavedResources).not.toHaveBeenCalled();
            
            // Should show notification
            expect(mainMock.showNotification).toHaveBeenCalledWith('Resource already saved', 'info');
        });
        
        test('should handle resource not found', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Mock resource not found
            resourceRecommenderMock.getResourceById.mockReturnValueOnce(null);
            
            // Try to save non-existent resource
            ResourceManager.saveResource('non-existent-resource');
            
            // Should call getResourceById
            expect(resourceRecommenderMock.getResourceById).toHaveBeenCalledWith('non-existent-resource');
            
            // Should not call saveSavedResources
            expect(storageServiceMock.saveSavedResources).not.toHaveBeenCalled();
        });
    });
    
    describe('filterResources', () => {
        test('should filter resources by provider', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Display resources
            ResourceManager.displayResourcesForCertification('aws-ccp');
            
            // Apply filter
            ResourceManager.filterResources({ provider: 'Amazon' });
            
            // Container should have filtered resource cards
            const container = document.getElementById('resources-container');
            const resourceCards = container.querySelectorAll('.resource-card');
            
            // Should only show Amazon resources
            expect(resourceCards.length).toBe(1);
            expect(resourceCards[0].textContent).toContain('Amazon');
        });
        
        test('should filter resources by format', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Display resources
            ResourceManager.displayResourcesForCertification('aws-ccp');
            
            // Apply filter
            ResourceManager.filterResources({ format: 'book' });
            
            // Container should have filtered resource cards
            const container = document.getElementById('resources-container');
            const resourceCards = container.querySelectorAll('.resource-card');
            
            // Should only show book resources
            expect(resourceCards.length).toBe(1);
            expect(resourceCards[0].textContent).toContain('AWS Certified Cloud Practitioner Study Guide');
        });
        
        test('should handle no matching resources', async () => {
            // Initialize manager
            await ResourceManager.initManager('resources-container');
            
            // Display resources
            ResourceManager.displayResourcesForCertification('aws-ccp');
            
            // Apply filter with no matches
            ResourceManager.filterResources({ provider: 'Non-existent Provider' });
            
            // Container should show no resources message
            const container = document.getElementById('resources-container');
            expect(container.textContent).toContain('No resources match your filters');
        });
    });
});