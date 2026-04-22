# Architecture: Source Parser Interpreter

## Metadata

- Status: `proposed` 
- Created At: `2026-04-06`
- Last Updated: `2026-04-06`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-06` - `Antony Acosta (Created Manually)` - Created document and made first version


## Problem Statement

The current source material parser was made by AI agents without understanding the true purpose of the data source's JSON objects and without good oversight by a human eye. 

This resulted in a having a good pipeline structure for the parser and having the actual parsing steps being designed and implemented in a lackluster manner, rendering the shape in which the data exists be very unusable and keeping a lot of data that is useless for the scope of this project.

## Purpose

This document aims to reinterpret how the parsing is done, aiming to provide a manual resolution to parsing as well as a manual implementation of the transforming steps in the parsing pipeline, keeping only the data that is relevant and transforming into a system-ready format for using with `RulesCatalog`.

## Current Plan

### Scope of this spec

This spec will focus exclusively on handling the answers to three main questions for each of the source files:

1). Is this file worth keeping for this application?
2). What do the fields in this file mean?
3). How do we store those fields in our own canonical structure?

### Canonical Input Contract

Path convention:

- All paths in this spec are relative to `EXTERNAL_DATA_PATH` from local `.env`.
- `EXTERNAL_DATA_PATH` is the only source root contract; no hardcoded absolute path is allowed.

Following the same files deemed as necessary defined in the previous documents of this feature, we include:

- `<EXTERNAL_DATA_PATH>/class/index.json`
- `<EXTERNAL_DATA_PATH>/class/class-*.json`
- `<EXTERNAL_DATA_PATH>/spells/index.json`
- `<EXTERNAL_DATA_PATH>/spells/spells-*.json`
- `<EXTERNAL_DATA_PATH>/spells/sources.json`
- `<EXTERNAL_DATA_PATH>/races.json`
- `<EXTERNAL_DATA_PATH>/backgrounds.json`
- `<EXTERNAL_DATA_PATH>/feats.json`
- `<EXTERNAL_DATA_PATH>/optionalfeatures.json`
- `<EXTERNAL_DATA_PATH>/deities.json`

Also, as extra files that are critical to the completeness of the features in the roadmap, we need to include:
- `<EXTERNAL_DATA_PATH>/skills.json`
- `<EXTERNAL_DATA_PATH>/objects.json`
- `<EXTERNAL_DATA_PATH>/senses.json`
- `<EXTERNAL_DATA_PATH>/magicvariant.json`
- `<EXTERNAL_DATA_PATH>/items.json`
- `<EXTERNAL_DATA_PATH>/items-base.json`
- `<EXTERNAL_DATA_PATH>/languages.json`
- `<EXTERNAL_DATA_PATH>/charcreationoptions.json`
- `<EXTERNAL_DATA_PATH>/books.json`
- `<EXTERNAL_DATA_PATH>/life.json`
- `<EXTERNAL_DATA_PATH>/variantrules.json`

Also we should include any `<EXTERNAL_DATA_PATH>/fluff-*.json` of files that match the files previously listed.

Generated files are not canonical source-of-truth, and different from the previous iterations of this feature, they are **explicitly out of scope** given that they have no utility in the parsing steps

- `<EXTERNAL_DATA_PATH>/generated/**`

### Deep Copy and Modification Resolutions

The source parser should resolve `_copy` operations and its correspondent `_mod` operations that come with that copy, it should follow the rule of being **recursive** and **non-self referential**. 

Only the operations present in the files of the `Canonical Input Contract` are to be supported.

## Boundaries

This architecture note is responsible for the filtering, conversion and shaping of the parser, taking it from the base shape up to the usable shape to be stored in the database.

This architecture note is **not** responsible for defining the pipeline in which the conversion happens, it will reuse the existing infrastructure.

## Notes

- This document and its consequent implementation will probably be constrained the capabilities of a human doing manual implementation
  - This is, however, a tradeoff being done in pro of accurracy of parsing and filtering

## Related Specs

- `docs/specs/foundation/implementation-plan.md`
- `docs/specs/parsing/option-complete-data-source-parsing.md`
- `docs/architecture/rules-catalog-provider.md`
- `docs/architecture/parsing-pipeline.md`
- `docs/architecture/parser-option-completeness.md`

## Related Features

- Link the features affected by this architecture note.
- Leave a short placeholder if the feature docs do not exist yet.

## Open Questions

- Which other folders inside `<EXTERNAL_DATA_PATH>/` are in scope?
