/**
 * Unit tests for the Performance Optimizer module
 */

// Mock document and body
document.body = document.createElement('body');
document.head = document.createElement('head');

// Mock performance API
global.performance = {
    now: jest.fn().mockReturnValue(100),
    timing: {
        navigationStart: 0,
        loadEventEnd: 500
    },
    memory: {
        usedJSHeapSize: 1000000
    }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));
global.webkitRequestAnimationFrame = jest.fn();
global.mozRequestAnimationFrame = jest.fn();
global.oRequestAnimationFrame = jest.fn();
global.msRequestAnimationFrame = jest.fn();

// Import the module
require('../../assets/js/certification-roadmap/performance-optimizer.js');

// Get the module
const PerformanceOptimizer = window.CertificationRoadmap.PerformanceOptimizer;

describe('Performance Optimizer', () => {
    beforeEach(() => {
        // Clear document body and head
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
        
        // Create test elements
        const container = document.createElement('div');
        container.className = 'certification-roadmap';
        
        const image1 = document.createElement('img');
        image1.src = 'test1.jpg';
        
        const image2 = document.createElement('img');
        image2.src = 'test2.jpg';
        
        container.appendChild(image1);
        container.appendChild(image2);
        
        document.body.appendChild(container);
    });
    
    describe('init', () => {
        test('should initialize performance optimizer', () => {
            // Initialize performance optimizer
            PerformanceOptimizer.init();
            
            // Check if performance metrics were initialized
            const metrics = PerformanceOptimizer.getPerformanceMetrics();
            expect(metrics).toBeDefined();
            expect(metrics.loadTime).toBeDefined();
            expect(metrics.renderTime).toBeDefined();
            expect(metrics.interactionTime).toBeDefined();
            expect(metrics.memoryUsage).toBeDefined();
        });
        
        test('should optimize images', () => {
            // Initialize performance optimizer
            PerformanceOptimizer.init();
            
            // Check if images were optimized
            const images = document.querySelectorAll('img');
            expect(images.length).toBe(2);
            
            // Check if native lazy loading was applied
            if ('loading' in HTMLImageElement.prototype) {
                images.forEach(img => {
                    expect(img.loading).toBe('lazy');
                });
            }
        });
        
        test('should add CSS optimizations', () => {
            // Initialize performance optimizer
            PerformanceOptimizer.init();
            
            // Check if style element was added
            const style = document.querySelector('style');
            expect(style).not.toBeNull();
            
            // Check if style contains optimization rules
            expect(style.textContent).toContain('will-change');
            expect(style.textContent).toContain('transform');
            expect(style.textContent).toContain('contain: content');
        });
    });
    
    describe('utility functions', () => {
        test('should provide debounce function', () => {
            // Initialize performance optimizer
            PerformanceOptimizer.init();
            
            // Check if debounce function exists
            expect(window.CertificationRoadmap.debounce).toBeDefined();
            
            // Test debounce function
            const mockFn = jest.fn();
            const debouncedFn = window.CertificationRoadmap.debounce(mockFn, 100);
            
            // Call debounced function multiple times
            debouncedFn();
            debouncedFn();
            debouncedFn();
            
            // Function should not be called immediately
            expect(mockFn).not.toHaveBeenCalled();
            
            // Function should be called after timeout
            jest.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
        
        test('should provide throttle function', () => {
            // Initialize performance optimizer
            PerformanceOptimizer.init();
            
            // Check if throttle function exists
            expect(window.CertificationRoadmap.throttle).toBeDefined();
            
            // Test throttle function
            const mockFn = jest.fn();
            const throttledFn = window.CertificationRoadmap.throttle(mockFn, 100);
            
            // Call throttled function multiple times
            throttledFn();
            throttledFn();
            throttledFn();
            
            // Function should be called once immediately
            expect(mockFn).toHaveBeenCalledTimes(1);
            
            // Function should not be called again before timeout
            jest.advanceTimersByTime(50);
            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(1);
            
            // Function should be called again after timeout
            jest.advanceTimersByTime(50);
            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
        
        test('should provide DOM helper functions', () => {
            // Initialize performance optimizer
            PerformanceOptimizer.init();
            
            // Check if DOM helper functions exist
            expect(window.CertificationRoadmap.createElementsFragment).toBeDefined();
            expect(window.CertificationRoadmap.getDOMElement).toBeDefined();
            expect(window.CertificationRoadmap.getDOMElements).toBeDefined();
            expect(window.CertificationRoadmap.clearDOMCache).toBeDefined();
            
            // Test createElementsFragment function
            const div1 = document.createElement('div');
            const div2 = document.createElement('div');
            const fragment = window.CertificationRoadmap.createElementsFragment([div1, div2]);
            
            expect(fragment).toBeInstanceOf(DocumentFragment);
            expect(fragment.childNodes.length).toBe(2);
            
            // Test getDOMElement function
            document.body.innerHTML = '<div id="test-element"></div>';
            const element = window.CertificationRoadmap.getDOMElement('#test-element');
            
            expect(element).not.toBeNull();
            expect(element.id).toBe('test-element');
            
            // Test cache functionality
            const cachedElement = window.CertificationRoadmap.getDOMElement('#test-element');
            expect(cachedElement).toBe(element);
            
            // Test clearDOMCache function
            window.CertificationRoadmap.clearDOMCache();
            expect(window.CertificationRoadmap.domCache).toEqual({});
        });
    });
});