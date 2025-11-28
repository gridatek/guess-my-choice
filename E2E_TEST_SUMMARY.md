# E2E Test Suite Summary

This document provides a comprehensive overview of all E2E tests created for the Guess My Choice
project.

## Frontend App - Game Flow Tests

### File: `apps/frontend/e2e/game-complete-flow.spec.ts`

Comprehensive 2-player game flow testing with 12 test suites:

1. **Game Creation Flow**
   - Creating sessions with different types (friends/couple/adult)
   - Session type selection validation
   - Navigation to session lobby

2. **Session Lobby - Player 1 Waiting**
   - Session code display and copy functionality
   - Player status indicators
   - Waiting state UI

3. **Player 2 Joining**
   - Join by session code
   - Invalid code error handling
   - Session full prevention

4. **Lobby - Both Players Ready**
   - Realtime updates when second player joins
   - Player list synchronization
   - Ready state management

5. **Starting the Game**
   - Player 1 authorization to start
   - Navigation to game play screen
   - Round initialization

6. **Game Play - Round 1**
   - Option selection and submission
   - Turn management (active/waiting player)
   - Option display and interaction

7. **Round Completion**
   - Scoring logic (correct guess = 10 points)
   - Result overlay display
   - Next round navigation

8. **Game Completion**
   - Final round detection
   - Navigation to results page
   - Session state updates

9. **Results Page**
   - Final score display
   - Connection strength message
   - Round-by-round breakdown
   - Rematch functionality

10. **Session List Management**
    - Active sessions display
    - Session filtering and sorting
    - Navigation between sessions

11. **Realtime Updates**
    - Live synchronization between players
    - Turn state updates
    - Score updates

12. **Error Handling**
    - Network error handling
    - Session not found errors
    - Invalid state handling

**Test Patterns:**

- Multi-browser context simulation (2 players)
- Isolated cookie/session management
- Realtime synchronization testing
- Helper functions for common operations

---

## Admin App - Management Tests

### File: `apps/admin/e2e/options-management.spec.ts`

Complete CRUD and management tests for game options (formerly posts):

**Test Suites:**

1. **Options Management - CRUD Operations** (18 tests)
   - Display options list page
   - Navigate to create option page
   - Create draft option
   - Create published option with all session types
   - Filter options by session type
   - Filter options by status
   - Edit existing option
   - Delete option
   - Difficulty level badge display
   - Required field validation
   - Difficulty level range validation
   - Cancel option creation
   - Search options by text
   - Display option tags
   - Pagination controls
   - Bulk update option status

2. **Options Management - Session Type Specific** (3 tests)
   - Create friends session option
   - Create couple session option
   - Create adult session option

3. **Options Management - Categories Integration** (2 tests)
   - Assign category to option
   - Show link to create category if none exist

4. **Options Management - Error Handling** (3 tests)
   - Handle XSS attempts in option text
   - Handle network errors gracefully
   - Validate offline mode behavior

**Key Features:**

- Comprehensive CRUD coverage
- Session type filtering (friends/couple/adult)
- Difficulty level validation (1-5)
- Status management (draft/published/archived)
- Tags support
- Category assignment
- XSS prevention testing
- Network error handling

---

### File: `apps/admin/e2e/questions-management.spec.ts`

Complete CRUD and management tests for game questions:

**Test Suites:**

1. **Questions Management - CRUD Operations** (14 tests)
   - Display questions list page
   - Navigate to create question page
   - Create draft question
   - Create published question
   - Filter questions by session type
   - Filter questions by status
   - Edit existing question
   - Delete question
   - Required field validation
   - Cancel question creation
   - Search questions by text
   - Display question tags
   - Show view count for questions
   - Pagination controls

2. **Questions Management - Session Type Specific** (4 tests)
   - Create friends session question
   - Create couple session question
   - Create adult session question
   - Create all session types and filter them

3. **Questions Management - Status Management** (3 tests)
   - Create draft question and publish it
   - Archive a question
   - Bulk update question status

4. **Questions Management - Error Handling** (3 tests)
   - Handle XSS attempts in question text
   - Validate question text length
   - Handle duplicate question prevention

**Key Features:**

- Full CRUD operations
- Session type filtering
- Status workflow (draft → published → archived)
- View count tracking
- Tags management
- Search functionality
- Bulk operations
- Input validation and sanitization

---

### File: `apps/admin/e2e/categories-updated.spec.ts`

Updated categories management tests aligned with options/questions schema:

**Test Suites:**

1. **Categories Management - Core CRUD** (8 tests)
   - Display categories page
   - Create new category
   - Edit category
   - Delete category
   - Required field validation
   - Clear form after creation
   - Validate slug format
   - Prevent duplicate category names

2. **Categories Management - Integration with Options** (3 tests)
   - Link category to option
   - Show category count for options
   - Show category count for questions
   - Warn when deleting category with linked items

3. **Categories Management - Filtering and Search** (3 tests)
   - Search categories by name
   - Sort categories alphabetically
   - Filter categories by usage

4. **Categories Management - Validation and Error Handling** (5 tests)
   - Handle XSS attempts in category name
   - Validate category name length
   - Auto-generate slug from name
   - Handle concurrent category creation
   - Input sanitization

5. **Categories Management - Bulk Operations** (2 tests)
   - Bulk delete categories
   - Export categories list

**Key Features:**

- CRUD operations
- Integration with options and questions
- Usage statistics (option count, question count)
- Slug auto-generation
- Search and filtering
- Bulk operations
- Export functionality
- XSS prevention

---

### File: `apps/admin/e2e/dashboard-analytics.spec.ts`

Comprehensive admin dashboard and analytics testing:

**Test Suites:**

1. **Admin Dashboard - Overview** (10 tests)
   - Display admin dashboard
   - Show admin navigation links
   - Display statistics cards
   - Show total options count
   - Show total questions count
   - Show total categories count
   - Show total users count (admin only)
   - Navigate to different sections from dashboard
   - Show user profile information
   - Logout functionality

2. **Admin Dashboard - Recent Activity** (3 tests)
   - Display recent options
   - Display recent questions
   - Click on recent item to edit

3. **Admin Dashboard - Charts and Analytics** (4 tests)
   - Display options by session type chart
   - Display questions by session type chart
   - Display status distribution chart
   - Toggle chart time range

4. **Admin Dashboard - Quick Actions** (4 tests)
   - Quick action to create option
   - Quick action to create question
   - Quick action to create category
   - Quick action to manage users (admin only)

5. **Admin Dashboard - Non-Admin View** (4 tests)
   - Hide admin link for non-admin users
   - Hide user management stats for non-admin
   - Prevent direct access to admin panel
   - Allow access to own profile

6. **Admin Dashboard - Responsive Design** (2 tests)
   - Display properly on mobile
   - Display properly on tablet

7. **Admin Dashboard - Performance and Loading** (3 tests)
   - Show loading state while fetching data
   - Handle refresh gracefully
   - Handle error state gracefully

8. **Admin Dashboard - Search and Filters** (3 tests)
   - Global search functionality
   - Filter dashboard by session type
   - Filter dashboard by date range

**Key Features:**

- Statistics overview
- Recent activity tracking
- Charts and data visualization
- Quick actions
- Role-based access control
- Responsive design testing
- Performance and loading states
- Error handling
- Global search
- Filtering capabilities

---

## Existing Admin Tests (Reference)

### File: `apps/admin/e2e/admin.spec.ts`

- User management CRUD operations (already covered)
- Admin role verification
- User creation/edit/delete

### File: `apps/admin/e2e/auth.spec.ts`

- Login/logout flows
- Signup functionality
- Password reset

### File: `apps/admin/e2e/profile.spec.ts`

- Profile viewing
- Profile editing
- Avatar management

### File: `apps/admin/e2e/posts.spec.ts`

- **Note:** This file is OUTDATED
- Tests reference "posts" which has been migrated to "options"
- Should be replaced with `options-management.spec.ts`

---

## Test Coverage Summary

### Frontend App

- **Total Test Files:** 2 (1 new comprehensive flow test)
- **Test Suites:** 12
- **Coverage Areas:**
  - Complete 2-player game flow
  - Realtime synchronization
  - Session management
  - Game mechanics and scoring
  - Error handling

### Admin App

- **Total Test Files:** 7 (4 new comprehensive test files)
- **New Test Files:**
  1. `options-management.spec.ts` - 26 tests
  2. `questions-management.spec.ts` - 24 tests
  3. `categories-updated.spec.ts` - 21 tests
  4. `dashboard-analytics.spec.ts` - 33 tests
- **Total New Tests:** 104 tests
- **Coverage Areas:**
  - Options CRUD (replaces posts)
  - Questions CRUD (new feature)
  - Categories management (updated)
  - Dashboard and analytics
  - Role-based access control
  - Error handling and validation
  - XSS prevention
  - Network error handling
  - Responsive design

---

## Running the Tests

### Frontend Tests

```bash
# Run all frontend E2E tests
pnpm frontend:e2e

# Run with UI
pnpm --filter @guess-my-choice/frontend e2e:ui

# Run in headed mode
pnpm --filter @guess-my-choice/frontend e2e:headed

# Debug mode
pnpm --filter @guess-my-choice/frontend e2e:debug
```

### Admin Tests

```bash
# Run all admin E2E tests
pnpm --filter @guess-my-choice/admin e2e

# Run with UI
pnpm --filter @guess-my-choice/admin e2e:ui

# Run specific test file
pnpm --filter @guess-my-choice/admin e2e options-management.spec.ts

# Run in headed mode
pnpm --filter @guess-my-choice/admin e2e:headed
```

---

## Test-Driven Development Workflow

1. **Phase 1: Test Creation** ✅ (Completed)
   - All E2E tests have been created
   - Tests define expected behavior
   - Component interfaces defined via data-testid attributes

2. **Phase 2: Implementation** (Next Steps)
   - Run tests to identify failures
   - Implement components one by one
   - Add required data-testid attributes
   - Implement business logic
   - Iterate until tests pass

3. **Phase 3: Refinement**
   - Fix edge cases
   - Optimize performance
   - Add error handling
   - Improve UX

---

## Key Testing Patterns Used

### Multi-Context Testing (Frontend)

```typescript
const player1Context = await browser.newContext();
const player2Context = await browser.newContext();
const player1Page = await player1Context.newPage();
const player2Page = await player2Context.newPage();
```

### Helper Functions

```typescript
async function loginUser(page: Page, email: string, password: string);
async function getSessionCode(page: Page): Promise<string>;
async function joinSession(page: Page, code: string);
```

### Unique Test Data Generation

```typescript
function getUniqueTestOption() {
  const timestamp = Date.now();
  return {
    text: `Test Option ${timestamp}`,
    // ...
  };
}
```

### Error Handling Tests

```typescript
// Network error simulation
await page.context().setOffline(true);
await page.getByTestId('submit-button').click();
const errorMessage = page.getByTestId('error-message');
await expect(errorMessage).toBeVisible();
await page.context().setOffline(false);
```

### XSS Prevention Tests

```typescript
const xssText = '<script>alert("XSS")</script>Safe Text';
await page.getByTestId('input').fill(xssText);
await page.getByTestId('submit-button').click();
await expect(page.locator('script')).toHaveCount(0);
await expect(page.locator('text=Safe Text')).toBeVisible();
```

---

## Required data-testid Attributes

### Frontend Game Components

- `email-input`, `password-input`, `submit-button`
- `session-type-select`, `create-session-button`
- `session-code`, `copy-code-button`
- `join-code-input`, `join-button`
- `player-status-*`, `player-name-*`
- `start-game-button`, `option-card-*`
- `submit-choice-button`, `waiting-message`
- `current-score`, `round-result`, `next-round-button`
- `final-score-*`, `connection-message`
- `round-breakdown`, `rematch-button`

### Admin Components

- Options: `options-link`, `create-option-button`, `option-item`
- Questions: `questions-link`, `create-question-button`, `question-item`
- Categories: `categories-link`, `category-item`
- Dashboard: `dashboard-title`, `stats-card`, `quick-create-*`
- Forms: `*-input`, `*-select`, `submit-button`, `cancel-button`
- Messages: `success-message`, `error-message`

---

## Next Steps

1. **Run Tests:** Execute E2E tests to see current failures
2. **Implement Components:** Start with frontend game components
3. **Add Data Attributes:** Add all required data-testid attributes
4. **Implement Logic:** Add game mechanics, Supabase queries, realtime subscriptions
5. **Iterate:** Fix failures one by one until all tests pass
6. **Optimize:** Improve performance and UX once tests pass

---

## Notes

- All tests use Playwright as the E2E testing framework
- Tests are designed to run in isolation with cookie clearing
- Seed data from `supabase/seed.sql` provides test users (alice@example.com, bob@example.com)
- Admin user: alice@example.com (is_admin = true)
- Regular user: bob@example.com (is_admin = false)
- Password for all test users: password123
