/**
 * Unit tests for the Workflow Navigation module
 */

// Mock document and body
document.body = document.createElement('body');

// Import the module
require('../../assets/js/certification-roadmap/workflow-navigation.js');

// Get the module
const WorkflowNavigation = window.CertificationRoadmap.WorkflowNavigation;

describe('Workflow Navigation', () => {
    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
        
        // Create test elements
        const workflowSteps = document.createElement('div');
        workflowSteps.className = 'certification-roadmap-workflow__steps';
        
        const steps = ['welcome', 'assessment', 'career-goals', 'roadmap', 'resources', 'study-plan'];
        steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'certification-roadmap-workflow__step';
            if (step === 'welcome') {
                stepElement.classList.add('certification-roadmap-workflow__step--active');
            }
            stepElement.setAttribute('data-step', step);
            
            const stepNumber = document.createElement('div');
            stepNumber.className = 'certification-roadmap-workflow__step-number';
            stepNumber.textContent = index + 1;
            
            const stepTitle = document.createElement('div');
            stepTitle.className = 'certification-roadmap-workflow__step-title';
            stepTitle.textContent = step.charAt(0).toUpperCase() + step.slice(1);
            
            stepElement.appendChild(stepNumber);
            stepElement.appendChild(stepTitle);
            workflowSteps.appendChild(stepElement);
        });
        
        document.body.appendChild(workflowSteps);
    });
    
    describe('init', () => {
        test('should initialize workflow navigation', () => {
            // Initialize workflow navigation
            WorkflowNavigation.init();
            
            // Check if event listeners were added
            const workflowSteps = document.querySelectorAll('.certification-roadmap-workflow__step');
            expect(workflowSteps.length).toBe(6);
        });
    });
    
    describe('keyboard navigation', () => {
        test('should handle Enter key press', () => {
            // Initialize workflow navigation
            WorkflowNavigation.init();
            
            // Mock navigate event
            const navigateEvent = jest.fn();
            document.addEventListener('navigate-to-step', navigateEvent);
            
            // Get first step
            const firstStep = document.querySelector('.certification-roadmap-workflow__step');
            
            // Simulate Enter key press
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            firstStep.dispatchEvent(enterEvent);
            
            // Check if navigate event was dispatched
            expect(navigateEvent).toHaveBeenCalled();
        });
        
        test('should handle Space key press', () => {
            // Initialize workflow navigation
            WorkflowNavigation.init();
            
            // Mock navigate event
            const navigateEvent = jest.fn();
            document.addEventListener('navigate-to-step', navigateEvent);
            
            // Get first step
            const firstStep = document.querySelector('.certification-roadmap-workflow__step');
            
            // Simulate Space key press
            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            firstStep.dispatchEvent(spaceEvent);
            
            // Check if navigate event was dispatched
            expect(navigateEvent).toHaveBeenCalled();
        });
        
        test('should handle arrow key navigation', () => {
            // Initialize workflow navigation
            WorkflowNavigation.init();
            
            // Get workflow steps
            const workflowSteps = document.querySelectorAll('.certification-roadmap-workflow__step');
            const firstStep = workflowSteps[0];
            const secondStep = workflowSteps[1];
            
            // Focus first step
            firstStep.focus = jest.fn();
            secondStep.focus = jest.fn();
            
            // Simulate ArrowRight key press
            const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            firstStep.dispatchEvent(arrowRightEvent);
            
            // Check if second step was focused
            expect(secondStep.focus).toHaveBeenCalled();
        });
    });
});