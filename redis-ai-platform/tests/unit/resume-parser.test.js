/**
 * Unit tests for the Resume Parser Module
 * 
 * Tests the functionality of the resume-parser.js module, focusing on keyword extraction
 */

describe('ResumeParserModule', () => {
    // Mock the global window object with the ResumeParserModule
    const mockExtractSections = jest.fn().mockImplementation((text) => {
        return {
            contactInfo: 'John Doe\njohndoe@example.com\n(555) 123-4567\nNew York, NY',
            summary: 'Experienced software engineer with expertise in JavaScript and React.',
            education: 'Bachelor of Science in Computer Science\nUniversity of Technology\nGraduated: 2020',
            experience: 'Senior Software Engineer\nTech Company Inc.\n2020 - Present\n- Developed web applications using React and Node.js\n- Implemented CI/CD pipelines',
            skills: 'JavaScript, React, Node.js, TypeScript, HTML, CSS, Git, Docker, AWS, Agile, Communication, Teamwork',
            projects: 'E-commerce Platform, Data Visualization Dashboard',
            certifications: 'AWS Certified Developer',
            languages: 'English (Native), Spanish (Intermediate)',
            references: 'Available upon request',
            other: ''
        };
    });

    // Setup the mock module
    beforeAll(() => {
        global.window = {
            ResumeParserModule: {
                extractSections: mockExtractSections,
                extractKeywords: jest.requireActual('../portfolio-website/assets/js/resume-parser').ResumeParserModule.extractKeywords
            }
        };
    });

    // Clean up after tests
    afterAll(() => {
        delete global.window;
    });

    describe('extractKeywords', () => {
        // Sample resume text for testing
        const sampleResumeText = `
            John Doe
            johndoe@example.com
            (555) 123-4567
            New York, NY
            
            SUMMARY
            Experienced software engineer with 5+ years of expertise in JavaScript, React, and Node.js.
            Passionate about building scalable web applications and mentoring junior developers.
            
            EXPERIENCE
            Senior Software Engineer
            Tech Company Inc.
            2020 - Present
            - Developed responsive web applications using React and Redux
            - Implemented RESTful APIs using Node.js and Express
            - Set up CI/CD pipelines with Jenkins and Docker
            - Reduced application load time by 40% through code optimization
            - Mentored junior developers and conducted code reviews
            
            Frontend Developer
            Digital Solutions LLC
            2018 - 2020
            - Built interactive user interfaces with JavaScript and React
            - Collaborated with UX designers to implement responsive designs
            - Integrated third-party APIs and services
            - Participated in agile development processes
            
            EDUCATION
            Bachelor of Science in Computer Science
            University of Technology
            Graduated: 2018
            GPA: 3.8/4.0
            
            SKILLS
            Programming: JavaScript, TypeScript, HTML, CSS, Python
            Frontend: React, Redux, Angular, Vue.js, Webpack
            Backend: Node.js, Express, MongoDB, PostgreSQL
            DevOps: Git, Docker, Jenkins, AWS, CI/CD
            Soft Skills: Communication, Teamwork, Problem Solving, Leadership
            
            CERTIFICATIONS
            AWS Certified Developer - Associate
            MongoDB Certified Developer
            
            LANGUAGES
            English (Native), Spanish (Intermediate)
        `;

        test('should extract keywords from resume text', () => {
            // Call the function
            const keywords = window.ResumeParserModule.extractKeywords(sampleResumeText);
            
            // Verify the result is an array
            expect(Array.isArray(keywords)).toBe(true);
            
            // Verify we have keywords
            expect(keywords.length).toBeGreaterThan(0);
            
            // Verify the structure of keyword objects
            keywords.forEach(keyword => {
                expect(keyword).toHaveProperty('keyword');
                expect(keyword).toHaveProperty('type');
                expect(keyword).toHaveProperty('category');
                expect(keyword).toHaveProperty('frequency');
                expect(keyword).toHaveProperty('relevance');
            });
        });

        test('should identify technical keywords correctly', () => {
            const keywords = window.ResumeParserModule.extractKeywords(sampleResumeText);
            
            // Filter technical keywords
            const technicalKeywords = keywords.filter(k => k.type === 'technical');
            
            // Verify we have technical keywords
            expect(technicalKeywords.length).toBeGreaterThan(0);
            
            // Check for specific technical keywords that should be found
            const technicalTerms = ['javascript', 'react', 'node.js', 'express', 'mongodb'];
            technicalTerms.forEach(term => {
                const found = technicalKeywords.some(k => 
                    k.keyword.toLowerCase() === term || 
                    k.keyword.toLowerCase().includes(term)
                );
                expect(found).toBe(true);
            });
        });

        test('should identify soft skills correctly', () => {
            const keywords = window.ResumeParserModule.extractKeywords(sampleResumeText);
            
            // Filter soft skills
            const softSkills = keywords.filter(k => k.type === 'soft');
            
            // Verify we have soft skills
            expect(softSkills.length).toBeGreaterThan(0);
            
            // Check for specific soft skills that should be found
            const softTerms = ['communication', 'teamwork', 'leadership'];
            softTerms.forEach(term => {
                const found = softSkills.some(k => 
                    k.keyword.toLowerCase() === term || 
                    k.keyword.toLowerCase().includes(term)
                );
                expect(found).toBe(true);
            });
        });

        test('should calculate keyword frequency correctly', () => {
            const keywords = window.ResumeParserModule.extractKeywords(sampleResumeText);
            
            // Find a keyword that appears multiple times
            const reactKeyword = keywords.find(k => 
                k.keyword.toLowerCase() === 'react' || 
                k.keyword.toLowerCase().includes('react')
            );
            
            // Verify the frequency is correct (React appears 3 times in the sample text)
            expect(reactKeyword).toBeDefined();
            expect(reactKeyword.frequency).toBeGreaterThanOrEqual(3);
        });

        test('should calculate relevance scores', () => {
            const keywords = window.ResumeParserModule.extractKeywords(sampleResumeText);
            
            // All keywords should have a relevance score between 0 and 100
            keywords.forEach(keyword => {
                expect(keyword.relevance).toBeGreaterThanOrEqual(0);
                expect(keyword.relevance).toBeLessThanOrEqual(100);
            });
            
            // Keywords in the skills section should have higher relevance
            const skillsKeywords = keywords.filter(k => k.contextScore >= 3);
            expect(skillsKeywords.length).toBeGreaterThan(0);
            
            // The average relevance of skills keywords should be high
            const avgRelevance = skillsKeywords.reduce((sum, k) => sum + k.relevance, 0) / skillsKeywords.length;
            expect(avgRelevance).toBeGreaterThan(70);
        });

        test('should identify related terms for keywords', () => {
            const keywords = window.ResumeParserModule.extractKeywords(sampleResumeText);
            
            // Some keywords should have related terms
            const keywordsWithRelatedTerms = keywords.filter(k => k.relatedTerms && k.relatedTerms.length > 0);
            expect(keywordsWithRelatedTerms.length).toBeGreaterThan(0);
            
            // Check specific examples
            const jsKeyword = keywords.find(k => 
                k.keyword.toLowerCase() === 'javascript' || 
                k.keyword.toLowerCase() === 'js'
            );
            
            if (jsKeyword && jsKeyword.relatedTerms) {
                expect(jsKeyword.relatedTerms.some(term => 
                    term.toLowerCase() === 'js' || 
                    term.toLowerCase() === 'javascript' ||
                    term.toLowerCase() === 'ecmascript'
                )).toBe(true);
            }
        });

        test('should handle resumes with minimal content', () => {
            const minimalResume = `
                John Doe
                johndoe@example.com
                
                Skills: JavaScript, HTML
            `;
            
            const keywords = window.ResumeParserModule.extractKeywords(minimalResume);
            
            // Should still extract some keywords
            expect(keywords.length).toBeGreaterThan(0);
            
            // Should find JavaScript and HTML
            expect(keywords.some(k => k.keyword.toLowerCase() === 'javascript')).toBe(true);
            expect(keywords.some(k => k.keyword.toLowerCase() === 'html')).toBe(true);
        });
    });
});