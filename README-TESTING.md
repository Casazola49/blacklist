# Testing Documentation - The Blacklist

## Overview

This document describes the comprehensive testing strategy implemented for The Blacklist project, covering unit tests, integration tests, E2E tests, performance tests, and security tests.

## Testing Structure

```
src/
├── __tests__/
│   ├── integration/          # Integration tests
│   ├── performance/          # Performance tests
│   ├── security/            # Security tests
│   └── setup.ts             # Test setup configuration
├── components/
│   └── ui/
│       └── __tests__/       # Component unit tests
├── services/
│   └── __tests__/           # Service unit tests
└── utils/
    └── __tests__/           # Utility unit tests

cypress/
├── e2e/                     # End-to-end tests
├── support/                 # Cypress support files
└── fixtures/                # Test data

functions/
└── __tests__/               # Cloud Functions tests
```

## Test Categories

### 1. Unit Tests

**Location**: `src/components/ui/__tests__/`, `src/services/__tests__/`, `src/utils/__tests__/`

**Purpose**: Test individual components, services, and utilities in isolation.

**Examples**:
- Component rendering and props
- Service method functionality
- Utility function behavior
- Error handling

**Run Command**:
```bash
npm run test:unit
```

### 2. Integration Tests

**Location**: `src/__tests__/integration/`

**Purpose**: Test interactions between multiple components and services.

**Examples**:
- Authentication flow (login, registration, logout)
- Contract lifecycle (creation, proposals, acceptance, completion)
- Real-time communication between components

**Run Command**:
```bash
npm run test:integration
```

### 3. End-to-End Tests

**Location**: `cypress/e2e/`

**Purpose**: Test complete user workflows from the browser perspective.

**Examples**:
- Complete contract lifecycle from client and specialist perspectives
- Authentication flows with real UI interactions
- Payment and escrow processes
- Chat functionality

**Run Commands**:
```bash
npm run test:e2e          # Run headless
npm run test:e2e:open     # Open Cypress UI
```

### 4. Performance Tests

**Location**: `src/__tests__/performance/`

**Purpose**: Ensure the application meets performance standards.

**Tests Include**:
- Core Web Vitals (LCP, FID, CLS, FCP)
- Bundle size analysis
- Memory usage monitoring
- Animation performance
- Service Worker performance
- Network performance adaptation

**Run Command**:
```bash
npm run test:performance
```

### 5. Security Tests

**Location**: `src/__tests__/security/`, `functions/__tests__/security.test.ts`

**Purpose**: Validate security measures and access controls.

**Tests Include**:
- Firestore security rules
- Authentication validation
- Input sanitization
- Rate limiting
- Data access controls
- Audit logging

**Run Command**:
```bash
npm run test:security
```

## Performance Testing

### Lighthouse CI Integration

The project includes automated Lighthouse audits for:
- Performance score > 90
- Accessibility score > 95
- Best Practices score > 90
- SEO score > 90
- PWA score > 90

**Run Commands**:
```bash
npm run lighthouse          # Generate HTML report
npm run lighthouse:ci       # Generate JSON for CI
npm run performance:audit   # Performance-only audit
```

### Core Web Vitals Thresholds

- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s

### Performance Budget

- **Total Bundle Size**: < 500KB
- **JavaScript Bundle**: < 200KB
- **CSS Bundle**: < 50KB
- **Images**: < 200KB
- **Fonts**: < 100KB

## Security Testing

### Firestore Rules Testing

Tests validate that:
- Users can only access their own data
- Contract parties can access shared contract data
- Third parties cannot access private data
- Admin-only collections are protected
- Audit logs are read-only

### Cloud Functions Security

Tests validate:
- Authentication requirements
- Input validation and sanitization
- Rate limiting
- Data access controls
- Error handling without information disclosure

## Test Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Cypress Configuration

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  }
})
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # E2E tests only
npm run test:performance   # Performance tests only
npm run test:security      # Security tests only
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test               # Watch mode for development
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build
      - run: npm run test:e2e
      - run: npm run lighthouse:ci
```

### Performance Monitoring

Performance metrics are automatically collected and can be sent to monitoring services:

```typescript
const performanceData = {
  lcp: 1500,
  fid: 50,
  cls: 0.05,
  fcp: 800,
  url: window.location.href,
  timestamp: Date.now()
}

await sendPerformanceData(performanceData)
```

## Test Data Management

### Fixtures

Test data is managed through Cypress fixtures and mock data generators:

```typescript
// cypress/fixtures/users.json
{
  "testClient": {
    "uid": "test-client-123",
    "email": "testclient@example.com",
    "tipo": "cliente"
  }
}
```

### Mocking Strategy

- **Firebase**: Mocked using Firebase emulators for integration tests
- **External APIs**: Mocked using Vitest mocks
- **Browser APIs**: Mocked in test setup

## Best Practices

### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Test both success and error cases

### Integration Tests
- Test realistic user scenarios
- Use minimal mocking
- Test error boundaries
- Verify state changes

### E2E Tests
- Test critical user journeys
- Use data attributes for selectors
- Keep tests independent
- Clean up test data

### Performance Tests
- Set realistic thresholds
- Test on different devices/networks
- Monitor trends over time
- Fail builds on regressions

### Security Tests
- Test all access control rules
- Validate input sanitization
- Test rate limiting
- Verify audit logging

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout values or optimize async operations
2. **Flaky tests**: Add proper waits and make tests more deterministic
3. **Memory leaks**: Clean up event listeners and subscriptions
4. **Performance regressions**: Check bundle size and optimize critical paths

### Debug Commands

```bash
npm run test:ui            # Open Vitest UI
npm run test:e2e:open      # Open Cypress UI
npm run test -- --reporter=verbose  # Verbose output
```

## Metrics and Reporting

### Coverage Reports
- Generated in `coverage/` directory
- HTML reports available at `coverage/index.html`
- Minimum coverage threshold: 80%

### Performance Reports
- Lighthouse reports in `lighthouse-report.html`
- Performance audit data in `performance-audit.json`
- Bundle analysis available via `npm run build:analyze`

### Test Results
- JUnit XML reports for CI integration
- JSON reports for programmatic analysis
- Screenshots and videos for E2E test failures

This comprehensive testing strategy ensures The Blacklist maintains high quality, performance, and security standards throughout development and deployment.