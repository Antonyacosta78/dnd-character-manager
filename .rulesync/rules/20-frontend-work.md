---
root: false
targets: ["*"]
description: "Frontend implementation guidance for Next.js App Router UI work"
globs: ["src/app/**/*", "src/components/**/*", "public/**/*"]
cursor:
  alwaysApply: true
  description: "Frontend implementation guidance for Next.js App Router UI work"
  globs: ["src/app/**/*", "src/components/**/*", "public/**/*"]
---

# Frontend Work

- Use server components by default and add client components only when interactivity requires them.
- Keep route structure in `src/app/` clear and colocate route-specific UI nearby.
- Prefer design choices that feel intentional instead of shipping generic starter layouts.
- Use CSS variables or Tailwind tokens when introducing new visual themes.
- Check mobile and desktop behavior for page-level UI changes.
