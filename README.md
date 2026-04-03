# Financial Dashboard Backend

Production-ready backend system for a Financial Dashboard using Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

## Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Zod validation
- Swagger documentation

## Key Features

- JWT-based register/login authentication
- Strict RBAC with `VIEWER`, `ANALYST`, `ADMIN`
- Financial records CRUD with filters and search
- Category management with fixed system categories + custom user categories
- Dashboard analytics (totals, net balance, category totals, recent transactions, monthly trends)
- Centralized validation and error handling
- Swagger API docs at `/api/docs`
- Built-in API tester frontend at `/tester`

## Project Structure

```text
src/
  controllers/
  services/
  routes/
  middlewares/
  validators/
  prisma/
  utils/
  config/
  types/
  app.ts
  server.ts
prisma/
  schema.prisma
```

## RBAC Matrix

- `VIEWER`: `GET /api/dashboard`
- `ANALYST`: `GET /api/records`, `GET /api/dashboard`
- `ADMIN`: full access (`/api/records` CRUD + `/api/users` management + dashboard)

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Financial Records

- `POST /api/records` (ADMIN)
- `GET /api/records` (ANALYST, ADMIN)
- `PATCH /api/records/:id` (ADMIN)
- `DELETE /api/records/:id` (ADMIN)

Filters on `GET /api/records`:

- `type` (`INCOME`/`EXPENSE`)
- `category`
- `search` (notes/category)
- `userId` (ADMIN only scope)
- `startDate`, `endDate`
- `sortBy` (`date`/`amount`/`createdAt`)
- `sortOrder` (`asc`/`desc`)
- `page`, `limit`

Access behavior:

- `ANALYST` and `ADMIN` can fetch all records
- `userId` filter can be used to narrow results

### Categories

- `GET /api/categories` (all authenticated roles)
- `POST /api/categories` (all authenticated roles)

System categories are auto-seeded at server startup, and users can add more categories.

### Dashboard Analytics

- `GET /api/dashboard` (VIEWER, ANALYST, ADMIN)

Supported query params:

- `startDate`, `endDate`

### User Management (Admin)

- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`

Safety guard:

- The last active `ADMIN` cannot be demoted or deactivated.

### Health

- `GET /api/health`

## Example Dashboard Response

`GET /api/dashboard`

```json
{
  "success": true,
  "message": "Dashboard analytics fetched successfully",
  "data": {
    "totals": {
      "income": 15400,
      "expenses": 7200,
      "netBalance": 8200
    },
    "categoryWiseTotals": [
      {
        "category": "Salary",
        "type": "INCOME",
        "total": 12000
      },
      {
        "category": "Rent",
        "type": "EXPENSE",
        "total": 3000
      }
    ],
    "recentTransactions": [
      {
        "id": 19,
        "amount": 1500,
        "type": "INCOME",
        "category": "Freelance",
        "date": "2026-03-28T00:00:00.000Z",
        "notes": "Client payout",
        "userId": 2
      }
    ],
    "monthlyTrends": [
      {
        "month": "2026-01",
        "totalIncome": 5000,
        "totalExpenses": 2500,
        "netBalance": 2500
      }
    ]
  }
}
```

## Validation Rules

- `amount` must be positive
- `type` must be `INCOME` or `EXPENSE`
- date fields must be valid dates

## Error Response Contract

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "amount: Amount must be a positive value"
}
```

## Environment Variables

See `.env.example`.

Required values:

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

## Run Locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

API docs: `http://localhost:4000/api/docs`
API tester UI: `http://localhost:4000/tester`
