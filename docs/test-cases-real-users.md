# Real User Test Cases (Local first, then Online)

## Test Strategy

- **Execution order:** Unit -> Integration -> E2E -> UAT.
- **Quality gate (recommended):**
  - 0 critical auth/data-leak failures
  - 0 production-blocking migration failures
  - >=95% pass in E2E critical journeys

## Critical Test Cases

### A) Authentication and Session

1. **Valid login per role**
   - Steps: login as student, parent, teacher.
   - Expected: session created, redirect to role home.
2. **Invalid credentials**
   - Steps: wrong password for existing account.
   - Expected: generic error, no session.
3. **Open redirect prevention**
   - Steps: open `/login?callbackUrl=https://evil.com`.
   - Expected: post-login redirect goes to `/`, never external domain.
4. **Route guard by role**
   - Steps: student visits `/professor`, teacher visits `/encarregado`.
   - Expected: redirected to own home.

### B) Authorization and Data Isolation

5. **Teacher class ownership enforcement**
   - Steps: teacher A requests class details of teacher B.
   - Expected: denied / not found.
6. **Parent student-link isolation**
   - Steps: parent A accesses snapshot of non-linked student.
   - Expected: denied.
7. **Student personal data isolation**
   - Steps: student attempts access to another student data resource.
   - Expected: denied.

### C) Core Functional Journeys

8. **Teacher creates class + invites**
   - Expected: class created, invite code works.
9. **Student joins class via invite code**
   - Expected: enrollment created once (idempotent behavior).
10. **Teacher assigns homework to class**
   - Expected: one homework per enrolled student.
11. **Student updates homework status**
   - Expected: status transitions reflected in student/teacher dashboards.
12. **Parent sees linked student updates**
   - Expected: parent dashboard shows only linked students.

### D) Guardian Invite Security

13. **Invite accept happy path**
   - Expected: pending link becomes accepted and bound to parent.
14. **Invite replay attempt**
   - Steps: accept same token twice.
   - Expected: second attempt rejected.
15. **Invalid token**
   - Expected: safe error response, no state mutation.

### E) Data and Migration Safety

16. **Dev startup with db push**
   - Expected: app starts in development with schema sync.
17. **Production startup without migrations**
   - Expected: container fails fast with clear error.
18. **Production startup with migrations**
   - Expected: `prisma migrate deploy` runs and app starts.

### F) Reliability / UX / Performance

19. **Health endpoint**
   - Expected: `/api/health` returns healthy with DB reachable.
20. **Basic performance smoke**
   - Expected: key pages render under acceptable threshold in local/online env.

## Mapping to Automated Suites

- **Unit:** helper sanitization, date/format logic, env parsing.
- **Integration:** server actions authz checks, DB mutation behavior.
- **E2E:** role login flows, class join/assign/track, parent visibility constraints.
- **Security tests:** redirect abuse, unauthorized access attempts, invite token abuse.

## UAT Script for Real Users

1. Teacher creates one class, assigns one TPC.
2. Student joins class, completes a TPC, shares one difficulty.
3. Parent accepts invite and confirms visibility in parent dashboard.
4. Teacher validates class detail dashboard updates.
5. Team logs defects with severity and reproduction steps.

## Go/No-Go Criteria for Online Stage

- All 20 critical tests pass.
- No unresolved critical/high security defects.
- Migration pipeline validated in a production-like environment.
- Monitoring/alert baseline enabled.

