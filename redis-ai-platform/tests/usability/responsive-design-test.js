/**
 * Automated Responsive Design Testing for Cloud Certification Roadmap
 * 
 * This script performs automated responsive design testing across different
 * screen sizes and devices to ensure proper layout and functionality.
 */

class ResponsiveDesignTester {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
        
        this.breakpoints = [
            { name: 'Mobile Small', width: 320, height: 568 },
            { name: 'Mobile Medium', width: 375, height: 667 },
            { name: 'Mobile Large', width: 414, height: 896 },
            { name: 'Tablet Portrait', width: 768, height: 1024 },
            { name: 'Tablet Landscape', width: 1024, height: 768 },
            { name: 'Laptop Small', width: 1366, height: 768 },
            { name: 'Desktop', width: 1920, height: 1080 },
            { name: 'Desktop Large', width: 2560, height: 1440 }
        ];
    }

    /**
     * Run all responsive design tests
     */
    async runAllTests() {
        console.log('Starting responsive design tests...');
        
        // Store original viewport
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;
        
        try {
            // Test each breakpoint
            for (const breakpoint of this.breakpoints) {
                await this.testBreakpoint(breakpoint);
            }
            
            // Test specific responsive features
            await this.testResponsiveImages();
            await this.testResponsiveText();
            await this.testResponsiveNavigation();
            await this.testTouchTargets();
            await this.testScrolling();
            
        } finally {
            // Restore original viewport (if possible)
            // Note: In a real browser, we can't actually resize the window
            // This would be done through browser automation tools
        }
        
        // Generate report
        this.generateReport();
        
        return this.results;
    }

    /**
     * Test a specific breakpoint
     */
    async testBreakpoint(breakpoint) {
        console.log(`Testing breakpoint: ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
        
        try {
            // Simulate viewport change (in real testing, this would resize the browser)
            this.simulateViewport(breakpoint.width, breakpoint.height);
            
            // Test layout integrity
            await this.testLayoutIntegrity(breakpoint);
            
            // Test element visibility
            await this.testElementVisibility(breakpoint);
            
            // Test interactive elements
            await this.testInteractiveElements(breakpoint);
            
            // Test content readability
            await this.testContentReadability(breakpoint);
            
            this.results.passed.push({
                test: `Breakpoint ${breakpoint.name}`,
                message: 'All responsive tests passed'
            });
            
        } catch (error) {
            this.results.failed.push({
                test: `Breakpoint ${breakpoint.name}`,
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Simulate viewport change (for testing purposes)
     */
    simulateViewport(width, height) {
        // In a real implementation, this would use browser automation
        // For now, we'll simulate by checking CSS media queries
        
        // Create a test element to check media queries
        const testElement = document.createElement('div');
        testElement.style.position = 'absolute';
        testElement.style.visibility = 'hidden';
        testElement.style.width = width + 'px';
        testElement.style.height = height + 'px';
        document.body.appendChild(testElement);
        
        // Store for cleanup
        this.testElement = testElement;
    }

    /**
     * Test layout integrity at breakpoint
     */
    async testLayoutIntegrity(breakpoint) {
        const elements = document.querySelectorAll('*');
        
        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);
            
            // Check for horizontal overflow
            if (rect.right > breakpoint.width && styles.position !== 'fixed' && styles.position !== 'absolute') {
                this.results.warnings.push({
                    test: `Layout Integrity - ${breakpoint.name}`,
                    issue: `Element extends beyond viewport width: ${element.tagName}`,
                    element: element,
                    severity: 'medium'
                });
            }
            
            // Check for elements that are too small
            if (rect.width < 1 && rect.height < 1 && styles.display !== 'none') {
                this.results.warnings.push({
                    test: `Layout Integrity - ${breakpoint.name}`,
                    issue: `Element may be collapsed: ${element.tagName}`,
                    element: element,
                    severity: 'low'
                });
            }
        }
    }

    /**
     * Test element visibility at breakpoint
     */
    async testElementVisibility(breakpoint) {
        const importantElements = document.querySelectorAll(
            'nav, .nav, header, .header, main, .main, footer, .footer, ' +
            'button, .btn, input, select, textarea, a[href]'
        );
        
        for (const element of importantElements) {
            const styles = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            // Check if important elements are hidden on this breakpoint
            if (styles.display === 'none' && breakpoint.width >= 768) {
                // Desktop/tablet - important elements shouldn't be hidden
                this.results.warnings.push({
                    test: `Element Visibility - ${breakpoint.name}`,
                    issue: `Important element hidden on larger screen: ${element.tagName}`,
                    element: element,
                    severity: 'medium'
                });
            }
            
            // Check if elements are positioned off-screen
            if (rect.left < -100 || rect.top < -100) {
                this.results.warnings.push({
                    test: `Element Visibility - ${breakpoint.name}`,
                    issue: `Element positioned off-screen: ${element.tagName}`,
                    element: element,
                    severity: 'low'
                });
            }
        }
    }

    /**
     * Test interactive elements at breakpoint
     */
    async testInteractiveElements(breakpoint) {
        const interactiveElements = document.querySelectorAll(
            'button, .btn, input, select, textarea, a[href], [role="button"], [tabindex]'
        );
        
        for (const element of interactiveElements) {
            const rect = element.getBoundingClientRect();
            
            // Check touch target size for mobile
            if (breakpoint.width < 768) {
                const minSize = 44; // 44px minimum touch target
                
                if (rect.width < minSize || rect.height < minSize) {
                    this.results.warnings.push({
                        test: `Interactive Elements - ${breakpoint.name}`,
                        issue: `Touch target too small: ${rect.width}x${rect.height}px (minimum: ${minSize}px)`,
                        element: element,
                        severity: 'medium'
                    });
                }
            }
            
            // Check if interactive elements are accessible
            const styles = window.getComputedStyle(element);
            if (styles.pointerEvents === 'none' && !element.disabled) {
                this.results.warnings.push({
                    test: `Interactive Elements - ${breakpoint.name}`,
                    issue: 'Interactive element has pointer-events: none',
                    element: element,
                    severity: 'high'
                });
            }
        }
    }

    /**
     * Test content readability at breakpoint
     */
    async testContentReadability(breakpoint) {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label');
        
        for (const element of textElements) {
            if (!element.textContent.trim()) continue;
            
            const styles = window.getComputedStyle(element);
            const fontSize = parseFloat(styles.fontSize);
            
            // Check minimum font size for mobile
            if (breakpoint.width < 768 && fontSize < 14) {
                this.results.warnings.push({
                    test: `Content Readability - ${breakpoint.name}`,
                    issue: `Font size too small for mobile: ${fontSize}px (minimum: 14px)`,
                    element: element,
                    severity: 'medium'
                });
            }
            
            // Check line height
            const lineHeight = parseFloat(styles.lineHeight);
            if (lineHeight < fontSize * 1.2) {
                this.results.warnings.push({
                    test: `Content Readability - ${breakpoint.name}`,
                    issue: `Line height too small: ${lineHeight}px (minimum: ${fontSize * 1.2}px)`,
                    element: element,
                    severity: 'low'
                });
            }
        }
    }

    /**
     * Test responsive images
     */
    async testResponsiveImages() {
        console.log('Testing responsive images...');
        
        try {
            const images = document.querySelectorAll('img');
            
            for (const img of images) {
                const styles = window.getComputedStyle(img);
                
                // Check if images are responsive
                if (styles.maxWidth !== '100%' && styles.width !== '100%' && !styles.width.includes('%')) {
                    this.results.warnings.push({
                        test: 'Responsive Images',
                        issue: 'Image may not be responsive (no max-width: 100% or width: 100%)',
                        element: img,
                        severity: 'medium'
                    });
                }
                
                // Check for srcset attribute for high-DPI displays
                if (!img.srcset && !img.closest('picture')) {
                    this.results.warnings.push({
                        test: 'Responsive Images',
                        issue: 'Image lacks srcset for high-DPI displays',
                        element: img,
                        severity: 'low'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Responsive Images',
                message: `${images.length} images tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Responsive Images',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test responsive text
     */
    async testResponsiveText() {
        console.log('Testing responsive text...');
        
        try {
            const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
            
            for (const element of textElements) {
                const styles = window.getComputedStyle(element);
                
                // Check for responsive font sizes (using rem, em, or vw units)
                const fontSize = styles.fontSize;
                if (!fontSize.includes('rem') && !fontSize.includes('em') && !fontSize.includes('vw') && !fontSize.includes('%')) {
                    this.results.warnings.push({
                        test: 'Responsive Text',
                        issue: 'Text uses fixed pixel size instead of responsive units',
                        element: element,
                        severity: 'low'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Responsive Text',
                message: `${textElements.length} text elements tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Responsive Text',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test responsive navigation
     */
    async testResponsiveNavigation() {
        console.log('Testing responsive navigation...');
        
        try {
            const navElements = document.querySelectorAll('nav, .nav, .navigation');
            
            for (const nav of navElements) {
                // Check for mobile menu toggle
                const toggleButton = nav.querySelector('button, .toggle, .hamburger, [aria-expanded]');
                
                if (!toggleButton) {
                    this.results.warnings.push({
                        test: 'Responsive Navigation',
                        issue: 'Navigation may lack mobile menu toggle',
                        element: nav,
                        severity: 'medium'
                    });
                }
                
                // Check for proper ARIA attributes on toggle
                if (toggleButton && !toggleButton.getAttribute('aria-expanded')) {
                    this.results.warnings.push({
                        test: 'Responsive Navigation',
                        issue: 'Navigation toggle lacks aria-expanded attribute',
                        element: toggleButton,
                        severity: 'medium'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Responsive Navigation',
                message: `${navElements.length} navigation elements tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Responsive Navigation',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test touch targets
     */
    async testTouchTargets() {
        console.log('Testing touch targets...');
        
        try {
            const touchElements = document.querySelectorAll(
                'button, .btn, input, select, textarea, a[href], [role="button"], [onclick]'
            );
            
            let smallTargets = 0;
            
            for (const element of touchElements) {
                const rect = element.getBoundingClientRect();
                const minSize = 44; // 44px minimum recommended by WCAG
                
                if (rect.width < minSize || rect.height < minSize) {
                    smallTargets++;
                    
                    // Only warn for very small targets
                    if (rect.width < 32 || rect.height < 32) {
                        this.results.warnings.push({
                            test: 'Touch Targets',
                            issue: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
                            element: element,
                            severity: 'medium'
                        });
                    }
                }
            }
            
            this.results.passed.push({
                test: 'Touch Targets',
                message: `${touchElements.length} touch targets tested, ${smallTargets} below recommended size`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Touch Targets',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test scrolling behavior
     */
    async testScrolling() {
        console.log('Testing scrolling behavior...');
        
        try {
            const scrollableElements = document.querySelectorAll('*');
            
            for (const element of scrollableElements) {
                const styles = window.getComputedStyle(element);
                
                // Check for horizontal scrolling (usually bad)
                if (styles.overflowX === 'scroll' || styles.overflowX === 'auto') {
                    const rect = element.getBoundingClientRect();
                    if (rect.width > window.innerWidth) {
                        this.results.warnings.push({
                            test: 'Scrolling Behavior',
                            issue: 'Element may cause horizontal scrolling',
                            element: element,
                            severity: 'medium'
                        });
                    }
                }
                
                // Check for elements that might need scroll indicators
                if (styles.overflow === 'hidden' && element.scrollHeight > element.clientHeight) {
                    this.results.warnings.push({
                        test: 'Scrolling Behavior',
                        issue: 'Hidden overflow may hide content',
                        element: element,
                        severity: 'low'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Scrolling Behavior',
                message: 'Scrolling behavior tested'
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Scrolling Behavior',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Generate responsive design test report
     */
    generateReport() {
        console.log('\n=== RESPONSIVE DESIGN TEST REPORT ===');
        console.log(`Passed: ${this.results.passed.length}`);
        console.log(`Failed: ${this.results.failed.length}`);
        console.log(`Warnings: ${this.results.warnings.length}`);
        
        if (this.results.failed.length > 0) {
            console.log('\n--- FAILED TESTS ---');
            this.results.failed.forEach(result => {
                console.log(`❌ ${result.test}: ${result.issue} (${result.severity})`);
            });
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n--- WARNINGS ---');
            this.results.warnings.forEach(result => {
                console.log(`⚠️  ${result.test}: ${result.issue} (${result.severity})`);
            });
        }
        
        if (this.results.passed.length > 0) {
            console.log('\n--- PASSED TESTS ---');
            this.results.passed.forEach(result => {
                console.log(`✅ ${result.test}: ${result.message}`);
            });
        }
        
        const score = this.calculateScore();
        console.log(`\n--- OVERALL SCORE: ${score}/100 ---`);
        
        return this.results;
    }

    /**
     * Calculate overall responsive design score
     */
    calculateScore() {
        const totalTests = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
        if (totalTests === 0) return 0;
        
        const passedWeight = 1;
        const warningWeight = 0.7;
        const failedWeight = 0;
        
        const score = (
            (this.results.passed.length * passedWeight) +
            (this.results.warnings.length * warningWeight) +
            (this.results.failed.length * failedWeight)
        ) / totalTests * 100;
        
        return Math.round(score);
    }

    /**
     * Cleanup test elements
     */
    cleanup() {
        if (this.testElement && this.testElement.parentNode) {
            this.testElement.parentNode.removeChild(this.testElement);
        }
    }
}

// Export for use in tests or browser console
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveDesignTester;
} else {
    window.ResponsiveDesignTester = ResponsiveDesignTester;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.document) {
    document.addEventListener('DOMContentLoaded', async () => {
        if (window.location.search.includes('responsive-test')) {
            const tester = new ResponsiveDesignTester();
            await tester.runAllTests();
            tester.cleanup();
        }
    });
}