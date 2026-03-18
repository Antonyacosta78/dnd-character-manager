# Architecture: Parsing Pipeline

## Purpose

Define the shared path from raw external files to app-ready data.

## Current Plan

- Read raw source files from `external/`.
- Parse them into typed intermediate structures.
- Normalize them into internal app types.
- Validate the result before use in the app.

## Notes

- Keep parsing and normalization as separate steps.
- Make the pipeline repeatable so source updates are easier later.

## Related Features

- Add links here once feature docs exist.
