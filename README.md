# Financial Dashboard Backend

Production-ready backend for a Financial Dashboard built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## 1. What This Project Does

This backend provides:

- JWT authentication and role-based access control (RBAC)
- Financial records management (create, read, update, delete)
- Dashboard analytics APIs (totals, trends, recent transactions)
- Category system with default categories and custom user categories
- Centralized validation, error handling, and rate limiting
- Swagger API docs and a built-in API testing UI

## 2. Tech Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- JWT (`jsonwebtoken`)
- `express-rate-limit`
- Swagger (`swagger-jsdoc`, `swagger-ui-express`)

## 3. Project Structure

```text
src/
  app.ts
  server.ts
  config/
  controllers/
  middlewares/
  prisma/
  routes/
  services/
  types/
  utils/
  validators/
prisma/
  schema.prisma
  migrations/
frontend/
  index.html
  style.css
  script.js
```

## 4. Data Models

### User

- `id`
- `email` (unique)
- `password` (hashed)
- `role` (`VIEWER` | `ANALYST` | `ADMIN`)
- `isActive`
- `createdAt`
- `updatedAt`

### FinancialRecord

- `id`
- `amount`
- `type` (`INCOME` | `EXPENSE`)
- `category`
- `date`
- `notes`
- `userId`
- `createdAt`
- `updatedAt`

### Category

- `id`
- `name`
- `normalizedName`
- `type` (`INCOME` | `EXPENSE`)
- `isSystem`
- `createdById`
- `createdAt`
- `updatedAt`

## 5. Role Permissions (RBAC)

- `VIEWER`
- Can access dashboard analytics
- Can read categories and create custom categories

- `ANALYST`
- Can read all financial records
- Can access dashboard analytics
- Can read categories and create custom categories

- `ADMIN`
- Full access to financial records CRUD
- User management access
- Dashboard and category access

Admin safety protections:

- Admin cannot deactivate themselves
- Admin cannot demote themselves
- Last active admin cannot be demoted or deactivated

## 6. API Route List

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Note:

- Public register allows `VIEWER` or `ANALYST`
- `ADMIN` should be created by bootstrap/promotion through admin flow or DB setup

### Categories

- `GET /api/categories`
- Query: `type`
- `POST /api/categories`

### Financial Records

- `GET /api/records` (ANALYST, ADMIN)
- `POST /api/records` (ADMIN)
- `PATCH /api/records/:id` (ADMIN)
- `DELETE /api/records/:id` (ADMIN)

`GET /api/records` query options:

- `type`
- `category`
- `search` (notes/category)
- `userId`
- `startDate`
- `endDate`
- `sortBy` (`date` | `amount` | `createdAt`)
- `sortOrder` (`asc` | `desc`)
- `page`
- `limit`

### Dashboard

- `GET /api/dashboard` (VIEWER, ANALYST, ADMIN)
- Query: `startDate`, `endDate`

Returns:

- Total income
- Total expenses
- Net balance
- Category-wise totals
- Recent 5 transactions
- Monthly trends

### Users (Admin)

- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`

## 7. Default System Categories

Auto-seeded on server startup.

Income:

- Salary
- Freelance
- Investments
- Business
- Other Income

Expense:

- Rent
- Food
- Utilities
- Transport
- Health
- Entertainment
- Other Expense

Users can create additional categories using `POST /api/categories`.

## 8. Validation and Error Format

Validation examples:

- Amount must be positive
- Type must be `INCOME` or `EXPENSE`
- Dates must be valid

Error response format:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "amount: Amount must be a positive value"
}
```

## 9. Security and Stability Features

- Password hashing with bcrypt
- JWT auth middleware
- Role-based authorization middleware
- Global API rate limiting
- Stricter rate limiting for auth endpoints
- Centralized async error handling
- Last-admin lockout protection
- DB-side monthly trend aggregation for scalability

## 10. Environment Variables

Create `.env` from `.env.example`.

Required:

- `DATABASE_URL`
- `DIRECT_URL`
- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_MAX`

## 11. Local Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Useful local URLs:

- API base: `http://localhost:4000/api`
- Swagger docs: `http://localhost:4000/api/docs`
- API tester UI: `http://localhost:4000/tester`

Production URLs:

- API base: `https://finance-dashboard-backend-kti2.onrender.com/api`
- Swagger docs: `https://finance-dashboard-backend-kti2.onrender.com/api/docs`

## 12. Deployment (Render)

Use production mode. Do not run `npm run dev`.

Render settings:

- Build command: `npm run build`
- Start command: `npm run prisma:migrate:deploy && npm start`

Important:

- Make sure all environment variables are set in Render dashboard
- `postinstall` and `build` already run `prisma generate`

## 13. Common Deployment/Runtime Issues

### Issue: `Module '@prisma/client' has no exported member 'Role'`

Cause:

- Prisma Client was not generated in deploy environment

Fix:

- Use the build/start commands above
- Redeploy with cache clear

### Issue: `password authentication failed for user "postgres"`

Cause:

- Wrong `DATABASE_URL` credentials

Fix:

- Update DB username/password/host in `.env` or Render env

### Issue: `Cannot set property query of #<IncomingMessage>`

Cause:

- Mutating `req.query` directly in Express 5

Fix:

- Store parsed query separately (already fixed in this project)

## 14. Hardest Parts / Real Challenges in This Project

These are typically the hardest and most error-prone parts:

1. Authentication and secure RBAC design
- It is easy to allow accidental privilege escalation.
- The tricky part is consistent route-level + service-level checks.

2. Preventing admin lockout
- Many projects forget this.
- Without last-admin protection, one bad update can lock the whole system.

3. Scalable analytics
- Simple implementations load too much data into memory.
- Monthly trends should be aggregated in SQL, not in Node loops.

4. Validation in Express 5 runtime
- Mutating `req.query` can break at runtime.
- Safe validated-query handling is needed.

5. Category consistency across records
- If categories are free text only, data becomes messy.
- You need normalized categories + custom category support + type matching.

6. Deployment with Prisma
- Many failures happen because Prisma Client is not generated in cloud build/runtime.
- Build/start scripts must be deployment-safe.

7. Long-term quality gaps (next improvements)
- Add test suite (unit + integration)
- Add structured logging + request IDs
- Add caching for analytics-heavy routes
- Add refresh-token flow and optional email verification

## 15. Scripts

- `npm run dev` - Start dev server with nodemon + ts-node
- `npm run build` - Generate Prisma client and compile TypeScript
- `npm start` - Run compiled app (`dist/server.js`)
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Create/apply local migration
- `npm run prisma:migrate:deploy` - Apply migrations in production
- `npm run prisma:studio` - Open Prisma Studio

---

If you are submitting this for internship screening, this README is designed so reviewers can run, test, and understand the architecture quickly.
