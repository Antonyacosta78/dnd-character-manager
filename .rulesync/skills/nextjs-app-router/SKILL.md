---
name: nextjs-app-router
description: >-
  Build or refactor features in the Next.js App Router codebase while keeping
  component boundaries, routing, and styling choices easy to maintain.
targets: ["*"]
codexcli:
  short-description: Next.js App Router implementation guide for this repo
---

# Next.js App Router Skill

Use this skill when editing route files, layouts, shared UI, or page-level data flow.

## Apply These Patterns

- default to server components and add `"use client"` only when hooks, browser APIs, or event handlers require it
- keep route-specific components close to their route unless reuse is clear
- prefer typed props and small component boundaries over deeply nested page files
- treat `src/app/layout.tsx` and `src/app/globals.css` as shared foundations; avoid page-specific leakage into them

## Validation

- if you changed TypeScript or React code, run `bun run lint`
- if you changed route structure or metadata, consider `bun run build`
