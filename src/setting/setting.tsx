import { React, Immutable, type AllWidgetSettingProps, type UseDataSource, DataSourceTypes } from 'jimu-core'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'

const Setting = (props: AllWidgetSettingProps<any>) =>
{
  const onDataSourceChange = (useDataSources: UseDataSource[]) =>
  {
    props.onSettingChange({
      id: props.id,
      useDataSources
    })
  }

  const onMapWidgetSelected = (useMapWidgetIds: string[]) =>
  {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds
    })
  }

  return (
    <div className="p-3">
      <h4>GardenBeds Species Filter Settings</h4>
      <p>Select the Master datasource, the StockView datasource, and the target map widget.</p>

      <div className="mb-4">
        <div className="mb-2"><strong>Feature layer datasources</strong></div>
        <DataSourceSelector
          mustUseDataSource
          types={Immutable([DataSourceTypes.FeatureLayer])}
          useDataSources={props.useDataSources}
          onChange={onDataSourceChange}
          widgetId={props.id}
          isMultiple
        />
        <div className="mt-2">
          Select two datasources:
          <br />
          1. GardenBedsTEST_Master
          <br />
          2. GardenBedsTEST_StockView
        </div>
      </div>

      <div>
        <div className="mb-2"><strong>Map widget</strong></div>
        <MapWidgetSelector
          useMapWidgetIds={props.useMapWidgetIds}
          onSelect={onMapWidgetSelected}
        />
      </div>
    </div>
  )
}

export default Setting