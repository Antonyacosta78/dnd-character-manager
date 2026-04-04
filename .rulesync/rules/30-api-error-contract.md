---
root: false
targets: ["*"]
description: "API and CLI error contract for backend foundation surfaces"
globs: ["src/app/api/**/*", "src/server/**/*", "src/**/cli/**/*", "scripts/**/*"]
opencode:
  description: "API and CLI error contract for backend foundation surfaces"
---

# API and Error Contract

- For backend API routes, server-layer code, and operational CLI commands, follow `docs/architecture/api-error-contract.md` as the normative contract.
- Keep success and error envelope shapes, header behavior, and request metadata behavior aligned with the contract.
- Use only documented error codes and preserve the contract's HTTP status and CLI exit-code mappings.
- Do not introduce new envelope shapes or ad-hoc error code strings in covered surfaces unless the contract is updated first.
- If implementation reality conflicts with the contract, pause and propose a contract update or scoped exception before shipping.
