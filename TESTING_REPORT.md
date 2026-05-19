# Testing Report — Recipe Community

**Project** - Recipe Community — Social Recipe Platform 
**Stack** - Node.js + Express + MongoDB + Next.js 
**Test Framework** - Jest + Supertest + React Testing Library 
**Total Tests** - 40 (30 backend + 10 frontend) 
**Status** - All tests passing 

 PASS  tests/app.test.js
  Utils › generateToken
    √ returns a string JWT (7 ms)
    √ payload contains the user id (7 ms)
    √ verifyToken throws on invalid token (16 ms)
  Utils › bcrypt password hashing
    √ hashed password differs from plaintext (93 ms)
    √ bcrypt.compare returns true for correct password (165 ms)
    √ bcrypt.compare returns false for wrong password (160 ms)
  Model › User validation
    √ fails when required fields are missing (10 ms)
    √ fails with invalid email format (4 ms)
    √ passes with valid required fields (5 ms)
    √ default role is "user" (1 ms)
  Model › Recipe validation
    √ fails without title (4 ms)
    √ fails with invalid difficulty (3 ms)
    √ passes with all required fields (5 ms)
  Model › Comment validation
    √ fails without text (3 ms)
    √ passes with all required fields (3 ms)
    √ default isEdited is false (2 ms)
  Model › Tag validation
    √ fails without required name (2 ms)
    √ default usageCount is 0 (1 ms)
  Middleware › protect
    √ returns 401 when no token provided (2 ms)
    √ returns 401 with malformed token (2 ms)
  API › Health check
    √ GET /api/health returns 200 (46 ms)
    √ GET /api/unknown returns 404 (11 ms)
  API › Auth routes
    √ POST /api/auth/register with missing fields returns 400 (37 ms)
    √ POST /api/auth/login with missing fields returns 400 (14 ms)
    √ GET /api/auth/me without token returns 401 (14 ms)
  API › Recipe routes
    √ POST /api/recipes without token returns 401 (15 ms)
    √ PUT /api/recipes/:id without token returns 401 (12 ms)
    √ DELETE /api/recipes/:id without token returns 401 (12 ms)
  API › Comment routes
    √ POST /api/comments/:recipeId without token returns 401 (16 ms)
    √ DELETE /api/comments/:id without token returns 401 (12 ms)

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        2.558 s
Ran all test suites.

 PASS  src/tests/frontend.test.js
  LoginPage
    √ renders email and password fields (175 ms)
    √ renders sign in button (47 ms)
    √ shows error on failed login (51 ms)
  RegisterPage
    √ renders all register fields (50 ms)
    √ shows error for short password (22 ms)
  Navbar
    √ shows Login and Sign Up for unauthenticated user (48 ms)
    √ shows RecipeCommunity logo (4 ms)
  Navbar (authenticated)
    √ shows Recipes and Add Recipe links when logged in (4 ms)
  FavoritesPage
    √ shows empty state when no saved recipes (55 ms)
    √ shows saved recipes when present (17 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        2.816 s, estimated 6 s

## Tools Used

**Jest** - Test runner for both backend and frontend 
**Supertest** - HTTP integration testing for Express API 
**React Testing Library** - Component testing for Next.js components 
**@testing-library/jest-dom** - Custom DOM matchers (toBeInTheDocument etc.) 
**bcryptjs** - Tested password hashing and comparison 
**jsonwebtoken** - Tested JWT generation and verification 

## How to Run Tests

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```