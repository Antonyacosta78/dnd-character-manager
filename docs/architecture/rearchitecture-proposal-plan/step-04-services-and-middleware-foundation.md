# Step 4: Services and Middleware Foundation

## Metadata

- Status: `ready`
- Created At: `2026-05-21`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Marked step 4 as ready after review so service and middleware foundation work can follow scaffolding. Made with OpenCode.
- `2026-05-21` - `Antony Acosta` - Added step-4 plan for DB/Session service boundaries and mechanism-specific middleware migration. Made with OpenCode.

## Goal

- Implement infrastructure-facing service boundaries and entrypoint middleware contracts required by all operation migrations.

## Preconditions

- Step 3 scaffold merged and buildable.
- Error primitives available for middleware/service failures.

## Work Items

1. Build DB Service boundary
   - Create `src/server/services/db/client.ts` as central Prisma client entry.
   - Create repository classes grouped under DB service exports.
   - Add transaction-capability methods that keep transaction clients internal to DB service.

2. Build Session Service boundary
   - Encapsulate Better Auth interaction in `src/server/services/session/**`.
   - Expose typed caller/session operations for middleware and orchestrators.
   - Ensure auth-provider internals do not leak into entrypoints.

3. Implement middleware by mechanism
   - REST wrappers under `src/server/middleware/api/**` using `@nextwrappers/core`.
   - Server-function middleware under `src/server/middleware/server-function/**` using function/HOF composition.
   - Shared helper logic under `src/server/middleware/shared/**`.
   - No CLI middleware.

4. Implement middleware error families
   - Authentication, authorization, and schema-validation typed errors.
   - Consistent mapping inputs for entrypoint transport mappers.

5. Add baseline unit tests
   - Service tests for DB and session capability contracts.
   - Middleware tests for allow/deny/invalid-input behavior and sanitized failures.

## Deliverables

- Service modules under `src/server/services/db/**` and `src/server/services/session/**`
- Middleware modules under `src/server/middleware/{api,server-function,shared}/**`
- Typed middleware/service errors wired to entrypoint mapping helpers
- Unit tests for critical auth/validation and service behaviors

## Verification Gate

- `bun run lint`
- `bun run build`
- Targeted tests for middleware and services (`bun test` scoped to touched files)

## Exit Criteria

- Entrypoints can call middleware and services without touching legacy adapters/ports directly.
- Session and DB access paths are centralized and typed.
- Error outputs are transport-safe through shared mappers.

## Risks and Mitigations

- Risk: Session resolution and unauthenticated states handled inconsistently.
  - Mitigation: define one shared classification rule and assert it in middleware tests.
- Risk: transaction handling leaks to orchestrators.
  - Mitigation: expose atomic service methods for multi-write operations and prohibit transaction-client exports.

## Roadmap / Status Impact

- `no roadmap progress impact`
