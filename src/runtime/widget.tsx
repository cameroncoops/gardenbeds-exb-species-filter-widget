import { React, type AllWidgetProps, DataSourceManager, type FeatureLayerDataSource } from 'jimu-core'
import Query from 'esri/rest/support/Query'
import { executeQueryJSON } from 'esri/rest/query'

const SPECIES_TABLE_URL = 'https://arcgis.curtin.edu.au/arcgis/rest/services/Parks_Gardens/PropGIS_SDE_GardenBedsTEST_Plant_Species_/MapServer/0'
const PLANTS_IN_BED_URL = 'https://arcgis.curtin.edu.au/arcgis/rest/services/Parks_Gardens/PropGIS_SDE_GardenBedsTEST_PlantsInBeds_/MapServer/0'

const SHOW_DEBUG = false

type SpeciesOption = {
  speciesUid: string
  speciesName: string
}

const escapeSqlValue = (value: string) =>
{
  return value.replace(/'/g, "''")
}

const Widget = (props: AllWidgetProps<any>) =>
{
  const [selectedSpeciesUid, setSelectedSpeciesUid] = React.useState('')
  const [speciesOptions, setSpeciesOptions] = React.useState<SpeciesOption[]>([])
  const [matchingGardenUids, setMatchingGardenUids] = React.useState<string[]>([])
  const [matchingMasterCount, setMatchingMasterCount] = React.useState<number | null>(null)
  const [matchingStockCount, setMatchingStockCount] = React.useState<number | null>(null)
  const [matchingMasterGardenUids, setMatchingMasterGardenUids] = React.useState<string[]>([])
  const [statusMessage, setStatusMessage] = React.useState('Loading species...')

  React.useEffect(() =>
  {
    const loadSpecies = async () =>
    {
      try
      {
        const query = new Query({
          where: '1=1',
          outFields: ['species_uid', 'species_name'],
          returnGeometry: false
        })

        const result = await executeQueryJSON(SPECIES_TABLE_URL, query)

        const uniqueSpeciesMap = new Map<string, SpeciesOption>()

        ;(result.features || []).forEach((feature: __esri.Graphic) =>
        {
          const speciesUid = feature.attributes?.species_uid
          const speciesName = feature.attributes?.species_name

          if (
            typeof speciesUid === 'string' &&
            speciesUid.trim() !== '' &&
            typeof speciesName === 'string' &&
            speciesName.trim() !== '' &&
            !uniqueSpeciesMap.has(speciesUid)
          )
          {
            uniqueSpeciesMap.set(speciesUid, {
              speciesUid,
              speciesName
            })
          }
        })

        const loadedSpecies = Array.from(uniqueSpeciesMap.values()).sort((a, b) =>
        {
          return a.speciesName.localeCompare(b.speciesName)
        })

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
        const query = new Query({
          where: `species_uid = '${escapeSqlValue(selectedSpeciesUid)}'`,
          outFields: ['garden_uid'],
          returnGeometry: false
        })

        const result = await executeQueryJSON(PLANTS_IN_BED_URL, query)

        const uniqueGardenUids = new Set<string>()

        ;(result.features || []).forEach((feature: __esri.Graphic) =>
        {
          const gardenUid = feature.attributes?.garden_uid

          if (typeof gardenUid === 'string' && gardenUid.trim() !== '')
          {
            uniqueGardenUids.add(gardenUid)
          }
        })

        const sortedGardenUids = Array.from(uniqueGardenUids).sort((a, b) =>
        {
          return a.localeCompare(b)
        })

        setMatchingGardenUids(sortedGardenUids)
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
        const whereClause = `garden_uid IN (${matchingGardenUids.map((gardenUid) => `'${escapeSqlValue(gardenUid)}'`).join(', ')})`

        const queryResult = await masterDataSource.query({
          where: whereClause,
          outFields: ['garden_uid']
        })

        const records = queryResult.records || []
        const queriedMasterGardenUids = records
          .map((record) => record.getFieldValue('garden_uid'))
          .filter((value) => typeof value === 'string' && value.trim() !== '') as string[]

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
    <div className="widget-template-map-aware p-3 bg-white">
      
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
          {speciesOptions.map((species) =>
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
                  {matchingGardenUids.map((gardenUid) =>
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
                  {matchingMasterGardenUids.map((gardenUid) =>
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