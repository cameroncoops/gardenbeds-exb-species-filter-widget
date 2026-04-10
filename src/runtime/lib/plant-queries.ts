import Query from 'esri/rest/support/Query'
import { escapeSqlValue, buildSqlInClause, isNonEmptyString, getFieldAttribute } from './field-helpers'
import type { SpeciesOption } from './plant-types'

// Shared query builders and result parsers for species and garden bed lookups.
// This is runtime logic that belongs outside the React rendering flow.

export const buildSpeciesQuery = (): Query =>
{
  return new Query({
    outFields: ['species_uid', 'species_name'],
    returnGeometry: false
  })
}

export const buildPlantsInBedQuery = (speciesUid: string): Query =>
{
  return new Query({
    where: `species_uid = '${escapeSqlValue(speciesUid)}'`,
    outFields: ['garden_uid'],
    returnGeometry: false
  })
}

export const buildGardenUidWhereClause = (gardenUids: string[]): string =>
{
  return buildSqlInClause('garden_uid', gardenUids)
}

export const parseSpeciesOptions = (features: __esri.Graphic[]): SpeciesOption[] =>
{
  const uniqueSpeciesMap = new Map<string, SpeciesOption>()

  ;(features || []).forEach((feature) =>
  {
    const speciesUid = getFieldAttribute<string>(feature.attributes, 'species_uid')
    const speciesName = getFieldAttribute<string>(feature.attributes, 'species_name')

    if (
      isNonEmptyString(speciesUid) &&
      isNonEmptyString(speciesName) &&
      !uniqueSpeciesMap.has(speciesUid)
    )
    {
      uniqueSpeciesMap.set(speciesUid, {
        speciesUid,
        speciesName
      })
    }
  })

  return Array.from(uniqueSpeciesMap.values()).sort((a, b) => a.speciesName.localeCompare(b.speciesName))
}

export const parseGardenUids = (features: __esri.Graphic[]): string[] =>
{
  const uniqueGardenUids = new Set<string>()

  ;(features || []).forEach((feature) =>
  {
    const gardenUid = getFieldAttribute<string>(feature.attributes, 'garden_uid')

    if (isNonEmptyString(gardenUid))
    {
      uniqueGardenUids.add(gardenUid)
    }
  })

  return Array.from(uniqueGardenUids).sort((a, b) => a.localeCompare(b))
}
