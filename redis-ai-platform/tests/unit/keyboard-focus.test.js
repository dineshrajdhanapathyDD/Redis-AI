/**
 * Unit tests for the Keyboard Focus module
 */

// Mock document and body
document.body = document.createElement('body');

// Import the module
require('../../assets/js/certification-roadmap/keyboard-focus.js');

// Get the module
const KeyboardFocus = window.CertificationRoadmap.KeyboardFocus;

describe('Keyboard Focus', () => {
    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';
        
        // Reset mock function calls
        jest.clearAllMocks();
        
        // Create test elements
        const container = document.createElement('div');
        container.className = 'keyboard-focus-container';
        
        const button1 = document.createElement('button');
        button1.className = 'keyboard-focus-element';
        button1.textContent = 'Button 1';
        
        const button2 = document.createElement('button');
        button2.className = 'keyboard-focus-element';
        button2.textContent = 'Button 2';
        
        const button3 = document.createElement('button');
        button3.className = 'keyboard-focus-element';
        button3.textContent = 'Button 3';
        
        container.appendChild(button1);
        container.appendChild(button2);
        container.appendChild(button3);
        
        document.body.appendChild(container);
    });
    
    describe('initKeyboardFocus', () => {
        test('should initialize keyboard focus', () => {
            KeyboardFocus.initKeyboardFocus('.keyboard-focus-container', '.keyboard-focus-element');
            
            // Should add tabindex to elements
            const elements = document.querySelectorAll('.keyboard-focus-element');
            elements.forEach(element => {
                expect(element.getAttribute('tabindex')).toBe('0');
            });
        });
        
        test('should handle no matching elements', () => {
            KeyboardFocus.initKeyboardFocus('.non-existent-container', '.non-existent-element');
            
            // Should not throw error
            expect(true).toBe(true);
        });
    });
    
    describe('handleKeyboardNavigation', () => {
        test('should handle arrow key navigation', () => {
            // Initialize keyboard focus
            KeyboardFocus.initKeyboardFocus('.keyboard-focus-container', '.keyboard-focus-element');
            
            // Get elements
            const elements = document.querySelectorAll('.keyboard-focus-element');
            const button1 = elements[0];
            const button2 = elements[1];
            const button3 = elements[2];
            
            // Focus first button
            button1.focus();
            
            // Mock keydown event for ArrowRight
            const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            button1.dispatchEvent(arrowRightEvent);
            
            // Second button should be focused
            expect(document.activeElement).toBe(button2);
            
            // Mock keydown event for ArrowDown (should work the same as ArrowRight)
            const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            button2.dispatchEvent(arrowDownEvent);
            
            // Third button should be focused
            expect(document.activeElement).toBe(button3);
            
            // Mock keydown event for ArrowLeft
            const arrowLeftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            button3.dispatchEvent(arrowLeftEvent);
            
            // Second button should be focused again
            expect(document.activeElement).toBe(button2);
            
            // Mock keydown event for ArrowUp (should work the same as ArrowLeft)
            const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            button2.dispatchEvent(arrowUpEvent);
            
            // First button should be focused again
            expect(document.activeElement).toBe(button1);
        });
        
        test('should handle Home and End keys', () => {
            // Initialize keyboard focus
            KeyboardFocus.initKeyboardFocus('.keyboard-focus-container', '.keyboard-focus-element');
            
            // Get elements
            const elements = document.querySelectorAll('.keyboard-focus-element');
            const button1 = elements[0];
            const button3 = elements[2];
            
            // Focus first button
            button1.focus();
            
            // Mock keydown event for End
            const endEvent = new KeyboardEvent('keydown', { key: 'End' });
            button1.dispatchEvent(endEvent);
            
            // Last button should be focused
            expect(document.activeElement).toBe(button3);
            
            // Mock keydown event for Home
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            button3.dispatchEvent(homeEvent);
            
            // First button should be focused again
            expect(document.activeElement).toBe(button1);
        });
        
        test('should handle circular navigation', () => {
            // Initialize keyboard focus
            KeyboardFocus.initKeyboardFocus('.keyboard-focus-container', '.keyboard-focus-element');
            
            // Get elements
            const elements = document.querySelectorAll('.keyboard-focus-element');
            const button1 = elements[0];
            const button3 = elements[2];
            
            // Focus first button
            button1.focus();
            
            // Mock keydown event for ArrowLeft (should wrap to last element)
            const arrowLeftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            button1.dispatchEvent(arrowLeftEvent);
            
            // Last button should be focused
            expect(document.activeElement).toBe(button3);
            
            // Mock keydown event for ArrowRight (should wrap to first element)
            const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            button3.dispatchEvent(arrowRightEvent);
            
            // First button should be focused again
            expect(document.activeElement).toBe(button1);
        });
    });
    
    describe('handleFocusIndicator', () => {
        test('should add focus-visible class on keyboard focus', () => {
            // Initialize keyboard focus
            KeyboardFocus.initKeyboardFocus('.keyboard-focus-container', '.keyboard-focus-element');
            
            // Get first element
            const button = document.querySelector('.keyboard-focus-element');
            
            // Mock focus event with keyboard
            const focusEvent = new FocusEvent('focus');
            button.dispatchEvent(focusEvent);
            
            // Element should have focus-visible class
            expect(button.classList.contains('focus-visible')).toBe(true);
        });
        
        test('should remove focus-visible class on blur', () => {
            // Initialize keyboard focus
            KeyboardFocus.initKeyboardFocus('.keyboard-focus-container', '.keyboard-focus-element');
            
            // Get first element
            const button = document.querySelector('.keyboard-focus-element');
            
            // Add focus-visible class
            button.classList.add('focus-visible');
            
            // Mock blur event
            const blurEvent = new FocusEvent('blur');
            button.dispatchEvent(blurEvent);
            
            // Element should not have focus-visible class
            expect(button.classList.contains('focus-visible')).toBe(false);
        });
    });
});