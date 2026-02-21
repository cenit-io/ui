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

export class DataTypeCache {
  public store: DataTypeStore = createDataTypeStore();

  get loaded() { return this.store.loaded; }
  set loaded(v: boolean) { this.store.loaded = v; }

  get loading() { return this.store.loading; }
  set loading(v: any) { this.store.loading = v; }

  getDataType(id: string) { return this.store.dataTypes[id]; }
  setDataType(id: string, dataType: any) { this.store.dataTypes[id] = dataType; }

  getCriteria(key: string) { return this.store.criteria[key]; }
  setCriteria(key: string, id: string) { this.store.criteria[key] = id; }

  getInProgress(key: string) { return this.store.gets[key]; }
  setInProgress(key: string, obs: any) { this.store.gets[key] = obs; }
  deleteInProgress(key: string) { delete this.store.gets[key]; }

  criteriaKey(criteria: Record<string, unknown>): string {
    return buildCriteriaKey(criteria);
  }
}

export const dataTypeCache = new DataTypeCache();
