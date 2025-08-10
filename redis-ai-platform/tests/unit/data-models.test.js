/**
 * Unit tests for the Data Models module
 */

// Import the module
require('../../assets/js/certification-roadmap/data-models.js');

// Get the module
const DataModels = window.CertificationRoadmap.DataModels;

describe('Data Models', () => {
    describe('validateAssessment', () => {
        test('should validate valid assessment data', () => {
            const validData = {
                skills: {
                    aws: { level: 3, experience: 2 },
                    azure: { level: 2, experience: 1 }
                },
                domains: {
                    compute: { level: 3, experience: 2 },
                    storage: { level: 2, experience: 1 }
                },
                preferences: {
                    learningStyle: 'visual',
                    availableHoursPerWeek: 10,
                    budgetConstraints: 'medium'
                },
                timestamp: new Date().toISOString()
            };
            
            const result = DataModels.validateAssessment(validData);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        test('should invalidate assessment data with missing skills', () => {
            const invalidData = {
                domains: {
                    compute: { level: 3, experience: 2 }
                },
                preferences: {
                    learningStyle: 'visual'
                }
            };
            
            const result = DataModels.validateAssessment(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing skills data');
        });
        
        test('should invalidate assessment data with invalid skill levels', () => {
            const invalidData = {
                skills: {
                    aws: { level: 6, experience: 2 } // Level should be 0-5
                },
                domains: {
                    compute: { level: 3, experience: 2 }
                }
            };
            
            const result = DataModels.validateAssessment(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid skill level for aws');
        });
    });
    
    describe('validateCareerGoals', () => {
        test('should validate valid career goals data', () => {
            const validData = {
                roles: ['architect', 'developer'],
                interests: ['security', 'devops'],
                priorities: {
                    salary: 4,
                    workLifeBalance: 3,
                    learningOpportunities: 5
                },
                targetTimeframe: 12, // months
                timestamp: new Date().toISOString()
            };
            
            const result = DataModels.validateCareerGoals(validData);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        test('should invalidate career goals data with missing roles', () => {
            const invalidData = {
                interests: ['security', 'devops'],
                priorities: {
                    salary: 4
                }
            };
            
            const result = DataModels.validateCareerGoals(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing roles data');
        });
        
        test('should invalidate career goals data with invalid timeframe', () => {
            const invalidData = {
                roles: ['architect'],
                interests: ['security'],
                targetTimeframe: -1 // Should be positive
            };
            
            const result = DataModels.validateCareerGoals(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid target timeframe');
        });
    });
    
    describe('validateRoadmap', () => {
        test('should validate valid roadmap data', () => {
            const validData = {
                certifications: [
                    {
                        id: 'aws-ccp',
                        name: 'AWS Certified Cloud Practitioner',
                        provider: 'aws',
                        level: 'foundational',
                        priority: 1
                    },
                    {
                        id: 'aws-saa',
                        name: 'AWS Certified Solutions Architect - Associate',
                        provider: 'aws',
                        level: 'associate',
                        priority: 2,
                        prerequisites: ['aws-ccp']
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
            
            const result = DataModels.validateRoadmap(validData);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        test('should invalidate roadmap data with missing certifications', () => {
            const invalidData = {
                paths: [
                    {
                        id: 'aws-architect',
                        name: 'AWS Architect Path',
                        certifications: ['aws-ccp', 'aws-saa']
                    }
                ]
            };
            
            const result = DataModels.validateRoadmap(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing certifications data');
        });
        
        test('should invalidate roadmap data with invalid certification data', () => {
            const invalidData = {
                certifications: [
                    {
                        // Missing id
                        name: 'AWS Certified Cloud Practitioner',
                        provider: 'aws'
                    }
                ]
            };
            
            const result = DataModels.validateRoadmap(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid certification data');
        });
    });
    
    describe('validateStudyPlan', () => {
        test('should validate valid study plan data', () => {
            const validData = {
                certificationId: 'aws-saa',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                weeklyHours: 10,
                weeks: [
                    {
                        weekNumber: 1,
                        topics: ['EC2', 'S3'],
                        resources: ['resource-1', 'resource-2'],
                        totalHours: 10
                    },
                    {
                        weekNumber: 2,
                        topics: ['VPC', 'IAM'],
                        resources: ['resource-3', 'resource-4'],
                        totalHours: 10
                    }
                ],
                milestones: [
                    {
                        name: 'Complete EC2 and S3',
                        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        completed: false
                    }
                ],
                estimatedCompletionTime: {
                    months: 3,
                    weeks: 0
                },
                timestamp: new Date().toISOString()
            };
            
            const result = DataModels.validateStudyPlan(validData);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        test('should invalidate study plan data with missing certification ID', () => {
            const invalidData = {
                startDate: new Date().toISOString(),
                weeklyHours: 10,
                weeks: [
                    {
                        weekNumber: 1,
                        topics: ['EC2', 'S3']
                    }
                ]
            };
            
            const result = DataModels.validateStudyPlan(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing certification ID');
        });
        
        test('should invalidate study plan data with invalid weekly hours', () => {
            const invalidData = {
                certificationId: 'aws-saa',
                startDate: new Date().toISOString(),
                weeklyHours: -5, // Should be positive
                weeks: [
                    {
                        weekNumber: 1,
                        topics: ['EC2', 'S3']
                    }
                ]
            };
            
            const result = DataModels.validateStudyPlan(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid weekly hours');
        });
    });
    
    describe('convertDates', () => {
        test('should convert date strings to Date objects', () => {
            const now = new Date();
            const data = {
                timestamp: now.toISOString(),
                nestedData: {
                    date: now.toISOString()
                },
                arrayData: [
                    { date: now.toISOString() }
                ]
            };
            
            const result = DataModels.convertDates(data);
            
            expect(result.timestamp instanceof Date).toBe(true);
            expect(result.timestamp.getTime()).toBe(now.getTime());
            expect(result.nestedData.date instanceof Date).toBe(true);
            expect(result.nestedData.date.getTime()).toBe(now.getTime());
            expect(result.arrayData[0].date instanceof Date).toBe(true);
            expect(result.arrayData[0].date.getTime()).toBe(now.getTime());
        });
        
        test('should handle non-date strings', () => {
            const data = {
                timestamp: 'not a date',
                value: 42,
                nested: {
                    text: 'hello'
                }
            };
            
            const result = DataModels.convertDates(data);
            
            expect(result.timestamp).toBe('not a date');
            expect(result.value).toBe(42);
            expect(result.nested.text).toBe('hello');
        });
        
        test('should handle null and undefined values', () => {
            const data = {
                nullValue: null,
                undefinedValue: undefined,
                nested: {
                    nullValue: null
                }
            };
            
            const result = DataModels.convertDates(data);
            
            expect(result.nullValue).toBeNull();
            expect(result.undefinedValue).toBeUndefined();
            expect(result.nested.nullValue).toBeNull();
        });
    });
});