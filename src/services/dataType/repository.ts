import API from '../ApiService';
import { map, share, switchMap, of, from, tap, shareReplay } from 'rxjs';
import { dataTypeCache } from './cache';
import { appRequest } from '../AuthorizationService';

export function loadDataTypes(obs: any, initBuildIns: (data: any) => void) {
  if (dataTypeCache.loaded) {
    return obs;
  }

  if (!dataTypeCache.loading) {
    dataTypeCache.loading = from(appRequest({ url: 'build_in_types' })).pipe(
      tap(({ data }: any) => {
        initBuildIns(data);
        dataTypeCache.loaded = true;
        dataTypeCache.loading = null;
      }),
      shareReplay(1)
    );
  }

  return dataTypeCache.loading.pipe(
    switchMap(() => obs)
  );
}

export function buildTemplateOptionsHeader(viewport: string, includeId = false) {
  const options: Record<string, unknown> = { viewport };
  if (includeId) {
    options.include_id = true;
  }
  return {
    "X-Template-Options": JSON.stringify(options),
  };
}

export function buildFindSelectorHeaders(criteria: Record<string, unknown>) {
  return {
    "X-Template-Options": JSON.stringify({ viewport: "{_id}" }),
    "X-Query-Selector": JSON.stringify(criteria),
  };
}

export function buildDigestHeaders(
  viewport: string,
  sort: Record<string, unknown> = {},
  selector: Record<string, unknown> = {},
  polymorphic = true,
  includeId = false,
) {
  return {
    "X-Template-Options": JSON.stringify({
      viewport,
      polymorphic,
      include_id: includeId,
    }),
    "X-Query-Options": JSON.stringify({ sort }),
    "X-Query-Selector": JSON.stringify(selector),
  };
}

export function getDataTypeById(id: string, transform: (data: any) => any, initBuildIns: (data: any) => void) {
  if (!id) {
    console.warn('DEBUG: getDataTypeById called without id; returning null.', new Error().stack);
    return of(null);
  }
  let dataType$: any = dataTypeCache.getDataType(id);
  if (dataType$) {
    return of(dataType$);
  }
  dataType$ = dataTypeCache.getInProgress(id);
  if (!dataType$) {
    dataType$ = loadDataTypes(
      API.get('setup', 'data_type', id, {
        headers: buildTemplateOptionsHeader('{_id namespace name title _type schema id_type}')
      }),
      initBuildIns
    ).pipe(
      map((data) => {
        if (data) {
          const result = transform(data);
          dataTypeCache.setDataType(id, result);
          dataTypeCache.deleteInProgress(id);
          return result;
        }
        dataTypeCache.deleteInProgress(id);
        return data;
      }),
      share()
    );
    dataTypeCache.setInProgress(id, dataType$);
  }
  return dataType$;
}

export function findDataType(criteria: Record<string, unknown>, transform: (data: any) => any, initBuildIns: (data: any) => void) {
  const key = dataTypeCache.criteriaKey(criteria);
  const id = dataTypeCache.getCriteria(key);

  if (id) {
    return getDataTypeById(id, transform, initBuildIns);
  }

  const findKey = `find_${key}`;
  let find$ = dataTypeCache.getInProgress(findKey);

  if (!find$) {
    find$ = loadDataTypes(
      API.get('setup', 'data_type', {
        params: { limit: 1 },
        headers: buildFindSelectorHeaders(criteria)
      }),
      initBuildIns
    ).pipe(
      switchMap((response: any) => {
        dataTypeCache.deleteInProgress(findKey);
        let item = null;
        if (Array.isArray(response)) {
          item = response[0];
        } else if (response && Array.isArray(response.items)) {
          item = response.items[0];
        } else if (response && response.id) { // In case the API returns an object instead of array for limit=1
          item = response;
        }
        if (item) {
          const itemId = item.id || item._id;
          if (!itemId) {
            return of(null);
          }
          dataTypeCache.setCriteria(key, itemId);
          return getDataTypeById(itemId, transform, initBuildIns);
        }
        return of(null);
      }),
      share()
    );
    dataTypeCache.setInProgress(findKey, find$);
  }

  return find$;
}
