# Testing Documentation

## Overview

This project uses a comprehensive testing strategy combining unit tests, integration tests, and API tests to ensure code quality and reliability. We use **Vitest** as our testing framework for its speed, TypeScript support, and compatibility with the Next.js ecosystem.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Organization](#test-organization)
6. [Best Practices](#best-practices)
7. [Coverage Goals](#coverage-goals)
8. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Our Approach

- **Test behavior, not implementation** - Focus on what the code does, not how it does it
- **Test at the right level** - Use unit tests for logic, integration tests for workflows, API tests for endpoints
- **Maintain fast feedback loops** - Tests should run quickly to encourage frequent execution
- **Aim for high coverage** - Target 80%+ coverage for critical business logic
- **Keep tests maintainable** - Tests should be readable, isolated, and easy to update

### When to Write Tests

- ✅ **Always** - When adding new features or fixing bugs
- ✅ **Before refactoring** - Ensure behavior is preserved
- ✅ **For critical paths** - Authentication, data persistence, sync operations
- ⚠️ **Consider carefully** - For experimental features or prototypes

---

## Test Types

### 1. Unit Tests (`tests/hooks/*.test.ts`, `tests/*.test.ts`)

**Purpose:** Test individual functions, hooks, or components in isolation.

**Characteristics:**
- Fast execution
- Minimal dependencies
- Mocked external services
- Focus on single units of code

**Example:**
```typescript
// tests/hooks/useAuth.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/lib/hooks/use-auth'

describe('useAuth', () => {
  it('should return user when authenticated', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeDefined()
  })
})
```

### 2. Integration Tests (`tests/integration/*.test.ts`)

**Purpose:** Test how multiple components work together, using real database instances.

**Characteristics:**
- Use `fake-indexeddb` for realistic database interactions
- Test complete user workflows
- Verify data persistence
- Mock external APIs only

**Example:**
```typescript
// tests/integration/useProject.test.ts
import { db } from '@/lib/db'
import { setupTestDatabase, teardownTestDatabase } from './test-utils'

describe('useProject Integration Tests', () => {
  beforeEach(async () => {
    await setupTestDatabase() // Fresh DB for each test
  })

  afterEach(async () => {
    await teardownTestDatabase()
  })

  it('should add a pin to a floorplan', async () => {
    // Test with real database interactions
  })
})
```

### 3. API Tests (`tests/api/*.test.ts`)

**Purpose:** Test API route handlers and server-side logic.

**Characteristics:**
- Test request/response handling
- Validate authentication/authorization
- Test error scenarios
- Mock external services (Stripe, Google Drive)

**Example:**
```typescript
// tests/api/checkout.test.ts
import { POST } from '@/app/api/checkout/route'

describe('/api/checkout', () => {
  it('should create checkout session for authenticated user', async () => {
    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run all tests with UI
npm run test:ui

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Targeted Test Execution

```bash
# Run specific test file
npx vitest tests/hooks/useAuth.test.ts

# Run integration tests only
npx vitest tests/integration

# Run tests matching a pattern
npx vitest --grep "should add a pin"

# Run a single test suite
npx vitest --grep "useProject Integration Tests"
```

### Coverage Reports

```bash
# Generate and view coverage
npm run test:coverage

# Coverage for specific directory
npx vitest --coverage tests/integration

# Open HTML coverage report
# (Generated in coverage/index.html)
```

---

## Writing Tests

### 1. Test File Structure

**Naming Convention:**
- Unit tests: `[filename].test.ts` or `[filename].test.tsx`
- Integration tests: `tests/integration/[hookname].test.ts`
- API tests: `tests/api/[endpoint].test.ts`

**File Location:**
- Place tests near the code they test when possible
- Integration tests go in `tests/integration/`
- Shared test utilities go in `tests/integration/test-utils.ts`

### 2. Test Structure Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('FeatureName', () => {
  // Setup runs before each test
  beforeEach(async () => {
    // Initialize test state
  })

  // Cleanup runs after each test
  afterEach(async () => {
    // Clean up resources
    vi.clearAllMocks()
  })

  describe('SubFeature', () => {
    it('should do something specific', async () => {
      // Arrange - Set up test data
      const input = 'test'
      
      // Act - Execute the code under test
      const result = await someFunction(input)
      
      // Assert - Verify the results
      expect(result).toBe('expected')
    })
  })
})
```

### 3. Integration Test Setup

```typescript
import { setupTestDatabase, teardownTestDatabase } from './test-utils'
import { db } from '@/lib/db'

// Mock external dependencies
vi.mock('@/lib/google', () => ({
  deletePhotoClient: vi.fn().mockResolvedValue(undefined),
  ensureProjectFolderClient: vi.fn().mockResolvedValue({
    rootFolderId: 'mock-root',
    projectFolderId: 'mock-project',
  }),
}))

describe('Integration Test Suite', () => {
  beforeEach(async () => {
    await setupTestDatabase() // Fresh database
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await teardownTestDatabase()
  })

  it('should perform workflow correctly', async () => {
    // Use real db operations
    await db.projects.add({ id: 'test-1', name: 'Test' })
    // ... rest of test
  })
})
```

### 4. Testing React Hooks

```typescript
import { renderHook, waitFor, act } from '@testing-library/react'

it('should update state correctly', async () => {
  const { result } = renderHook(() => useCustomHook())

  // Wait for async operations
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  // Trigger state changes
  await act(async () => {
    await result.current.updateData({ value: 'new' })
  })

  // Verify state
  expect(result.current.data).toEqual({ value: 'new' })
})
```

### 5. Mocking

```typescript
// Mock a module
vi.mock('@/lib/google', () => ({
  uploadFile: vi.fn().mockResolvedValue({ fileId: 'mock-id' }),
}))

// Mock a function
const mockFn = vi.fn().mockResolvedValue('result')

// Verify mock calls
expect(mockFn).toHaveBeenCalledWith('expected-arg')
expect(mockFn).toHaveBeenCalledTimes(1)

// Mock implementation
mockFn.mockImplementation(async (arg) => {
  return `processed-${arg}`
})
```

---

## Test Organization

### Directory Structure

```
tests/
├── integration/          # Integration tests
│   ├── test-utils.ts    # Shared test utilities
│   ├── useProject.test.ts
│   ├── useProjects.test.ts
│   ├── useFloorplans.test.ts
│   └── useActiveFloorplan.test.ts
├── hooks/               # Hook unit tests
│   ├── useAuth.test.ts
│   ├── useProjectSync.test.ts
│   └── use-mobile.test.ts
├── api/                 # API endpoint tests
│   ├── checkout.test.ts
│   ├── billing-portal.test.ts
│   └── drive/
│       ├── upload-photo.test.ts
│       └── delete-project.test.ts
└── [feature].test.ts    # Other unit tests
```

### Test Utilities (`tests/integration/test-utils.ts`)

Shared utilities for integration tests:

```typescript
// Database lifecycle
export async function setupTestDatabase()
export async function teardownTestDatabase()

// Test data factories
export function createTestProject(overrides?: Partial<ProjectRow>)
export function createTestFloorplan(projectId: string, overrides?: Partial<FloorplanRow>)
export function createTestPin(floorplanId: string, overrides?: Partial<PinRow>)
export function createTestPhoto(pinId: string, overrides?: Partial<PhotoRow>)

// Mock factories
export function createMockFile(name?: string, type?: string, size?: number): File

// Composite helpers
export async function seedTestProject() // Returns complete project structure
```

---

## Best Practices

### 1. Test Isolation

✅ **Do:**
- Reset database state between tests
- Clear mocks in `beforeEach`/`afterEach`
- Use unique IDs for test data
- Avoid shared mutable state

❌ **Don't:**
- Rely on test execution order
- Share state between tests
- Use hardcoded delays (`setTimeout`)
- Leave database entries after tests

### 2. Descriptive Test Names

```typescript
// ✅ Good - Describes behavior and expected outcome
it('should return validation error when email is missing')
it('should create project with Drive folder when online')
it('should fallback to first floorplan if URL param ID not found')

// ❌ Bad - Vague or implementation-focused
it('test validation')
it('checks the createProject function')
it('works correctly')
```

### 3. Test One Thing at a Time

```typescript
// ✅ Good - Single, clear assertion
it('should add pin to database', async () => {
  await addPin(pinData)
  const pin = await db.pins.get(pinData.id)
  expect(pin).toBeDefined()
})

it('should update project timestamp when adding pin', async () => {
  const before = await db.projects.get(projectId)
  await addPin(pinData)
  const after = await db.projects.get(projectId)
  expect(after.updatedAt).not.toBe(before.updatedAt)
})

// ❌ Bad - Testing multiple concerns
it('should add pin and update project and create outbox entry', async () => {
  await addPin(pinData)
  expect(await db.pins.get(pinData.id)).toBeDefined()
  expect(await db.projects.get(projectId)).toBeDefined()
  expect((await db.outbox.toArray()).length).toBeGreaterThan(0)
})
```

### 4. Use Arrange-Act-Assert Pattern

```typescript
it('should compress photo before adding to database', async () => {
  // Arrange - Set up test data
  const mockFile = createMockFile('photo.jpg', 'image/jpeg', 5 * 1024 * 1024)
  const pinId = 'test-pin-1'

  // Act - Execute the code under test
  await addPhoto(pinId, mockFile)

  // Assert - Verify the results
  expect(compressImageToJpeg).toHaveBeenCalledWith(
    mockFile,
    expect.any(Number),
    expect.any(Number)
  )
})
```

### 5. Mock External Dependencies

```typescript
// ✅ Good - Mock external services
vi.mock('@/lib/google', () => ({
  uploadToGoogleDrive: vi.fn().mockResolvedValue({ fileId: 'mock-id' }),
}))

// ✅ Good - Use fake implementations for infrastructure
import 'fake-indexeddb/auto' // In test setup

// ❌ Bad - Making real API calls in tests
it('should upload to Google Drive', async () => {
  await uploadToGoogleDrive(file) // This hits the real API!
})
```

### 6. Test Error Cases

```typescript
describe('Error Handling', () => {
  it('should throw error when project not found', async () => {
    await expect(
      getProject('non-existent-id')
    ).rejects.toThrow('Project not found')
  })

  it('should handle Drive API failures gracefully', async () => {
    vi.mocked(uploadToGoogleDrive).mockRejectedValue(
      new Error('Drive API error')
    )
    
    const result = await syncProject(projectId)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('Drive API error')
  })
})
```

---

## Coverage Goals

### Target Coverage Levels

| Category | Target | Current |
|----------|--------|---------|
| Overall | 70%+ | Varies |
| Critical Paths | 90%+ | Varies |
| Hooks (`lib/hooks/`) | 80%+ | 63% (use-projects) |
| API Routes | 80%+ | Good |
| Utilities | 70%+ | TBD |

### Critical Paths Requiring High Coverage

1. **Authentication & Authorization** (`lib/hooks/use-auth.ts`)
2. **Data Persistence** (`lib/hooks/use-projects.ts`)
3. **Sync Operations** (`lib/sync.ts`)
4. **Payment Integration** (`app/api/checkout/`, `app/api/billing-portal/`)
5. **Drive Integration** (`app/api/drive/*`)

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

**Coverage Report Locations:**
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`
- Text: Console output

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Generate coverage
        run: npm run test:coverage
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:changed",
      "pre-push": "npm test"
    }
  }
}
```

---

## Common Testing Patterns

### Testing Async Operations

```typescript
it('should load project data asynchronously', async () => {
  const { result } = renderHook(() => useProject(projectId, null))

  // Wait for loading to complete
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  expect(result.current.project).toBeDefined()
})
```

### Testing State Updates

```typescript
it('should update state when adding a pin', async () => {
  const { result } = renderHook(() => useProject(projectId, null))

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  const initialCount = result.current.project?.pins.length || 0

  await act(async () => {
    await result.current.addPin(newPinData)
  })

  await waitFor(() => {
    expect(result.current.project?.pins.length).toBe(initialCount + 1)
  })
})
```

### Testing Form Validation

```typescript
it('should validate email format', () => {
  expect(validateEmail('valid@example.com')).toBe(true)
  expect(validateEmail('invalid-email')).toBe(false)
  expect(validateEmail('')).toBe(false)
})
```

---

## Debugging Tests

### Running in Debug Mode

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/vitest run

# Use VS Code debugger
# Add launch.json configuration:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["run"],
  "console": "integratedTerminal"
}
```

### Common Issues

**Tests timing out:**
- Increase timeout: `it('test', async () => {...}, 10000)`
- Check for missing `await` statements
- Verify mocks are properly configured

**Database state pollution:**
- Ensure `setupTestDatabase()` is called in `beforeEach`
- Use unique IDs for test data
- Verify `teardownTestDatabase()` is called

**Flaky tests:**
- Avoid hardcoded delays
- Use `waitFor` for async operations
- Ensure test isolation

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Fake IndexedDB](https://github.com/dumbmatter/fakeIndexedDB)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## Getting Help

- Check existing tests for examples
- Review test utilities in `tests/integration/test-utils.ts`
- Ask team members for guidance on complex testing scenarios
- Consult the testing framework documentation

---

**Last Updated:** 2025-11-27
