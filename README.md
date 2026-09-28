# SplitEase

An expense-splitting REST API (like Splitwise) for tracking shared expenses and settling balances between friends and groups.

## Tech Stack

- **NestJS** — Node.js framework (TypeScript)
- **PostgreSQL** — relational database
- **TypeORM** — ORM for entities and database access

## Planned Features

- [x] Project setup, PostgreSQL connection, `User` entity, health check
- [ ] User registration & login (JWT auth, hashed passwords)
- [ ] Groups — create groups and add members
- [ ] Expenses — add expenses and split them equally, by exact amounts, or by percentage
- [ ] Balances — see who owes whom within a group and overall
- [ ] Settlements — record payments to settle up debts
- [ ] Input validation, error handling, and API docs (Swagger)
- [ ] Database migrations and automated tests

## How to run locally

**Prerequisites:** Node.js 20+ and a PostgreSQL database (local install, or a free cloud database such as [Neon](https://neon.tech)).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your environment file and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```
3. Start the dev server (auto-reloads on changes):
   ```bash
   npm run start:dev
   ```
4. Check that it's running:
   ```bash
   curl http://localhost:3000/health
   # {"status":"ok"}
   ```

With `DB_SYNCHRONIZE=true`, the `users` table is created automatically on first start.

### Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm run start:dev`  | Start in watch mode             |
| `npm run build`      | Compile to `dist/`              |
| `npm run start:prod` | Run the compiled build          |
