# Architecture: Data Sources

## Purpose

Track where app data comes from and how trustworthy or usable it is.

## Current Plan

- Use `external/` as the source area for third-party data.
- Treat imported data as raw input, not as the app's final schema.
- Document which parts of the external dataset are used by which features.

## Notes

- Start with the subset needed for character creation and the sheet.
- Record assumptions when source data is ambiguous or inconsistent.

## Related Features

- Add links here once feature docs exist.
