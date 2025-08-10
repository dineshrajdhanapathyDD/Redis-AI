# Contributing to Redis AI Platform

We love your input! We want to make contributing to Redis AI Platform as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 18+
- Redis 7.0+ with RedisSearch and RedisTimeSeries modules
- Docker and Docker Compose

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/your-username/redis-ai-platform.git
cd redis-ai-platform

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start Redis
docker-compose up -d redis

# Run tests to ensure everything works
npm test

# Start development server
npm run dev
```

## Code Style

We use ESLint and Prettier to maintain code quality and consistency.

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Avoid `any` type - use proper typing

### Code Formatting

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

## Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(search): add multi-modal vector search capability
fix(auth): resolve JWT token expiration issue
docs(api): update search endpoint documentation
test(workspace): add integration tests for collaboration features
```

## Testing

We maintain high test coverage and require tests for all new features.

### Test Categories

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test service interactions
- **End-to-End Tests**: Test complete workflows
- **Performance Tests**: Test system performance under load

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Redis AI Platform! 🚀