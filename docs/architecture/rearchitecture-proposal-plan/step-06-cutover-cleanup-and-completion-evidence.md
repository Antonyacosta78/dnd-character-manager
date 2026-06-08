# Step 6: Cutover, Cleanup, and Completion Evidence

## Metadata

- Status: `completed`
- Created At: `2026-05-21`
- Last Updated: `2026-06-08`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-08` - `Antony Acosta` - Marked step 6 as completed for the current cutover baseline after removing obsolete active legacy runtime paths, rewriting canonical backend docs, and recording Step 6-only verification evidence. Explicitly left final completion status transition and broader rollback/reset scope for Step 7. Made with OpenCode.
- `2026-06-07` - `Antony Acosta` - Marked step 6 as ready after review so final cutover criteria are locked before implementation begins. Made with OpenCode.
- `2026-05-21` - `Antony Acosta` - Added final step plan for legacy removal, canonical-doc updates, and completion gates for backend rearchitecture. Made with OpenCode.

## Goal

- Complete hard cutover to the new backend architecture and leave auditable proof that legacy boundaries are removed.

## Preconditions

- Step 5 migration complete for all in-scope operations.
- Cutover-readiness checklist from step 2 is fully green.

## Work Items

1. Remove legacy architecture paths
   - Remove or archive old backend boundaries no longer allowed:
     - `src/server/application/**`
     - `src/server/ports/**`
     - `src/server/adapters/**`
     - `src/server/composition/**` (except startup-only concerns explicitly retained)
   - Move deprecated catalog/import modules to agreed `_deprecated` location.

2. Finalize transport and contract alignment
   - Update `docs/architecture/api-error-contract.md` to the new taxonomy/mapping model.
   - Validate REST, server-function, and CLI surfaces use new mapping rules.

3. Rewrite canonical architecture docs
   - Rewrite backend sections in:
     - `docs/architecture/back-end-architecture.md`
     - `docs/architecture/app-architecture.md`
   - Mark `docs/architecture/rearchitecture-proposal.md` status as implemented artifact after cutover closes.

4. Run full verification suite
   - Lint, build, and full relevant tests.
   - Add manual validation notes for key user/ops flows that changed transport wiring.

5. Publish completion evidence
   - Record final evidence paths and pass/fail outcomes.
   - Update roadmap/status docs only if implementation phase state actually moved.

## Deliverables

- Legacy architecture paths removed or archived
- Updated canonical architecture and error-contract documents
- Completed verification report with command outputs and targeted scenario checks
- Proposal status transition from draft to implemented artifact (if all gates pass)

## Verification Gate

- `bun run lint`
- `bun run build`
- Full backend tests (or clearly scoped equivalent with documented rationale)
- Manual sanity checks for:
  - REST auth and validation failures
  - server-function error sanitization
  - CLI exit code mapping

## Exit Criteria

- No active runtime path depends on deprecated architecture layers.
- Architecture docs and implementation agree on boundaries and ownership rules.
- Proposal can be marked implemented with evidence-backed confidence.

## Risks and Mitigations

- Risk: deleting legacy modules too early hides unresolved dependencies.
  - Mitigation: enforce migration matrix completion and static import search before deletion.
- Risk: documentation claims exceed implementation reality.
  - Mitigation: only mark implemented after code evidence and checks are complete.

## Roadmap / Status Impact

- impacted phase(s) and expected status movement
- Suggested update point: only when step 6 verification passes and evidence paths are linked in `docs/STATUS.md`.
