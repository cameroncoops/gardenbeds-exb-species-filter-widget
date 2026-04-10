// SQL and field helpers for runtime widget logic.
// These helpers are intentionally generic so they can be moved into a shared
// package later if multiple widgets need the same ArcGIS/SQL behaviors.

export const escapeSqlValue = (value: string): string =>
{
  return value.replace(/'/g, "''")
}

export const isNonEmptyString = (value: unknown): value is string =>
{
  return typeof value === 'string' && value.trim() !== ''
}

export const firstValue = <T>(value: T | T[] | null | undefined): T | undefined =>
{
  if (Array.isArray(value))
  {
    return value[0]
  }

  return value ?? undefined
}

export const getFieldAttribute = <T>(attributes: Record<string, unknown> | null | undefined, fieldName: string): T | undefined =>
{
  return firstValue(attributes?.[fieldName] as T | T[] | undefined)
}

export const buildSqlInClause = (fieldName: string, values: string[]): string =>
{
  const cleanedValues = values
    .filter(isNonEmptyString)
    .map((value) => `'${escapeSqlValue(value)}'`)

  if (cleanedValues.length === 0)
  {
    return '1=2'
  }

  return `${fieldName} IN (${cleanedValues.join(', ')})`
}
