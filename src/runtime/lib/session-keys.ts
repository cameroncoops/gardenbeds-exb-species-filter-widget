// Session storage helpers and shared keys for runtime widget state.
// This module keeps the storage contract separate from the component state flow.

export const SELECTED_SPECIES_UID_KEY = 'gardenbeds:selectedSpeciesUid'

export const getSelectedSpeciesUid = (): string =>
{
  return sessionStorage.getItem(SELECTED_SPECIES_UID_KEY) || ''
}

export const setSelectedSpeciesUid = (speciesUid: string): void =>
{
  if (speciesUid)
  {
    sessionStorage.setItem(SELECTED_SPECIES_UID_KEY, speciesUid)
  }
  else
  {
    sessionStorage.removeItem(SELECTED_SPECIES_UID_KEY)
  }
}
