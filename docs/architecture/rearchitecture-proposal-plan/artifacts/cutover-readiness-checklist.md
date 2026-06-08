# Step 2 Artifact: Cutover Readiness Checklist

## Metadata

- Status: `ready`
- Created At: `2026-06-07`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Added the Step 2 cutover readiness checklist with objective pass/fail gates for deleting legacy backend folders. Made with OpenCode.

## Objective Gates

### Scope Lock

- [ ] Full rewrite policy remains in force and no coexistence fallback has been introduced.
- [ ] Legacy backend architecture docs are marked superseded when implementation closes.
- [ ] Every active backend surface in `migration-matrix.md` has an explicit disposition: migrate, replace, or archive.
- [ ] No unknown backend folder remains under `src/server/**`.

### Mapping Completeness

- [ ] Every active REST route method has a mapped replacement under `src/server/entrypoint/api/**`.
- [ ] Every active CLI command has a mapped replacement or an explicit archive decision.
- [ ] Every legacy application operation under `src/server/application/use-cases/**` has a mapped target path or an explicit hold decision.
- [ ] All direct server-side backend callers outside formal entrypoints are either removed or re-expressed through approved backend boundaries.

### Entrypoint Compliance

- [ ] `src/app/api/**/route.ts` files are framework wiring only.
- [ ] REST entrypoints own parsing, transport validation, and caller-facing error mapping.
- [ ] Server-side non-REST flows use approved Server Function entrypoints or approved shared boundaries instead of importing legacy adapters/use-cases directly.
- [ ] CLI entrypoints live under `src/server/entrypoint/cli/**` if they remain in active scope.

### Orchestration and Core Parity

- [ ] Each migrated operation has one entrypoint, one validator boundary, one orchestrator, and the needed Core module(s).
- [ ] Orchestrators own operation coordination and typed success payloads.
- [ ] Core modules stay free of direct DB/session/provider access.
- [ ] No route, CLI, or server-side caller performs business logic that belongs in Orchestration or Core.

### Service Boundary Compliance

- [ ] Database access occurs only through DB Service.
- [ ] Session and caller resolution occur only through Session Service and approved middleware usage.
- [ ] Better Auth is consumed as a service dependency, not as provider-owned route passthrough wiring.
- [ ] No runtime import remains from legacy `adapters/`, `ports/`, or `composition/` paths.

### Deferred and Deprecated Scope

- [ ] `src/server/import/**` has been moved to `_deprecated` or otherwise removed from active runtime scope.
- [ ] `src/server/adapters/rules-catalog/**` has been moved to `_deprecated` or otherwise removed from active runtime scope.
- [ ] Catalog/import CLI commands are removed from active package scripts or explicitly archived.
- [ ] Every deprecated path in `deprecation-ledger.md` has met its removal gate.

## No-Go Rules

- [ ] Do not delete any legacy backend folder while a migration-matrix row for that folder is unresolved.
- [ ] Do not cut over while `src/app/api/auth/[...all]/route.ts` still delegates to provider-owned catch-all routing.
- [ ] Do not cut over while any runtime code in `src/app/**`, `src/server/**`, or `src/auth.ts` still imports from a path marked deprecated without an approved exception.
- [ ] Do not cut over while any active route file still contains orchestration, persistence, or provider logic.
- [ ] Do not cut over while any active non-REST server-side flow still bypasses approved entrypoint/service boundaries.
