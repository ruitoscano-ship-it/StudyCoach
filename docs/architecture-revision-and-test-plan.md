# Architecture Revision and Test Plan

## Objectives

- Support local pilot tests with real users safely and repeatably.
- Promote the same architecture and quality gates to online environments.
- Reduce production risk with explicit health checks, CI gates, and test layers.

## Target Architecture (Local and Online)

```mermaid
flowchart LR
  EndUsers[Students Parents Teachers] --> NextApp[Next.js 16 App]
  NextApp --> ProxyLayer[proxy.ts AuthZ Route Guard]
  ProxyLayer --> ServerActions[Server Actions]
  ServerActions --> PrismaLayer[Prisma ORM]
  PrismaLayer --> PostgresDB[(PostgreSQL)]
  ServerActions --> AuthModule[NextAuth Credentials JWT]
  AuthModule --> PostgresDB
  NextApp --> HealthEndpoint[/api/health]
  HealthEndpoint --> PrismaLayer
  HealthEndpoint --> EnvValidation[Zod Env Validation]
```

## Delivery Topology

```mermaid
flowchart TB
  subgraph localStack [Local Pilot Environment]
    LocalUsers[Real pilot users]
    LocalUsers --> LocalApp[Next.js App Container]
    LocalApp --> LocalDb[(Postgres Container)]
    LocalApp --> LocalHealth[/api/health]
  end

  subgraph onlineStack [Online Stage]
    OnlineUsers[Internet users]
    OnlineUsers --> EdgeIngress[Managed ingress or reverse proxy]
    EdgeIngress --> OnlineApp[Next.js App]
    OnlineApp --> OnlineDb[(Managed PostgreSQL)]
    OnlineApp --> OnlineHealth[/api/health]
  end
```

## Adjustments Implemented

- Added environment contract validation with Zod in `src/lib/env.ts`.
- Added runtime health endpoint in `src/app/api/health/route.ts`:
  - validates required env
  - validates DB connectivity (`SELECT 1`)
  - returns machine-readable `ok`/`degraded`
- Introduced testing toolchain and scripts in `package.json`:
  - `test`, `test:integration`, `test:security`, `test:e2e`, `coverage`, `ci:local`, `typecheck`
- Added Vitest config in `vitest.config.ts` with coverage output.
- Added Playwright config in `playwright.config.ts` for browser E2E.
- Added CI pipeline in `.github/workflows/ci.yml` with staged jobs:
  - static checks
  - unit + security tests
  - integration tests with Postgres service
  - E2E tests with Playwright
- Added baseline tests:
  - `tests/unit/dates.test.ts`
  - `tests/integration/env.integration.test.ts`
  - `tests/security/password.security.test.ts`
  - `tests/e2e/auth-redirect.spec.ts`

## Test Cases for Real-User Validation

### Core User Journeys

- **Authentication**
  - Login with valid credentials by role (`STUDENT`, `PARENT`, `TEACHER`).
  - Login failure for invalid password.
  - Protected routes redirect to login if unauthenticated.
- **Role Authorization**
  - Parent cannot access teacher routes.
  - Student cannot access parent routes.
  - Teacher can access own class, cannot access another teacher class.
- **Class Management**
  - Teacher creates class and gets invite code.
  - Student joins class with valid code.
  - Invalid class code returns actionable error.
- **Homework and Progress**
  - Teacher assigns homework to class.
  - Student sees assigned homework and status transitions.
  - Parent sees child progress updates in dashboard.
- **Parent Collaboration**
  - Parent accepts invite token and links to student.
  - Parent can view only linked students.
  - Shared difficulty appears for parent when `shareWithParent=true`.

### Reliability and Operational Cases

- `GET /api/health` returns `200` when env and DB are valid.
- `GET /api/health` returns `503` when DB is unavailable.
- Application starts cleanly in Docker with DB dependency healthy.
- Prisma client generation succeeds in CI and container builds.

### Security Cases

- Passwords are hashed and validated through bcrypt.
- Session tampering attempts do not bypass role checks.
- Authorization checks block cross-student and cross-class access.
- Dependency audit is executed in CI on pull requests.

### Performance Smoke Cases

- Home dashboards load under agreed latency budget in local environment.
- Login and protected route redirect path remain within budget under light concurrency.
- No severe regressions between pilot versions (baseline vs candidate).

## Execution Plan

- **Phase 1 (Local pilots):**
  - Run `npm run ci:local` before each pilot release candidate.
  - Run `npm run test:e2e` for acceptance criteria.
  - Verify `/api/health` before enabling pilot access.
- **Phase 2 (Online stage):**
  - Enforce `.github/workflows/ci.yml` as required check.
  - Keep health endpoint integrated with monitoring.
  - Promote only artifacts that pass all CI stages.

## Commands

- Local quality gate: `npm run ci:local`
- Full local validation (including browser): `npm run ci:local && npm run test:e2e`
- Health check: `curl -i http://localhost:3000/api/health`
