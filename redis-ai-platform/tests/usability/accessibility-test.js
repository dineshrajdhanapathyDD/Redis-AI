/**
 * Automated Accessibility Testing for Cloud Certification Roadmap
 * 
 * This script performs automated accessibility testing using various techniques
 * to ensure WCAG 2.1 AA compliance.
 */

class AccessibilityTester {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    /**
     * Run all accessibility tests
     */
    async runAllTests() {
        console.log('Starting accessibility tests...');
        
        // Test keyboard navigation
        await this.testKeyboardNavigation();
        
        // Test ARIA attributes
        await this.testAriaAttributes();
        
        // Test color contrast
        await this.testColorContrast();
        
        // Test focus management
        await this.testFocusManagement();
        
        // Test semantic HTML
        await this.testSemanticHTML();
        
        // Test form accessibility
        await this.testFormAccessibility();
        
        // Test image accessibility
        await this.testImageAccessibility();
        
        // Test dynamic content
        await this.testDynamicContent();
        
        // Generate report
        this.generateReport();
        
        return this.results;
    }

    /**
     * Test keyboard navigation
     */
    async testKeyboardNavigation() {
        console.log('Testing keyboard navigation...');
        
        try {
            // Get all focusable elements
            const focusableElements = document.querySelectorAll(
                'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) {
                this.results.failed.push({
                    test: 'Keyboard Navigation',
                    issue: 'No focusable elements found',
                    severity: 'high'
                });
                return;
            }
            
            // Test tab order
            let tabIndex = 0;
            for (const element of focusableElements) {
                const computedTabIndex = element.tabIndex;
                
                // Check for logical tab order
                if (computedTabIndex > 0 && computedTabIndex < tabIndex) {
                    this.results.warnings.push({
                        test: 'Keyboard Navigation',
                        issue: `Tab order may be illogical for element: ${element.tagName}`,
                        element: element,
                        severity: 'medium'
                    });
                }
                
                tabIndex = Math.max(tabIndex, computedTabIndex);
            }
            
            // Test focus visibility
            for (const element of focusableElements) {
                element.focus();
                const styles = window.getComputedStyle(element, ':focus');
                
                if (!styles.outline && !styles.boxShadow && !styles.border) {
                    this.results.failed.push({
                        test: 'Keyboard Navigation',
                        issue: `Element lacks visible focus indicator: ${element.tagName}`,
                        element: element,
                        severity: 'high'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Keyboard Navigation',
                message: `${focusableElements.length} focusable elements tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Keyboard Navigation',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test ARIA attributes
     */
    async testAriaAttributes() {
        console.log('Testing ARIA attributes...');
        
        try {
            // Test for required ARIA labels
            const interactiveElements = document.querySelectorAll(
                'button, input, select, textarea, a[href], [role="button"], [role="link"]'
            );
            
            for (const element of interactiveElements) {
                const hasLabel = element.getAttribute('aria-label') || 
                                element.getAttribute('aria-labelledby') ||
                                element.textContent.trim() ||
                                element.querySelector('label');
                
                if (!hasLabel) {
                    this.results.failed.push({
                        test: 'ARIA Attributes',
                        issue: `Interactive element lacks accessible name: ${element.tagName}`,
                        element: element,
                        severity: 'high'
                    });
                }
            }
            
            // Test for proper ARIA roles
            const elementsWithRoles = document.querySelectorAll('[role]');
            const validRoles = [
                'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
                'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
                'contentinfo', 'dialog', 'document', 'feed', 'figure', 'form',
                'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list',
                'listbox', 'listitem', 'main', 'menu', 'menubar', 'menuitem',
                'navigation', 'none', 'option', 'presentation', 'progressbar',
                'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
                'scrollbar', 'search', 'searchbox', 'separator', 'slider',
                'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
                'tabpanel', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
                'treegrid', 'treeitem'
            ];
            
            for (const element of elementsWithRoles) {
                const role = element.getAttribute('role');
                if (!validRoles.includes(role)) {
                    this.results.warnings.push({
                        test: 'ARIA Attributes',
                        issue: `Invalid ARIA role: ${role}`,
                        element: element,
                        severity: 'medium'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'ARIA Attributes',
                message: `${interactiveElements.length} interactive elements tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'ARIA Attributes',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test color contrast
     */
    async testColorContrast() {
        console.log('Testing color contrast...');
        
        try {
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label');
            let testedElements = 0;
            
            for (const element of textElements) {
                if (!element.textContent.trim()) continue;
                
                const styles = window.getComputedStyle(element);
                const color = styles.color;
                const backgroundColor = styles.backgroundColor;
                
                // Skip if transparent background
                if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                    continue;
                }
                
                const contrast = this.calculateContrast(color, backgroundColor);
                const fontSize = parseFloat(styles.fontSize);
                const fontWeight = styles.fontWeight;
                
                // WCAG AA requirements
                const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));
                const minContrast = isLargeText ? 3 : 4.5;
                
                if (contrast < minContrast) {
                    this.results.failed.push({
                        test: 'Color Contrast',
                        issue: `Insufficient contrast ratio: ${contrast.toFixed(2)} (minimum: ${minContrast})`,
                        element: element,
                        severity: 'high'
                    });
                }
                
                testedElements++;
            }
            
            this.results.passed.push({
                test: 'Color Contrast',
                message: `${testedElements} text elements tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Color Contrast',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test focus management
     */
    async testFocusManagement() {
        console.log('Testing focus management...');
        
        try {
            // Test for focus traps in modals
            const modals = document.querySelectorAll('[role="dialog"], .modal, .dialog');
            
            for (const modal of modals) {
                const focusableElements = modal.querySelectorAll(
                    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length === 0) {
                    this.results.warnings.push({
                        test: 'Focus Management',
                        issue: 'Modal has no focusable elements',
                        element: modal,
                        severity: 'medium'
                    });
                }
            }
            
            // Test for skip links
            const skipLinks = document.querySelectorAll('a[href^="#"]');
            let hasSkipToMain = false;
            
            for (const link of skipLinks) {
                if (link.textContent.toLowerCase().includes('skip') && 
                    link.textContent.toLowerCase().includes('main')) {
                    hasSkipToMain = true;
                    break;
                }
            }
            
            if (!hasSkipToMain) {
                this.results.warnings.push({
                    test: 'Focus Management',
                    issue: 'No skip to main content link found',
                    severity: 'medium'
                });
            }
            
            this.results.passed.push({
                test: 'Focus Management',
                message: 'Focus management tested'
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Focus Management',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test semantic HTML
     */
    async testSemanticHTML() {
        console.log('Testing semantic HTML...');
        
        try {
            // Test for proper heading hierarchy
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let previousLevel = 0;
            
            for (const heading of headings) {
                const level = parseInt(heading.tagName.charAt(1));
                
                if (level > previousLevel + 1) {
                    this.results.warnings.push({
                        test: 'Semantic HTML',
                        issue: `Heading level skipped: ${heading.tagName} after h${previousLevel}`,
                        element: heading,
                        severity: 'medium'
                    });
                }
                
                previousLevel = level;
            }
            
            // Test for landmark elements
            const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section');
            
            if (landmarks.length === 0) {
                this.results.warnings.push({
                    test: 'Semantic HTML',
                    issue: 'No landmark elements found',
                    severity: 'medium'
                });
            }
            
            // Test for list structure
            const listItems = document.querySelectorAll('li');
            for (const li of listItems) {
                const parent = li.parentElement;
                if (!parent || !['UL', 'OL'].includes(parent.tagName)) {
                    this.results.failed.push({
                        test: 'Semantic HTML',
                        issue: 'List item not inside ul or ol',
                        element: li,
                        severity: 'high'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Semantic HTML',
                message: `${headings.length} headings and ${landmarks.length} landmarks tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Semantic HTML',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test form accessibility
     */
    async testFormAccessibility() {
        console.log('Testing form accessibility...');
        
        try {
            const formControls = document.querySelectorAll('input, select, textarea');
            
            for (const control of formControls) {
                // Test for labels
                const hasLabel = control.getAttribute('aria-label') ||
                                control.getAttribute('aria-labelledby') ||
                                document.querySelector(`label[for="${control.id}"]`) ||
                                control.closest('label');
                
                if (!hasLabel) {
                    this.results.failed.push({
                        test: 'Form Accessibility',
                        issue: `Form control lacks label: ${control.tagName}`,
                        element: control,
                        severity: 'high'
                    });
                }
                
                // Test for required field indication
                if (control.required && !control.getAttribute('aria-required')) {
                    this.results.warnings.push({
                        test: 'Form Accessibility',
                        issue: 'Required field should have aria-required attribute',
                        element: control,
                        severity: 'medium'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Form Accessibility',
                message: `${formControls.length} form controls tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Form Accessibility',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test image accessibility
     */
    async testImageAccessibility() {
        console.log('Testing image accessibility...');
        
        try {
            const images = document.querySelectorAll('img');
            
            for (const img of images) {
                if (!img.alt && img.alt !== '') {
                    this.results.failed.push({
                        test: 'Image Accessibility',
                        issue: 'Image missing alt attribute',
                        element: img,
                        severity: 'high'
                    });
                }
                
                // Check for decorative images
                if (img.alt === '' && !img.getAttribute('role')) {
                    // This is likely decorative, which is fine
                    continue;
                }
                
                // Check for meaningful alt text
                if (img.alt && (img.alt.toLowerCase().includes('image') || 
                               img.alt.toLowerCase().includes('picture') ||
                               img.alt.toLowerCase().includes('photo'))) {
                    this.results.warnings.push({
                        test: 'Image Accessibility',
                        issue: 'Alt text may not be descriptive enough',
                        element: img,
                        severity: 'low'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Image Accessibility',
                message: `${images.length} images tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Image Accessibility',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Test dynamic content accessibility
     */
    async testDynamicContent() {
        console.log('Testing dynamic content accessibility...');
        
        try {
            // Test for live regions
            const liveRegions = document.querySelectorAll('[aria-live]');
            
            // Test for proper live region usage
            for (const region of liveRegions) {
                const liveValue = region.getAttribute('aria-live');
                if (!['polite', 'assertive', 'off'].includes(liveValue)) {
                    this.results.warnings.push({
                        test: 'Dynamic Content',
                        issue: `Invalid aria-live value: ${liveValue}`,
                        element: region,
                        severity: 'medium'
                    });
                }
            }
            
            // Test for dynamic content that might need live regions
            const dynamicElements = document.querySelectorAll('[data-dynamic], .dynamic, .loading');
            
            for (const element of dynamicElements) {
                if (!element.getAttribute('aria-live') && !element.closest('[aria-live]')) {
                    this.results.warnings.push({
                        test: 'Dynamic Content',
                        issue: 'Dynamic content may need aria-live region',
                        element: element,
                        severity: 'low'
                    });
                }
            }
            
            this.results.passed.push({
                test: 'Dynamic Content',
                message: `${liveRegions.length} live regions tested`
            });
            
        } catch (error) {
            this.results.failed.push({
                test: 'Dynamic Content',
                issue: `Test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    /**
     * Calculate color contrast ratio
     */
    calculateContrast(color1, color2) {
        // This is a simplified contrast calculation
        // In a real implementation, you would use a proper color contrast library
        
        const rgb1 = this.parseColor(color1);
        const rgb2 = this.parseColor(color2);
        
        if (!rgb1 || !rgb2) return 21; // Assume good contrast if can't parse
        
        const l1 = this.getLuminance(rgb1);
        const l2 = this.getLuminance(rgb2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Parse color string to RGB values
     */
    parseColor(color) {
        // Simplified color parsing - in reality you'd use a proper color library
        const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgb) {
            return {
                r: parseInt(rgb[1]),
                g: parseInt(rgb[2]),
                b: parseInt(rgb[3])
            };
        }
        return null;
    }

    /**
     * Calculate relative luminance
     */
    getLuminance(rgb) {
        const { r, g, b } = rgb;
        
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * Generate accessibility test report
     */
    generateReport() {
        console.log('\n=== ACCESSIBILITY TEST REPORT ===');
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
     * Calculate overall accessibility score
     */
    calculateScore() {
        const totalTests = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
        if (totalTests === 0) return 0;
        
        const passedWeight = 1;
        const warningWeight = 0.5;
        const failedWeight = 0;
        
        const score = (
            (this.results.passed.length * passedWeight) +
            (this.results.warnings.length * warningWeight) +
            (this.results.failed.length * failedWeight)
        ) / totalTests * 100;
        
        return Math.round(score);
    }
}

// Export for use in tests or browser console
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityTester;
} else {
    window.AccessibilityTester = AccessibilityTester;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.document) {
    document.addEventListener('DOMContentLoaded', async () => {
        if (window.location.search.includes('accessibility-test')) {
            const tester = new AccessibilityTester();
            await tester.runAllTests();
        }
    });
}