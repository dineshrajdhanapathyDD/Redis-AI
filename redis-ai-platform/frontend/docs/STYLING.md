# Styling Guide - Redis AI Platform Frontend

This document provides comprehensive information about the styling system used in the Redis AI Platform frontend.

## Tailwind CSS Configuration

The project uses a custom Tailwind CSS configuration located in `tailwind.config.js` with extensive customizations for the AI platform's design system.

### Color Palette

#### Primary Colors (Blue Scale)
Used for main actions, links, and primary UI elements:
- `primary-50`: `#eff6ff` - Lightest blue for backgrounds
- `primary-100`: `#dbeafe` - Light blue for hover states
- `primary-200`: `#bfdbfe` - Soft blue for borders
- `primary-300`: `#93c5fd` - Medium light blue
- `primary-400`: `#60a5fa` - Medium blue
- `primary-500`: `#3b82f6` - Base primary color
- `primary-600`: `#2563eb` - Darker blue for active states
- `primary-700`: `#1d4ed8` - Dark blue
- `primary-800`: `#1e40af` - Very dark blue
- `primary-900`: `#1e3a8a` - Darkest blue

#### Secondary Colors (Slate Scale)
Used for neutral elements, text, and backgrounds:
- `secondary-50`: `#f8fafc` - Almost white
- `secondary-100`: `#f1f5f9` - Very light gray
- `secondary-200`: `#e2e8f0` - Light gray for borders
- `secondary-300`: `#cbd5e1` - Medium light gray
- `secondary-400`: `#94a3b8` - Medium gray for muted text
- `secondary-500`: `#64748b` - Base secondary color
- `secondary-600`: `#475569` - Darker gray for text
- `secondary-700`: `#334155` - Dark gray
- `secondary-800`: `#1e293b` - Very dark gray
- `secondary-900`: `#0f172a` - Almost black

#### Success Colors (Green Scale)
Used for positive feedback, success states, and confirmations:
- `success-50`: `#f0fdf4` - Very light green
- `success-100`: `#dcfce7` - Light green
- `success-200`: `#bbf7d0` - Soft green
- `success-300`: `#86efac` - Medium light green
- `success-400`: `#4ade80` - Medium green
- `success-500`: `#22c55e` - Base success color
- `success-600`: `#16a34a` - Darker green
- `success-700`: `#15803d` - Dark green
- `success-800`: `#166534` - Very dark green
- `success-900`: `#14532d` - Darkest green

#### Warning Colors (Amber Scale)
Used for caution states, warnings, and attention-grabbing elements:
- `warning-50`: `#fffbeb` - Very light amber
- `warning-100`: `#fef3c7` - Light amber
- `warning-200`: `#fde68a` - Soft amber
- `warning-300`: `#fcd34d` - Medium light amber
- `warning-400`: `#fbbf24` - Medium amber
- `warning-500`: `#f59e0b` - Base warning color
- `warning-600`: `#d97706` - Darker amber
- `warning-700`: `#b45309` - Dark amber
- `warning-800`: `#92400e` - Very dark amber
- `warning-900`: `#78350f` - Darkest amber

#### Error Colors (Red Scale)
Used for error states, destructive actions, and critical alerts:
- `error-50`: `#fef2f2` - Very light red
- `error-100`: `#fee2e2` - Light red
- `error-200`: `#fecaca` - Soft red
- `error-300`: `#fca5a5` - Medium light red
- `error-400`: `#f87171` - Medium red
- `error-500`: `#ef4444` - Base error color
- `error-600`: `#dc2626` - Darker red
- `error-700`: `#b91c1c` - Dark red
- `error-800`: `#991b1b` - Very dark red
- `error-900`: `#7f1d1d` - Darkest red

### Typography

#### Font Families
- **Sans Serif**: `Inter` with system fallbacks (`system-ui`, `sans-serif`)
- **Monospace**: `JetBrains Mono` with fallbacks (`Consolas`, `monospace`)

#### Usage Guidelines
- Use `font-sans` for all body text, headings, and UI elements
- Use `font-mono` for code snippets, technical data, and monospaced content
- Inter provides excellent readability and modern appearance
- JetBrains Mono offers superior code readability with ligatures

### Custom Animations

#### Fade In Animation
```css
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```
- **Class**: `animate-fade-in`
- **Duration**: 0.5s ease-in-out
- **Usage**: Page transitions, modal appearances, content loading

#### Slide Up Animation
```css
@keyframes slideUp {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```
- **Class**: `animate-slide-up`
- **Duration**: 0.3s ease-out
- **Usage**: Card appearances, dropdown menus, tooltips

#### Slide Down Animation
```css
@keyframes slideDown {
  0% { transform: translateY(-10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```
- **Class**: `animate-slide-down`
- **Duration**: 0.3s ease-out
- **Usage**: Notifications, alerts, expanding content

#### Pulse Slow Animation
- **Class**: `animate-pulse-slow`
- **Duration**: 3s cubic-bezier(0.4, 0, 0.6, 1) infinite
- **Usage**: Loading states, breathing effects, subtle attention

## Component Styling Patterns

### Buttons
```html
<!-- Primary Button -->
<button class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
  Primary Action
</button>

<!-- Secondary Button -->
<button class="bg-secondary-200 hover:bg-secondary-300 text-secondary-700 px-4 py-2 rounded-lg transition-colors">
  Secondary Action
</button>

<!-- Success Button -->
<button class="bg-success-500 hover:bg-success-600 text-white px-4 py-2 rounded-lg transition-colors">
  Success Action
</button>
```

### Cards
```html
<div class="bg-white border border-secondary-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
  <h3 class="text-lg font-semibold text-secondary-900 mb-2">Card Title</h3>
  <p class="text-secondary-600">Card content goes here...</p>
</div>
```

### Form Elements
```html
<!-- Input Field -->
<input class="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />

<!-- Error State -->
<input class="w-full px-3 py-2 border border-error-300 rounded-lg focus:ring-2 focus:ring-error-500 focus:border-error-500 transition-colors" />

<!-- Success State -->
<input class="w-full px-3 py-2 border border-success-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-colors" />
```

### Loading States
```html
<!-- Loading Spinner -->
<div class="animate-pulse-slow">
  <div class="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
  <div class="h-4 bg-secondary-200 rounded w-1/2"></div>
</div>

<!-- Loading Button -->
<button class="bg-primary-500 text-white px-4 py-2 rounded-lg opacity-50 cursor-not-allowed" disabled>
  <span class="animate-pulse-slow">Loading...</span>
</button>
```

## Responsive Design

### Breakpoints
Tailwind's default breakpoints are used:
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up
- `2xl`: 1536px and up

### Mobile-First Approach
```html
<!-- Mobile-first responsive design -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Content adapts from 1 column on mobile to 3 columns on large screens -->
</div>
```

## Accessibility Considerations

### Color Contrast
All color combinations meet WCAG AA standards:
- Text on `primary-500` background uses white text
- Text on light backgrounds uses `secondary-900` or `secondary-800`
- Error states use sufficient contrast ratios

### Focus States
```html
<!-- Proper focus indicators -->
<button class="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none">
  Accessible Button
</button>
```

### Screen Reader Support
```html
<!-- Semantic color usage with ARIA labels -->
<div class="bg-error-50 border border-error-200 text-error-800" role="alert" aria-label="Error message">
  Error content
</div>
```

## Best Practices

### Color Usage
1. Use semantic colors for their intended purpose
2. Maintain consistent color usage across components
3. Test color combinations for accessibility
4. Use lighter shades for backgrounds, darker for text

### Animation Usage
1. Use animations sparingly for better performance
2. Respect user preferences for reduced motion
3. Keep animations short and purposeful
4. Test animations on slower devices

### Responsive Design
1. Design mobile-first, enhance for larger screens
2. Test on actual devices, not just browser dev tools
3. Consider touch targets on mobile devices
4. Ensure content is readable at all screen sizes

## Development Workflow

### Adding New Colors
1. Follow the existing color scale pattern (50-900)
2. Ensure accessibility compliance
3. Update this documentation
4. Test across all components

### Custom Animations
1. Define keyframes in the Tailwind config
2. Use meaningful names
3. Consider performance impact
4. Test across browsers

### Component Development
1. Use existing color and animation classes
2. Follow established patterns
3. Ensure responsive behavior
4. Test accessibility features

## Tools and Resources

### Design Tools
- **Tailwind CSS IntelliSense**: VS Code extension for class completion
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons**: Icon library that pairs well with Tailwind

### Testing Tools
- **axe-core**: Accessibility testing
- **Lighthouse**: Performance and accessibility auditing
- **WebAIM Color Contrast Checker**: Verify color accessibility

### Documentation
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)