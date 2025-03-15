# DataNexus Testing Infrastructure

This directory contains the testing infrastructure for the DataNexus project. The tests are organized into different categories based on their scope and purpose.

## Test Structure

```
test/
├── e2e/                  # End-to-end tests
├── integration/          # Integration tests
│   └── api/              # API endpoint tests
├── pages/                # Page-level tests
├── unit/                 # Unit tests
│   ├── components/       # Component tests
│   ├── composables/      # Composable function tests
│   └── mocks/            # Mock implementations for testing
└── utils/                # Test utilities
```

## Test Types

### Unit Tests

Unit tests focus on testing individual components, composables, and functions in isolation. They use mocks to simulate dependencies and focus on verifying that each unit of code works as expected.

- **Component Tests**: Test Vue components in isolation
- **Composable Tests**: Test Vue composables (reusable logic)

### Integration Tests

Integration tests verify that different parts of the application work together correctly. They focus on testing the integration between different components, services, and external dependencies.

- **API Tests**: Test API endpoints and their interactions with the database

### Page Tests

Page tests verify that pages render correctly and handle user interactions as expected. They focus on testing the integration of components within a page context.

### End-to-End Tests

End-to-end tests verify that the application works correctly from the user's perspective. They simulate user interactions and verify that the application behaves as expected.

## Mock Infrastructure

The `test/unit/mocks` directory contains mock implementations used across tests:

- `nuxtMocks.ts`: Mocks for Nuxt.js-specific functionality
- `reportSharingMocks.ts`: Mocks for report sharing functionality

## Running Tests

Tests can be run using the following commands:

```bash
# Run all tests
bun run test

# Run unit tests
bun run test:unit

# Run integration tests
bun run test:integration

# Run a specific test file
bun run test path/to/test/file.test.ts
```

## Report Sharing Test Coverage

The report sharing functionality has comprehensive test coverage across different test types:

### API Endpoint Tests

- `test/integration/api/report-sharing.test.ts`: Tests for report sharing API endpoints
  - Share Report Endpoint (`/api/reports/[id]/share.post.ts`)
  - Get Shared Reports Endpoint (`/api/reports/shared.get.ts`)
  - Revoke Share Access Endpoint (`/api/reports/shares/revoke.delete.ts`)

### Component Tests

- `test/unit/components/collaboration/ReportAccess.test.ts`: Tests for the ReportAccess component
- `test/unit/components/collaboration/ShareReport.test.ts`: Tests for the ShareReport component

## Adding New Tests

When adding new tests, follow these guidelines:

1. Place tests in the appropriate directory based on their type
2. Use descriptive test names that clearly indicate what is being tested
3. Use the existing mock infrastructure when possible
4. Follow the existing test patterns and conventions

## Best Practices

- Use descriptive test names that clearly indicate what is being tested
- Keep tests focused on a single aspect of functionality
- Use mocks to isolate the code being tested
- Avoid testing implementation details when possible
- Use setup and teardown functions to avoid duplication
- Clean up after tests to avoid side effects
