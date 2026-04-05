# Docs

This folder keeps the project notes that are worth preserving.

## Structure

- `STATUS.md` tracks implementation progress against the roadmap with evidence links.
- `features/` describes what each user-facing feature should do.
- `specs/` contains technical notes tied to a single feature.
- `architecture/` contains shared technical notes used by multiple features.
- `templates/` contains lightweight starting points for new docs.

## Conventions

- Each feature file should link to its related spec files.
- Each spec file should link back to one feature file.
- Shared concerns belong in `architecture/`, not inside a feature spec.
- Keep docs short. Split files only when a topic gets too large.

## Naming

- Use lowercase kebab-case for file and folder names.
- Put one feature per file in `features/`, for example `character-creation.md`.
- Put feature-specific specs in a matching folder under `specs/`, for example `specs/character-creation/data-model.md`.
- Put the coding-level plan for a feature in `specs/<feature>/implementation-plan.md`.
- Use short topic names for spec files, such as `flow.md`, `validation.md`, or `normalization.md`.
- Use broad cross-cutting names in `architecture/`, such as `app-architecture.md` or `data-sources.md`.
- Name the feature rundown template `feature-rundown-template.md` to distinguish it from technical templates.
