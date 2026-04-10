import { React, type AllWidgetProps, DataSourceManager, type FeatureLayerDataSource } from 'jimu-core'
import { executeQueryJSON } from 'esri/rest/query'
import { SPECIES_TABLE_URL, PLANTS_IN_BED_URL } from './lib/service-urls'
import { getSelectedSpeciesUid, setSelectedSpeciesUid as persistSelectedSpeciesUid } from './lib/session-keys'
import {
  buildSpeciesQuery,
  buildPlantsInBedQuery,
  buildGardenUidWhereClause,
  parseSpeciesOptions,
  parseGardenUids
} from './lib/plant-queries'
import type { SpeciesOption } from './lib/plant-types'

const WIDGET_VERSION = '1.14.2'
const SHOW_DEBUG = false

const Widget = (props: AllWidgetProps<any>) =>
{
  const [selectedSpeciesUid, setSelectedSpeciesUidState] = React.useState('')
  const [speciesOptions, setSpeciesOptions] = React.useState<SpeciesOption[]>([])
  const [matchingGardenUids, setMatchingGardenUids] = React.useState<string[]>([])
  const [matchingMasterCount, setMatchingMasterCount] = React.useState<number | null>(null)
  const [matchingStockCount, setMatchingStockCount] = React.useState<number | null>(null)
  const [matchingMasterGardenUids, setMatchingMasterGardenUids] = React.useState<string[]>([])
  const [statusMessage, setStatusMessage] = React.useState('Loading species...')

  const setSelectedSpeciesUid = (speciesUid: string) =>
  {
    setSelectedSpeciesUidState(speciesUid)
    persistSelectedSpeciesUid(speciesUid)
  }

  React.useEffect(() =>
  {
    const savedSpeciesUid = getSelectedSpeciesUid()
    if (savedSpeciesUid)
    {
      setSelectedSpeciesUidState(savedSpeciesUid)
    }
  }, [])

  React.useEffect(() =>
  {
    const loadSpecies = async () =>
    {
      try
      {
        const result = await executeQueryJSON(SPECIES_TABLE_URL, buildSpeciesQuery())
        const loadedSpecies = parseSpeciesOptions(result.features || [])
        setSpeciesOptions(loadedSpecies)
        setStatusMessage(`${loadedSpecies.length} species loaded.`)
      }
      catch (error)
      {
        console.error(error)
        setStatusMessage('Failed to load species.')
      }
    }

    loadSpecies()
  }, [])

  React.useEffect(() =>
  {
    const loadMatchingGardenUids = async () =>
    {
      if (!selectedSpeciesUid)
      {
        setMatchingGardenUids([])
        setMatchingMasterCount(null)
        return
      }

      setStatusMessage('Loading matching beds...')

      try
      {
        const result = await executeQueryJSON(PLANTS_IN_BED_URL, buildPlantsInBedQuery(selectedSpeciesUid))
        setMatchingGardenUids(parseGardenUids(result.features || []))
        setStatusMessage(`${speciesOptions.length} species loaded.`)
      }
      catch (error)
      {
        console.error(error)
        setMatchingGardenUids([])
        setMatchingMasterCount(null)
        setStatusMessage('Failed to load matching beds.')
      }
    }

    loadMatchingGardenUids()
  }, [selectedSpeciesUid, speciesOptions.length])

  React.useEffect(() =>
  {
    const syncMasterSelection = async () =>
    {
      if (!props.useDataSources || props.useDataSources.length < 2)
      {
        setMatchingMasterCount(null)
        setMatchingStockCount(null)
        return
      }

      const masterDataSourceId = props.useDataSources[0].dataSourceId
      const stockDataSourceId = props.useDataSources[1].dataSourceId

      const masterDataSource = DataSourceManager.getInstance().getDataSource(masterDataSourceId) as FeatureLayerDataSource
      const stockDataSource = DataSourceManager.getInstance().getDataSource(stockDataSourceId) as FeatureLayerDataSource

      if (!masterDataSource || !stockDataSource)
      {
        setMatchingMasterCount(null)
        setMatchingStockCount(null)
        return
      }

      if (!selectedSpeciesUid)
      {
        setMatchingMasterCount(null)
        setMatchingMasterGardenUids([])
        masterDataSource.updateQueryParams({ where: '1=1' }, props.id)
        stockDataSource.updateQueryParams({ where: '1=1' }, props.id)
        return
      }

      if (matchingGardenUids.length === 0)
      {
        setMatchingMasterCount(0)
        setMatchingMasterGardenUids([])
        masterDataSource.updateQueryParams({ where: '1=2' }, props.id)
        stockDataSource.updateQueryParams({ where: '1=2' }, props.id)
        return
      }

      try
      {
        const whereClause = buildGardenUidWhereClause(matchingGardenUids)

        const queryResult = await masterDataSource.query({
          where: whereClause,
          outFields: ['garden_uid']
        })

        const records = queryResult.records || []
        const queriedMasterGardenUids = (records as any[])
          .map((record: any): unknown => record.getFieldValue('garden_uid'))
          .filter((value): value is string => typeof value === 'string' && value.trim() !== '')

        setMatchingMasterGardenUids(queriedMasterGardenUids)
        masterDataSource.updateQueryParams({ where: whereClause }, props.id)
        stockDataSource.updateQueryParams({ where: whereClause }, props.id)
        setMatchingMasterCount(records.length)
      }
      catch (error)
      {
        console.error(error)
        setMatchingMasterCount(null)
      }
    }

    syncMasterSelection()
  }, [matchingGardenUids, props.useDataSources])

  return (
    <div className="widget-template-map-aware p-3 bg-white" data-widget-version={WIDGET_VERSION}>
      
      <div className="mb-3">
        <label htmlFor="species-select"><strong>Species</strong></label>
        <select
          id="species-select"
          className="w-100"
          value={selectedSpeciesUid}
          onChange={(event) =>
          {
            setSelectedSpeciesUid(event.target.value)
          }}
        >
          <option value="">Select a species</option>
          {speciesOptions.map((species: SpeciesOption) =>
          {
            return (
              <option key={species.speciesUid} value={species.speciesUid}>
                {species.speciesName}
              </option>
            )
          })}
        </select>
      </div>
      <div className="mb-3">
        <button
          disabled={!selectedSpeciesUid}
          onClick={() =>
          {
            setSelectedSpeciesUid('')
          }}
        >
          Clear filter
        </button>
      </div>

     {SHOW_DEBUG && (
        <>
          <div className="mb-2">
            Selected species: {selectedSpeciesUid || 'None'}
          </div>

          <div className="mb-2">
            Species count: {speciesOptions.length}
          </div>

          <div className="mb-2">
            Matching bed count from PlantsInBed: {matchingGardenUids.length}
          </div>

          <div className="mb-2">
            Matching master feature count: {matchingMasterCount === null ? 'No datasource or query failed' : matchingMasterCount}
          </div>

          <div className="mb-3">
            <strong>Matching garden_uids</strong>
            <div>
              {matchingGardenUids.length === 0 && 'None'}
              {matchingGardenUids.length > 0 && (
                <ul className="mb-0">
                  {matchingGardenUids.map((gardenUid: string) =>
                  {
                    return (
                      <li key={gardenUid}>{gardenUid}</li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="mb-3">
            <strong>Master query garden_uids</strong>
            <div>
              {matchingMasterGardenUids.length === 0 && 'None'}
              {matchingMasterGardenUids.length > 0 && (
                <ul className="mb-0">
                  {matchingMasterGardenUids.map((gardenUid: string) =>
                  {
                    return (
                      <li key={gardenUid}>{gardenUid}</li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div>
            {statusMessage}
          </div>
        </>
      )} 
    </div>
  )
}

export default Widget