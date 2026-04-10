// Runtime types for species filter and related plant lookup logic.
// Keep these simple and reusable: widget-specific rendering state remains in widget.tsx.

export type SpeciesOption = {
  speciesUid: string
  speciesName: string
}
