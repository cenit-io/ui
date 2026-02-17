export interface DataTypeStore {
  loaded: boolean;
  loading: unknown;
  dataTypes: Record<string, unknown>;
  criteria: Record<string, string>;
  gets: Record<string, unknown>;
}

export function createDataTypeStore(): DataTypeStore {
  return {
    loaded: false,
    loading: null,
    dataTypes: {},
    criteria: {},
    gets: {},
  };
}

export function buildCriteriaKey(criteria: Record<string, unknown>): string {
  return Object.keys(criteria)
    .sort()
    .map((key) => `${key}(${JSON.stringify(criteria[key])})`)
    .join();
}
