/**
 * Comprehensive Usability Testing Runner
 * 
 * This script runs all usability tests for the Cloud Certification Roadmap
 * and generates a comprehensive report.
 */

// Import test modules (in a real environment, these would be proper imports)
// For now, we'll assume they're loaded in the browser

class UsabilityTestRunner {
    constructor() {
        this.results = {
            accessibility: null,
            responsiveDesign: null,
            userExperience: null,
            performance: null,
            overall: null
        };
        
        this.startTime = new Date();
    }

    /**
     * Run all usability tests
     */
    async runAllTests() {
        console.log('🚀 Starting comprehensive usability testing...');
        console.log('='.repeat(50));
        
        try {
            // Run accessibility tests
            await this.runAccessibilityTests();
            
            // Run responsive design tests
            await this.runResponsiveDesignTests();
            
            // Run user experience tests
            await this.runUserExperienceTests();
            
            // Run performance tests
            await this.runPerformanceTests();
            
            // Generate comprehensive report
            await this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ Error running usability tests:', error);
        }
        
        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000;
        console.log(`\n⏱️  Total test duration: ${duration.toFixed(2)} seconds`);
        
        return this.results;
    }

    /**
     * Run accessibility tests
     */
    async runAccessibilityTests() {
        console.log('\n🔍 Running Accessibility Tests...');
        console.log('-'.repeat(30));
        
        try {
            if (typeof AccessibilityTester !== 'undefined') {
                const tester = new AccessibilityTester();
                this.results.accessibility = await tester.runAllTests();
            } else {
                console.log('⚠️  AccessibilityTester not available, running basic checks...');
                this.results.accessibility = await this.runBasicAccessibilityTests();
            }
        } catch (error) {
            console.error('❌ Accessibility tests failed:', error);
            this.results.accessibility = { passed: [], failed: [{ test: 'Accessibility', issue: error.message }], warnings: [] };
        }
    }

    /**
     * Run responsive design tests
     */
    async runResponsiveDesignTests() {
        console.log('\n📱 Running Responsive Design Tests...');
        console.log('-'.repeat(30));
        
        try {
            if (typeof ResponsiveDesignTester !== 'undefined') {
                const tester = new ResponsiveDesignTester();
                this.results.responsiveDesign = await tester.runAllTests();
                tester.cleanup();
            } else {
                console.log('⚠️  ResponsiveDesignTester not available, running basic checks...');
                this.results.responsiveDesign = await this.runBasicResponsiveTests();
            }
        } catch (error) {
            console.error('❌ Responsive design tests failed:', error);
            this.results.responsiveDesign = { passed: [], failed: [{ test: 'Responsive Design', issue: error.message }], warnings: [] };
        }
    }

    /**
     * Run user experience tests
     */
    async runUserExperienceTests() {
        console.log('\n👤 Running User Experience Tests...');
        console.log('-'.repeat(30));
        
        try {
            this.results.userExperience = await this.runUXTests();
        } catch (error) {
            console.error('❌ User experience tests failed:', error);
            this.results.userExperience = { passed: [], failed: [{ test: 'User Experience', issue: error.message }], warnings: [] };
        }
    }

    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        console.log('\n⚡ Running Performance Tests...');
        console.log('-'.repeat(30));
        
        try {
            this.results.performance = await this.runPerformanceChecks();
        } catch (error) {
            console.error('❌ Performance tests failed:', error);
            this.results.performance = { passed: [], failed: [{ test: 'Performance', issue: error.message }], warnings: [] };
        }
    }

    /**
     * Run basic accessibility tests (fallback)
     */
    async runBasicAccessibilityTests() {
        const results = { passed: [], failed: [], warnings: [] };
        
        // Check for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        let hasSkipToMain = false;
        for (const link of skipLinks) {
            if (link.textContent.toLowerCase().includes('skip') && 
                link.textContent.toLowerCase().includes('main')) {
                hasSkipToMain = true;
                break;
            }
        }
        
        if (hasSkipToMain) {
            results.passed.push({ test: 'Skip Links', message: 'Skip to main content link found' });
        } else {
            results.warnings.push({ test: 'Skip Links', issue: 'No skip to main content link found', severity: 'medium' });
        }
        
        // Check for alt text on images
        const images = document.querySelectorAll('img');
        let imagesWithoutAlt = 0;
        for (const img of images) {
            if (!img.alt && img.alt !== '') {
                imagesWithoutAlt++;
            }
        }
        
        if (imagesWithoutAlt === 0) {
            results.passed.push({ test: 'Image Alt Text', message: `All ${images.length} images have alt text` });
        } else {
            results.failed.push({ test: 'Image Alt Text', issue: `${imagesWithoutAlt} images missing alt text`, severity: 'high' });
        }
        
        // Check for form labels
        const inputs = document.querySelectorAll('input, select, textarea');
        let inputsWithoutLabels = 0;
        for (const input of inputs) {
            const hasLabel = input.getAttribute('aria-label') ||
                            input.getAttribute('aria-labelledby') ||
                            document.querySelector(`label[for="${input.id}"]`) ||
                            input.closest('label');
            if (!hasLabel) {
                inputsWithoutLabels++;
            }
        }
        
        if (inputsWithoutLabels === 0) {
            results.passed.push({ test: 'Form Labels', message: `All ${inputs.length} form controls have labels` });
        } else {
            results.failed.push({ test: 'Form Labels', issue: `${inputsWithoutLabels} form controls missing labels`, severity: 'high' });
        }
        
        return results;
    }

    /**
     * Run basic responsive tests (fallback)
     */
    async runBasicResponsiveTests() {
        const results = { passed: [], failed: [], warnings: [] };
        
        // Check viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            results.passed.push({ test: 'Viewport Meta Tag', message: 'Viewport meta tag found' });
        } else {
            results.failed.push({ test: 'Viewport Meta Tag', issue: 'No viewport meta tag found', severity: 'high' });
        }
        
        // Check for responsive images
        const images = document.querySelectorAll('img');
        let responsiveImages = 0;
        for (const img of images) {
            const styles = window.getComputedStyle(img);
            if (styles.maxWidth === '100%' || styles.width === '100%' || styles.width.includes('%')) {
                responsiveImages++;
            }
        }
        
        if (responsiveImages === images.length) {
            results.passed.push({ test: 'Responsive Images', message: `All ${images.length} images are responsive` });
        } else {
            results.warnings.push({ test: 'Responsive Images', issue: `${images.length - responsiveImages} images may not be responsive`, severity: 'medium' });
        }
        
        return results;
    }

    /**
     * Run user experience tests
     */
    async runUXTests() {
        const results = { passed: [], failed: [], warnings: [] };
        
        // Check for loading indicators
        const loadingElements = document.querySelectorAll('.loading, .spinner, [aria-busy="true"]');
        if (loadingElements.length > 0) {
            results.passed.push({ test: 'Loading Indicators', message: `${loadingElements.length} loading indicators found` });
        } else {
            results.warnings.push({ test: 'Loading Indicators', issue: 'No loading indicators found', severity: 'low' });
        }
        
        // Check for error messages
        const errorElements = document.querySelectorAll('.error, .alert, [role="alert"]');
        results.passed.push({ test: 'Error Handling', message: `${errorElements.length} error handling elements found` });
        
        // Check for progress indicators
        const progressElements = document.querySelectorAll('.progress, .step, [role="progressbar"]');
        if (progressElements.length > 0) {
            results.passed.push({ test: 'Progress Indicators', message: `${progressElements.length} progress indicators found` });
        } else {
            results.warnings.push({ test: 'Progress Indicators', issue: 'No progress indicators found', severity: 'low' });
        }
        
        // Check for confirmation dialogs
        const confirmElements = document.querySelectorAll('[role="dialog"], .modal, .confirm');
        results.passed.push({ test: 'Confirmation Dialogs', message: `${confirmElements.length} dialog elements found` });
        
        // Check for help/documentation
        const helpElements = document.querySelectorAll('.help, .tooltip, [aria-describedby]');
        if (helpElements.length > 0) {
            results.passed.push({ test: 'Help & Documentation', message: `${helpElements.length} help elements found` });
        } else {
            results.warnings.push({ test: 'Help & Documentation', issue: 'Limited help elements found', severity: 'low' });
        }
        
        return results;
    }

    /**
     * Run performance checks
     */
    async runPerformanceChecks() {
        const results = { passed: [], failed: [], warnings: [] };
        
        // Check page load time (if available)
        if (performance && performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            if (loadTime < 3000) {
                results.passed.push({ test: 'Page Load Time', message: `Page loaded in ${loadTime}ms` });
            } else if (loadTime < 5000) {
                results.warnings.push({ test: 'Page Load Time', issue: `Page load time: ${loadTime}ms (target: <3000ms)`, severity: 'medium' });
            } else {
                results.failed.push({ test: 'Page Load Time', issue: `Page load time: ${loadTime}ms (target: <3000ms)`, severity: 'high' });
            }
        }
        
        // Check for large images
        const images = document.querySelectorAll('img');
        let largeImages = 0;
        for (const img of images) {
            if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
                largeImages++;
            }
        }
        
        if (largeImages === 0) {
            results.passed.push({ test: 'Image Optimization', message: 'No oversized images found' });
        } else {
            results.warnings.push({ test: 'Image Optimization', issue: `${largeImages} potentially oversized images found`, severity: 'medium' });
        }
        
        // Check for unused CSS/JS (basic check)
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        const scripts = document.querySelectorAll('script[src]');
        
        results.passed.push({ test: 'Resource Loading', message: `${stylesheets.length} stylesheets, ${scripts.length} scripts loaded` });
        
        return results;
    }

    /**
     * Generate comprehensive report
     */
    async generateComprehensiveReport() {
        console.log('\n📊 Generating Comprehensive Report...');
        console.log('='.repeat(50));
        
        const overallScore = this.calculateOverallScore();
        const recommendations = this.generateRecommendations();
        
        this.results.overall = {
            score: overallScore,
            recommendations: recommendations,
            summary: this.generateSummary()
        };
        
        // Display summary
        console.log(`\n🎯 OVERALL USABILITY SCORE: ${overallScore}/100`);
        console.log(this.getScoreEmoji(overallScore) + ' ' + this.getScoreDescription(overallScore));
        
        // Display category scores
        console.log('\n📈 Category Scores:');
        if (this.results.accessibility) {
            const accessibilityScore = this.calculateCategoryScore(this.results.accessibility);
            console.log(`   Accessibility: ${accessibilityScore}/100`);
        }
        if (this.results.responsiveDesign) {
            const responsiveScore = this.calculateCategoryScore(this.results.responsiveDesign);
            console.log(`   Responsive Design: ${responsiveScore}/100`);
        }
        if (this.results.userExperience) {
            const uxScore = this.calculateCategoryScore(this.results.userExperience);
            console.log(`   User Experience: ${uxScore}/100`);
        }
        if (this.results.performance) {
            const performanceScore = this.calculateCategoryScore(this.results.performance);
            console.log(`   Performance: ${performanceScore}/100`);
        }
        
        // Display recommendations
        if (recommendations.length > 0) {
            console.log('\n💡 Top Recommendations:');
            recommendations.slice(0, 5).forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        // Export detailed report
        this.exportDetailedReport();
    }

    /**
     * Calculate overall score
     */
    calculateOverallScore() {
        const scores = [];
        
        if (this.results.accessibility) {
            scores.push(this.calculateCategoryScore(this.results.accessibility));
        }
        if (this.results.responsiveDesign) {
            scores.push(this.calculateCategoryScore(this.results.responsiveDesign));
        }
        if (this.results.userExperience) {
            scores.push(this.calculateCategoryScore(this.results.userExperience));
        }
        if (this.results.performance) {
            scores.push(this.calculateCategoryScore(this.results.performance));
        }
        
        if (scores.length === 0) return 0;
        
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }

    /**
     * Calculate category score
     */
    calculateCategoryScore(categoryResults) {
        const total = categoryResults.passed.length + categoryResults.failed.length + categoryResults.warnings.length;
        if (total === 0) return 100;
        
        const passedWeight = 1;
        const warningWeight = 0.6;
        const failedWeight = 0;
        
        const score = (
            (categoryResults.passed.length * passedWeight) +
            (categoryResults.warnings.length * warningWeight) +
            (categoryResults.failed.length * failedWeight)
        ) / total * 100;
        
        return Math.round(score);
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Collect high-priority issues
        Object.values(this.results).forEach(categoryResult => {
            if (categoryResult && categoryResult.failed) {
                categoryResult.failed.forEach(failure => {
                    if (failure.severity === 'high') {
                        recommendations.push(`Fix: ${failure.issue}`);
                    }
                });
            }
        });
        
        // Collect medium-priority warnings
        Object.values(this.results).forEach(categoryResult => {
            if (categoryResult && categoryResult.warnings) {
                categoryResult.warnings.forEach(warning => {
                    if (warning.severity === 'medium') {
                        recommendations.push(`Improve: ${warning.issue}`);
                    }
                });
            }
        });
        
        return recommendations;
    }

    /**
     * Generate summary
     */
    generateSummary() {
        const totalPassed = Object.values(this.results).reduce((sum, result) => {
            return sum + (result && result.passed ? result.passed.length : 0);
        }, 0);
        
        const totalFailed = Object.values(this.results).reduce((sum, result) => {
            return sum + (result && result.failed ? result.failed.length : 0);
        }, 0);
        
        const totalWarnings = Object.values(this.results).reduce((sum, result) => {
            return sum + (result && result.warnings ? result.warnings.length : 0);
        }, 0);
        
        return {
            totalTests: totalPassed + totalFailed + totalWarnings,
            passed: totalPassed,
            failed: totalFailed,
            warnings: totalWarnings
        };
    }

    /**
     * Get score emoji
     */
    getScoreEmoji(score) {
        if (score >= 90) return '🏆';
        if (score >= 80) return '🥇';
        if (score >= 70) return '🥈';
        if (score >= 60) return '🥉';
        return '⚠️';
    }

    /**
     * Get score description
     */
    getScoreDescription(score) {
        if (score >= 90) return 'Excellent usability!';
        if (score >= 80) return 'Good usability with minor improvements needed';
        if (score >= 70) return 'Acceptable usability with some improvements needed';
        if (score >= 60) return 'Below average usability, improvements required';
        return 'Poor usability, significant improvements required';
    }

    /**
     * Export detailed report
     */
    exportDetailedReport() {
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            results: this.results,
            duration: (new Date() - this.startTime) / 1000
        };
        
        // Create download link
        const json = JSON.stringify(report, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `usability-test-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('\n💾 Detailed report exported as JSON file');
    }
}

// Export for use in tests or browser console
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsabilityTestRunner;
} else {
    window.UsabilityTestRunner = UsabilityTestRunner;
}

// Auto-run if in browser with specific parameter
if (typeof window !== 'undefined' && window.document) {
    document.addEventListener('DOMContentLoaded', async () => {
        if (window.location.search.includes('run-usability-tests')) {
            // Load test dependencies
            const scripts = [
                'accessibility-test.js',
                'responsive-design-test.js'
            ];
            
            // In a real implementation, you would load these scripts dynamically
            console.log('🔧 To run comprehensive tests, ensure all test scripts are loaded');
            console.log('📝 Available test runners:');
            console.log('   - AccessibilityTester');
            console.log('   - ResponsiveDesignTester');
            console.log('   - UsabilityTestRunner');
            
            // Run basic tests
            const runner = new UsabilityTestRunner();
            await runner.runAllTests();
        }
    });
}