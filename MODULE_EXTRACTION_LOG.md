# GardenBeds SpeciesFilter Module Extraction Log

## Modules extracted

- `src/runtime/lib/service-urls.ts`
  - Contains local service endpoint constants for species lookup and plants-in-beds lookup.
  - Uses the validated `FeatureServer/0` endpoint for the species table to ensure direct query support.
  - This module is a good candidate for a shared package if other widgets need the same GardenBeds service endpoints.

- `src/runtime/lib/field-helpers.ts`
  - Provides generic SQL helpers: `escapeSqlValue`, `isNonEmptyString`, and `buildSqlInClause`.
  - This module is intended to encapsulate ArcGIS SQL building behavior for runtime logic.
  - This is a strong shared-package candidate.

- `src/runtime/lib/session-keys.ts`
  - Stores the session storage key and read/write helpers for the selected species UID.
  - Separates storage contract from React state flow.

- `src/runtime/lib/plant-types.ts`
  - Exposes shared runtime types for species options.
  - Keeps rendering-specific state in `widget.tsx` while allowing type reuse later.

- `src/runtime/lib/plant-queries.ts`
  - Builds queries for species and plants-in-bed lookups.
  - Parses feature results into reusable arrays of species options and garden UIDs.
  - Also builds a garden UID IN clause for datasource filtering.
  - This is a strong shared-package candidate for reusable plant/species query logic.

## What remains widget-local

- Widget rendering layout, DOM structure, and styles.
- Experience Builder datasource wiring and state flow in `src/runtime/widget.tsx`.
- Debug UI and status message behavior.
- The `useDataSources` ordering expectation and datasource query update flow.

## Shared-package candidates identified

- `field-helpers.ts` for SQL escaping and SQL IN clause building.
- `plant-queries.ts` for shared species/garden bed query functions.
- `plant-types.ts` for shared runtime types.
- `service-urls.ts` if multiple GardenBeds widgets need the same endpoint constants.
- `session-keys.ts` if session storage keys are reused across widgets.

## Notes

- The widget retains its original behavior, with query and storage logic extracted to reusable runtime modules.
- The visible runtime version string in `src/runtime/widget.tsx` was bumped to `1.14.1` and exposed via `data-widget-version`.
