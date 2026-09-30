# SplitEase

SplitEase is a REST API for splitting shared expenses, similar to Splitwise. Users sign up, create groups, add friends, and record who paid for what. SplitEase splits each expense equally and works out each member's net balance. It also suggests the fewest transfers needed to settle up.

Money is stored as exact `numeric(12,2)` values, and all calculations use integer cents. Balances therefore never drift because of floating-point rounding.

## Tech Stack

- **NestJS 12** — Node.js framework (TypeScript)
- **PostgreSQL** — relational database
- **TypeORM** — entities, relations, query builder, transactions
- **Passport + JWT** — stateless bearer-token auth; passwords hashed with **bcrypt**
- **class-validator / class-transformer** — request validation and response serialization
- **@nestjs/swagger** — OpenAPI docs with an interactive Swagger UI
- **Jest + ts-jest** — unit tests

## Features

- **Auth**
  - Register and log in with email and password. Emails are normalized, and passwords are hashed with bcrypt.
  - Log in to receive a JWT access token, then use `GET /auth/me` to fetch the current user.
  - Login returns the same error for an unknown email and a wrong password, so accounts can't be probed.
- **Groups**
  - Create a group. The creator becomes its **admin**.
  - Admins add members by email or user ID. Duplicate memberships are rejected with `409`.
  - A user sees only the groups they belong to. Other groups return `403` for non-members and `404` if they don't exist.
- **Expenses**
  - Add an expense paid by one member and split **equally** among the selected members. The payer may or may not share the cost.
  - Leftover cents from an uneven split go to the first shares, so the shares always add up exactly to the total.
  - The expense and its splits are written in a single **DB transaction**.
  - Expense lists are paginated (`?page=&limit=`), newest first.
- **Balances**
  - Shows each member's total paid, total owed, and **net** balance: positive means the member is owed money, negative means they owe money.
  - Suggests settlements ("who pays whom"), with at most _n − 1_ transfers.
- **Quality**
  - Every request body and query is validated. Unknown fields are rejected.
  - Password hashes never appear in responses.
  - Swagger docs cover every endpoint, and unit tests cover the balance logic, the money helpers and auth.
  - `GET /health` provides a liveness check.

## Getting Started

**Prerequisites:** Node.js 20+ and a PostgreSQL database. This can be a local install or a free cloud database such as [Neon](https://neon.tech).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your environment file and fill in your values (see below):
   ```bash
   cp .env.example .env
   ```
3. Start the dev server, which reloads automatically when files change:
   ```bash
   npm run start:dev
   ```
4. Check that the server is running:
   ```bash
   curl http://localhost:3000/health
   # {"status":"ok"}
   ```
5. Open the API docs at **http://localhost:3000/api/docs**.

With `DB_SYNCHRONIZE=true`, the tables are created automatically on first start.

## Environment Variables

| Variable         | Required | Default | Description                                                          |
| ---------------- | -------- | ------- | -------------------------------------------------------------------- |
| `PORT`           | no       | `3000`  | HTTP port                                                            |
| `NODE_ENV`       | no       | —       | `development` / `production`                                         |
| `DB_HOST`        | yes      | —       | PostgreSQL host                                                      |
| `DB_PORT`        | no       | `5432`  | PostgreSQL port                                                      |
| `DB_USERNAME`    | yes      | —       | Database user                                                        |
| `DB_PASSWORD`    | yes      | —       | Database password                                                    |
| `DB_NAME`        | yes      | —       | Database name                                                        |
| `DB_SSL`         | no       | `false` | `true` for cloud providers that require TLS (e.g. Neon)              |
| `DB_SYNCHRONIZE` | no       | `false` | Auto-create tables from entities. Use `true` only in development.    |
| `JWT_SECRET`     | yes      | —       | Long random secret, e.g. `openssl rand -hex 64`                      |
| `JWT_EXPIRES_IN` | yes      | —       | Token lifetime, e.g. `15m`, `1h`, `1d`                               |

## API Documentation

When the app is running, the interactive Swagger UI is available at **`http://localhost:3000/api/docs`**, and the raw OpenAPI JSON at `/api/docs-json`.

To try the protected routes:

1. Call `POST /auth/login` and copy the `accessToken` from the response.
2. Click **Authorize** and paste the token.

## API Endpoints

🔒 = requires `Authorization: Bearer <token>`

| Method | Path                    | Auth | Description                                           |
| ------ | ----------------------- | ---- | ----------------------------------------------------- |
| GET    | `/health`               |      | Liveness check                                        |
| POST   | `/auth/register`        |      | Create an account                                     |
| POST   | `/auth/login`           |      | Log in → `{ accessToken }`                            |
| GET    | `/auth/me`              | 🔒   | Current user                                          |
| POST   | `/groups`               | 🔒   | Create a group (caller becomes admin)                 |
| GET    | `/groups`               | 🔒   | List groups the caller belongs to                     |
| GET    | `/groups/:id`           | 🔒   | Group details and members (members only)              |
| POST   | `/groups/:id/members`   | 🔒   | Add a member by `email` or `userId` (admin only)      |
| POST   | `/groups/:id/expenses`  | 🔒   | Add an expense split equally among participants       |
| GET    | `/groups/:id/expenses`  | 🔒   | List expenses, paginated (`?page=1&limit=20`)         |
| GET    | `/groups/:id/balances`  | 🔒   | Net balance per member and suggested settlements      |

### Example: balances

Suppose Alice pays 90.00 for dinner, split equally among Alice, Bob and Carol:

```json
{
  "balances": [
    { "name": "Alice", "paid": "90.00", "owed": "30.00", "net": "60.00" },
    { "name": "Bob",   "paid": "0.00",  "owed": "30.00", "net": "-30.00" },
    { "name": "Carol", "paid": "0.00",  "owed": "30.00", "net": "-30.00" }
  ],
  "settlements": [
    { "from": { "name": "Bob" },   "to": { "name": "Alice" }, "amount": "30.00" },
    { "from": { "name": "Carol" }, "to": { "name": "Alice" }, "amount": "30.00" }
  ]
}
```

The example is trimmed for readability: the real response also includes each user's `id` and `email`.

## Testing

```bash
npm test          # run all unit tests
npm run test:cov  # with coverage report
```

The unit tests cover:

- **Balance calculation** (`src/expenses/balances.spec.ts`):
  - A 3-way equal split, an empty group, and members with no expenses.
  - An uneven split, where the nets must still sum to zero.
  - Several payers, and a payer who is not part of the split.
  - Settlements.
- **ExpensesService.getBalances**:
  - Maps SQL totals to balances.
  - Enforces membership.
- **Money helpers**:
  - Cents conversion and formatting.
  - Equal splitting with remainders.
- **AuthService**:
  - Password hashing on register.
  - Login success, wrong password, and unknown email.

The tests do not need a database.

## Scripts

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `npm run start:dev`  | Start in watch mode              |
| `npm run build`      | Compile to `dist/`               |
| `npm run start:prod` | Run the compiled build           |
| `npm test`           | Run unit tests                   |
| `npm run test:cov`   | Run unit tests with coverage     |
| `npm run format`     | Format sources with Prettier     |
