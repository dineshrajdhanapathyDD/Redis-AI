# Redis AI Platform Tests

This directory contains comprehensive tests for the Redis AI Platform, including unit tests, integration tests, configuration tests, and usability tests. The testing framework uses Jest with TypeScript support.

## Cloud Certification Roadmap Tests

The Cloud Certification Roadmap is a comprehensive interactive tool that helps users create personalized certification paths based on their skills and career goals. The feature includes:

- Skill assessment functionality
- Career goal definition
- Certification path visualization
- Learning resource recommendations
- Study plan generation
- Data management capabilities

### Feature Status

The Cloud Certification Roadmap feature is now complete and has been added to the projects showcase. The implementation includes:

- ✅ Core data models and persistence
- ✅ Skill assessment system
- ✅ Career goal processing
- ✅ Certification database and query system
- ✅ Interactive roadmap visualization
- ✅ Learning resource recommendation engine
- ✅ Study plan generation
- ✅ Data export/import functionality
- ✅ Multi-scenario support
- ✅ Accessibility features
- ✅ Unit and integration tests

The only remaining task is to conduct usability testing across different devices.

## Unit Tests

Unit tests are located in the `unit` directory and test individual modules in isolation. These tests use Jest as the testing framework and jsdom for DOM manipulation.

### Running Tests

The project uses Jest with TypeScript support. Configuration is defined in `jest.config.js` at the project root.

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- tests/config/redis.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Redis"
```

### Jest Configuration

The testing setup includes:

- **TypeScript Support**: Uses `ts-jest` preset for seamless TypeScript testing
- **Path Mapping**: Supports `@/` imports matching the main application structure
- **Test Discovery**: Automatically finds `*.test.ts` and `*.spec.ts` files
- **Coverage Collection**: Comprehensive coverage reporting excluding type definitions
- **Setup Files**: Automatic test environment initialization via `tests/setup.ts`
- **Timeout Configuration**: 10-second timeout for async operations

### Test Structure

Tests are organized into several categories:

```
tests/
├── config/           # Configuration and environment testing
│   ├── environment.test.ts
│   └── redis.test.ts
├── integration/      # End-to-end workflow testing
├── unit/            # Individual component testing
├── usability/       # Accessibility and UX testing
├── setup.ts         # Test environment setup
└── README.md        # This file
```

Tests use TypeScript and follow the same import patterns as the main application, including support for `@/` path aliases.

### Mocking

The tests use Jest's mocking capabilities to mock dependencies such as:

- **Redis Client**: For testing Redis operations without requiring a live connection
- **AI Model APIs**: For testing model routing and response handling
- **Environment Variables**: For testing different configuration scenarios
- **External Services**: For testing integrations with embedding and AI services
- **File System Operations**: For testing data persistence and retrieval

### Coverage

The test coverage report shows which parts of the code are covered by tests. The goal is to achieve high coverage to ensure that the code is well-tested.

## Configuration Tests

Configuration tests (`tests/config/`) verify that the application environment and Redis setup work correctly:

- **Environment Configuration**: Tests environment variable validation and configuration loading
- **Redis Connection**: Tests Redis connection management, cluster support, and vector index creation
- **Security Settings**: Validates JWT configuration and security middleware setup

## Integration Tests

Integration tests verify that the modules work together correctly. For the Redis AI Platform, integration tests focus on:

- **Multi-modal Search**: End-to-end search across different content types
- **AI Model Routing**: Request routing and model selection workflows
- **Collaborative Workspaces**: Real-time synchronization and knowledge sharing
- **Vector Operations**: Embedding generation and similarity search
- **Data Persistence**: Storage and retrieval of user data and preferences

## Usability Tests

The `usability` directory contains tests focused on user experience, accessibility, and responsive design.

### Accessibility Testing

The `accessibility-test.js` file provides automated accessibility testing to ensure WCAG 2.1 AA compliance. The test suite includes:

#### Test Categories

- **Keyboard Navigation**: Tests tab order, focus visibility, and keyboard accessibility
- **ARIA Attributes**: Validates proper use of ARIA labels, roles, and properties  
- **Color Contrast**: Automated contrast ratio testing for text readability
- **Focus Management**: Tests focus traps in modals and skip link functionality
- **Semantic HTML**: Verifies heading hierarchy and landmark element usage
- **Form Accessibility**: Validates form labels and required field indicators
- **Image Accessibility**: Checks alt text presence and quality
- **Dynamic Content**: Tests live regions and dynamic content announcements

#### Enhanced Accessibility Implementation

The Cloud Certification Roadmap now includes comprehensive accessibility enhancements:

- **Live Region System**: Three-tier announcement system (polite, assertive, progress)
- **Enhanced Screen Reader Support**: Detailed announcements for all user interactions
- **Keyboard Shortcuts**: Alt+1-6 for navigation, Ctrl+/ for help, Escape for modals
- **Form Enhancement**: Automatic label association and validation announcements
- **Button State Feedback**: Clear announcements for pressed/expanded states
- **Filter Result Announcements**: Dynamic count updates when filters are applied
- **Loading State Management**: Comprehensive loading and completion announcements
- **Error Handling**: Detailed error announcements with recovery guidance
- **Focus Management**: Enhanced focus restoration and keyboard navigation
- **Mobile Optimization**: 44px+ touch targets with responsive design

#### Running Accessibility Tests

```bash
# Run in browser with URL parameter
https://your-site.com/certification-roadmap.html?accessibility-test

# Run programmatically in browser console
const tester = new AccessibilityTester();
const results = await tester.runAllTests();
```

#### Test Results

The accessibility tester provides:

- **Detailed Reports**: Pass/fail status with severity levels
- **Element References**: Direct links to problematic elements  
- **Overall Score**: Calculated accessibility score out of 100
- **Actionable Recommendations**: Specific steps to fix issues

### Responsive Design Testing

The `responsive-design-test.js` file validates layout and functionality across different screen sizes and devices.

### Usability Test Results

The `usability-test-results.md` file contains comprehensive test results including:

- Interface testing across all components
- Responsive design validation
- Accessibility compliance verification
- Browser compatibility testing
- Performance metrics
- User experience flow validation

Current overall usability score: **9.2/10** (enhanced from 8.5/10)

## End-to-End Tests

End-to-end tests are planned for future implementation. These tests will verify that the entire feature works correctly from the user's perspective.