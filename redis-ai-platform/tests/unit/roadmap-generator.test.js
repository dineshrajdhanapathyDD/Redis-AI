/**
 * Unit tests for the Roadmap Generator module
 */

// Mock CertificationDatabase
const certificationDatabaseMock = {
    getCertifications: jest.fn(),
    getCertificationById: jest.fn(),
    getCertificationsByProvider: jest.fn(),
    getCertificationsByLevel: jest.fn(),
    getCertificationsByDomain: jest.fn()
};

// Setup global objects
global.window = {
    CertificationRoadmap: {
        CertificationDatabase: certificationDatabaseMock
    }
};

// Import the module (this will use the mocks)
require('../../assets/js/certification-roadmap/roadmap-generator.js');

// Get the module
const RoadmapGenerator = window.CertificationRoadmap.RoadmapGenerator;

describe('Roadmap Generator', () => {
    beforeEach(() => {
        // Reset mock function calls
        jest.clearAllMocks();
        
        // Setup mock certification data
        const mockCertifications = [
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
            },
            {
                id: 'aws-sap',
                name: 'AWS Certified Solutions Architect - Professional',
                provider: 'aws',
                level: 'professional',
                domains: ['architecture'],
                prerequisites: ['aws-saa']
            },
            {
                id: 'azure-fundamentals',
                name: 'Microsoft Azure Fundamentals',
                provider: 'azure',
                level: 'foundational',
                domains: ['general'],
                prerequisites: []
            },
            {
                id: 'azure-admin',
                name: 'Microsoft Azure Administrator',
                provider: 'azure',
                level: 'associate',
                domains: ['administration'],
                prerequisites: ['azure-fundamentals']
            }
        ];
        
        certificationDatabaseMock.getCertifications.mockReturnValue(mockCertifications);
        
        // Setup mock getCertificationById
        certificationDatabaseMock.getCertificationById.mockImplementation((id) => {
            return mockCertifications.find(cert => cert.id === id);
        });
        
        // Setup mock getCertificationsByProvider
        certificationDatabaseMock.getCertificationsByProvider.mockImplementation((provider) => {
            return mockCertifications.filter(cert => cert.provider === provider);
        });
        
        // Setup mock getCertificationsByLevel
        certificationDatabaseMock.getCertificationsByLevel.mockImplementation((level) => {
            return mockCertifications.filter(cert => cert.level === level);
        });
        
        // Setup mock getCertificationsByDomain
        certificationDatabaseMock.getCertificationsByDomain.mockImplementation((domain) => {
            return mockCertifications.filter(cert => cert.domains.includes(domain));
        });
    });
    
    describe('generateRoadmap', () => {
        test('should generate roadmap based on assessment and career goals', () => {
            // Mock assessment data
            const assessment = {
                skills: {
                    aws: { level: 2, experience: 1 },
                    azure: { level: 1, experience: 0 }
                },
                domains: {
                    architecture: { level: 2, experience: 1 },
                    administration: { level: 1, experience: 0 }
                }
            };
            
            // Mock career goals data
            const careerGoals = {
                roles: ['architect'],
                interests: ['cloud-architecture'],
                priorities: {
                    salary: 4,
                    workLifeBalance: 3
                },
                targetTimeframe: 12 // months
            };
            
            // Generate roadmap
            const roadmap = RoadmapGenerator.generateRoadmap(assessment, careerGoals);
            
            // Verify roadmap structure
            expect(roadmap).toBeDefined();
            expect(roadmap.certifications).toBeDefined();
            expect(roadmap.certifications.length).toBeGreaterThan(0);
            expect(roadmap.paths).toBeDefined();
            expect(roadmap.timestamp).toBeDefined();
            
            // Verify AWS certifications are included (since AWS skill level is higher)
            const awsCerts = roadmap.certifications.filter(cert => cert.provider === 'aws');
            expect(awsCerts.length).toBeGreaterThan(0);
            
            // Verify architecture certifications are included (based on career goals)
            const architectureCerts = roadmap.certifications.filter(cert => 
                cert.domains && cert.domains.includes('architecture')
            );
            expect(architectureCerts.length).toBeGreaterThan(0);
            
            // Verify certification priorities are set
            roadmap.certifications.forEach(cert => {
                expect(cert.priority).toBeDefined();
            });
        });
        
        test('should handle empty assessment data', () => {
            // Empty assessment data
            const assessment = {
                skills: {},
                domains: {}
            };
            
            // Basic career goals
            const careerGoals = {
                roles: ['developer'],
                interests: ['development']
            };
            
            // Generate roadmap
            const roadmap = RoadmapGenerator.generateRoadmap(assessment, careerGoals);
            
            // Should still generate a roadmap with default recommendations
            expect(roadmap).toBeDefined();
            expect(roadmap.certifications).toBeDefined();
            expect(roadmap.certifications.length).toBeGreaterThan(0);
        });
        
        test('should handle empty career goals data', () => {
            // Basic assessment data
            const assessment = {
                skills: {
                    aws: { level: 2, experience: 1 }
                },
                domains: {
                    architecture: { level: 2, experience: 1 }
                }
            };
            
            // Empty career goals
            const careerGoals = {
                roles: [],
                interests: []
            };
            
            // Generate roadmap
            const roadmap = RoadmapGenerator.generateRoadmap(assessment, careerGoals);
            
            // Should still generate a roadmap based on assessment
            expect(roadmap).toBeDefined();
            expect(roadmap.certifications).toBeDefined();
            expect(roadmap.certifications.length).toBeGreaterThan(0);
            
            // Should include AWS certifications based on assessment
            const awsCerts = roadmap.certifications.filter(cert => cert.provider === 'aws');
            expect(awsCerts.length).toBeGreaterThan(0);
        });
    });
    
    describe('calculateCertificationPriority', () => {
        test('should prioritize certifications based on skills and career goals', () => {
            // Mock assessment data
            const assessment = {
                skills: {
                    aws: { level: 3, experience: 2 },
                    azure: { level: 1, experience: 0 }
                },
                domains: {
                    architecture: { level: 3, experience: 2 }
                }
            };
            
            // Mock career goals data
            const careerGoals = {
                roles: ['architect'],
                interests: ['cloud-architecture']
            };
            
            // AWS architect certification should have high priority
            const awsArchitectCert = {
                id: 'aws-saa',
                provider: 'aws',
                domains: ['architecture']
            };
            
            // Azure general certification should have lower priority
            const azureGeneralCert = {
                id: 'azure-fundamentals',
                provider: 'azure',
                domains: ['general']
            };
            
            // Calculate priorities
            const awsPriority = RoadmapGenerator.calculateCertificationPriority(
                awsArchitectCert, assessment, careerGoals
            );
            
            const azurePriority = RoadmapGenerator.calculateCertificationPriority(
                azureGeneralCert, assessment, careerGoals
            );
            
            // AWS architect cert should have higher priority
            expect(awsPriority).toBeGreaterThan(azurePriority);
        });
    });
    
    describe('buildCertificationPath', () => {
        test('should build path including prerequisites', () => {
            // Target certification that has prerequisites
            const targetCert = {
                id: 'aws-sap',
                prerequisites: ['aws-saa']
            };
            
            // Build path
            const path = RoadmapGenerator.buildCertificationPath(targetCert);
            
            // Path should include prerequisites in correct order
            expect(path).toEqual(['aws-ccp', 'aws-saa', 'aws-sap']);
        });
        
        test('should handle certification with no prerequisites', () => {
            // Target certification with no prerequisites
            const targetCert = {
                id: 'aws-ccp',
                prerequisites: []
            };
            
            // Build path
            const path = RoadmapGenerator.buildCertificationPath(targetCert);
            
            // Path should only include the target certification
            expect(path).toEqual(['aws-ccp']);
        });
    });
});