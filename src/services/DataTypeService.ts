import API from './ApiService';
import { Observable, firstValueFrom, from, isObservable, of, throwError } from "rxjs";
import { catchError, map, share, switchMap, tap } from "rxjs/operators";
import zzip from "../util/zzip";
import FormContext from "./FormContext";
import LiquidEngine from "./LiquidEngine";
import { appRequest } from "./AuthorizationService";
import { Async } from "../common/Symbols";
import { deepMergeArrayConcat, deepMergeObjectsOnly } from "../common/merge";
import deepDup from "../common/deepDup";
import Hash from 'object-hash';
import { Config as ConfigSymbol } from "../common/Symbols";
import { titleize } from "../common/strutls";
import FileDataTypeConfig from "../config/FileDataTypeConfig";
import { dataTypeCache } from "./dataType/cache";
import { getDataTypeById, findDataType, loadDataTypes, buildFindSelectorHeaders, buildTemplateOptionsHeader } from "./dataType/repository";
import { splitName, CENIT_TYPE, FILE_TYPE, JSON_TYPE } from "./dataType/utils";
import { buildCriteriaKey } from "./dataType/cache";
import { buildDigestHeaders } from "./dataType/repository";
import { deriveDataTypeTitle, deriveItemTitle } from "./dataType/titleService";
import { stripDecoratorProps } from "./dataType/schemaResolver";
import session from "../util/session";

import { isSimpleSchema, injectCommonProperties } from "./dataType/schemaResolver";
export { isSimpleSchema, injectCommonProperties, CENIT_TYPE, FILE_TYPE, JSON_TYPE };

const DATA_TYPE_SERVICE_FINGERPRINT = 'ui/src/services/DataTypeService.ts@local-v2';
const DATA_TYPE_SERVICE_MARKER_KEY = '__CENIT_UI_DATA_TYPE_SERVICE__';

const normalizeConfigPath = (path: string): string => (
  path
    .replace(/\\/g, '/')
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .join('/')
);

const DATA_TYPE_CONFIG_MODULE_LOADERS: Record<string, () => Promise<any>> = import.meta.glob(
  '../config/dataTypes/**/*.{js,jsx,ts,tsx}'
);

const resolveDataTypeConfigModuleLoader = (path: string): (() => Promise<any>) | null => {
  const normalizedPath = normalizeConfigPath(path);
  if (!normalizedPath) {
    return null;
  }

  const candidates = [
    `../config/dataTypes/${normalizedPath}.jsx`,
    `../config/dataTypes/${normalizedPath}.js`,
    `../config/dataTypes/${normalizedPath}.tsx`,
    `../config/dataTypes/${normalizedPath}.ts`,
    `../config/dataTypes/${normalizedPath}/index.jsx`,
    `../config/dataTypes/${normalizedPath}/index.js`,
    `../config/dataTypes/${normalizedPath}/index.tsx`,
    `../config/dataTypes/${normalizedPath}/index.ts`
  ];

  for (const candidate of candidates) {
    const loader = DATA_TYPE_CONFIG_MODULE_LOADERS[candidate];
    if (loader) {
      return loader;
    }
  }
  return null;
};

const markDataTypeServiceRuntime = (): void => {
  const globalRef = globalThis as any;
  if (!globalRef[DATA_TYPE_SERVICE_MARKER_KEY]) {
    globalRef[DATA_TYPE_SERVICE_MARKER_KEY] = {
      fingerprint: DATA_TYPE_SERVICE_FINGERPRINT,
      loadedAt: new Date().toISOString(),
      configCalls: 0,
      lastConfigFor: null as string | null
    };
  }
  console.log(
    `DEBUG: DataTypeService runtime marker set ${DATA_TYPE_SERVICE_MARKER_KEY}=${globalRef[DATA_TYPE_SERVICE_MARKER_KEY].fingerprint}`
  );
};

markDataTypeServiceRuntime();

export interface MergeOptions {
  root_schema?: any;
  silent?: boolean;
  expand_extends?: boolean;
  only_overriders?: boolean;
  extends?: any;
  keep_ref?: boolean;
  recursive?: boolean;
  until_merge?: boolean;
}

export interface GetOptions {
  viewport?: string;
  jsonPath?: string;
  with_references?: boolean;
  include_id?: boolean;
  include_blanks?: boolean;
}

export interface FindOptions extends GetOptions {
  limit?: number;
  page?: number;
  sort?: any;
  selector?: any;
  query?: string;
  include_id?: boolean;
}

export interface UploadOptions {
  id?: string;
  filename?: string;
  onUploadProgress?: (progressEvent: any) => void;
  cancelToken?: any;
  add_new?: boolean;
}

export class DataType {
  id!: string;
  name!: string;
  namespace!: string;
  _type?: string;
  schema?: any;
  title?: string;

  private gettingSchema?: any;
  private propertiesSchemaCache?: any;
  private propertiesHash?: Record<string, Property>;
  private nss?: Record<string, Record<string, any>>;
  private __titleProps?: string[];

  static get loaded(): boolean { return dataTypeCache.loaded; }
  static set loaded(v: boolean) { dataTypeCache.loaded = v; }

  static get loading() { return dataTypeCache.loading; }
  static set loading(v) { dataTypeCache.loading = v; }

  static get dataTypes() { return dataTypeCache.store.dataTypes; }
  static get criteria() { return dataTypeCache.store.criteria; }
  static get gets() { return dataTypeCache.store.gets; }

  static load(obs: Observable<any>): Observable<any> {
    return loadDataTypes(obs, (data) => DataType.initBuildIns(data));
  }

  static initBuildIns(buildIns: any[]): void {
    buildIns.forEach(dataType => {
      const { id, namespace, name } = dataType;
      DataType.dataTypes[id] = DataType.from(dataType);
      DataType.criteria[DataType.criteriaKey({ namespace, name })] = id;
    });
  }

  static from(spec: any): DataType {
    const data = { ...spec };
    // API responses can provide Mongo-style `_id` instead of `id`.
    // Normalize here so all downstream code can rely on `dataType.id`.
    if (!data.id && data._id) {
      data.id = data._id;
    }
    if (data._id) {
      delete data._id;
    }
    if (data._type === JSON_TYPE) {
      delete data.schema;
    } else {
      injectCommonProperties(data.schema);
    }

    const _type = data._type;
    delete data._type;

    let dt;
    if (_type === FILE_TYPE) {
      dt = new FileDataType();
    } else {
      dt = new DataType();
    }

    Object.keys(data).forEach(key => {
      if (typeof dt[key] !== 'function') {
        dt[key] = data[key];
      }
    });

    dt._type = _type;
    return dt;
  }

  static getById(id: string): Observable<DataType> {
    return getDataTypeById(id, (data) => DataType.from(data), (data) => DataType.initBuildIns(data));
  }

  static splitName(name) {
    return splitName(name);
  }

  static byTypeName(name) {
    let [namespace, simpleName] = this.splitName(name);
    return this.find({ namespace, name: simpleName }).pipe(
      switchMap(dataType => {
        if (!dataType && simpleName.startsWith('Dt')) {
          return DataType.getById(simpleName.substring(2))
        }

        return of(dataType);
      })
    );
  }

  static criteriaKey(criteria) {
    return buildCriteriaKey(criteria);
  }

  static find(criteria: any): Observable<DataType> {
    return findDataType(criteria, (data) => DataType.from(data), (data) => DataType.initBuildIns(data));
  }

  asRef() {
    const { id, name, namespace, _type } = this;
    return {
      _reference: true,
      id, namespace, name, _type
    };
  }

  configPath(): string | null {
    const branch = this.namespace && this.name
      ? 'namespace+name'
      : this.name
        ? 'name-only'
        : 'missing-name';

    console.log(
      `DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] configPath branch=${branch} namespace=${this.namespace || ''} name=${this.name || ''}`
    );

    if (this.namespace && this.name) {
      const path = normalizeConfigPath(`${this.namespace.split('::').join('/')}/${this.name}`);
      console.log(`DEBUG: DataType configPath normalized=${path}`);
      return path || null;
    }
    if (this.name) {
      const path = normalizeConfigPath(this.name);
      console.log(`DEBUG: DataType configPath normalized=${path}`);
      return path || null;
    }
    console.log(`DEBUG: DataType configPath: null (namespace=${this.namespace}, name=${this.name})`);
    return null;
  }

  type_name(): string | undefined {
    if (this._type === CENIT_TYPE) {
      if (this.namespace) {
        return `${this.namespace}::${this.name}`;
      }
      return this.name;
    }
    return this.id && `Dt${this.id}`;
  }

  getSchema(): Observable<any> {
    if (this.schema) {
      return of(this.schema);
    }

    if (!this.gettingSchema) {
      if (!this.id) {
        console.warn(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] getSchema called for datatype without id; returning empty schema.`);
        return of({});
      }
      this.gettingSchema = API.get('setup', 'data_type', this.id, 'digest', 'schema').pipe(
        tap(schema => {
          injectCommonProperties(schema);
          this.schema = schema;
          delete this.gettingSchema;
        }),
        share()
      );
    }

    return this.gettingSchema;
  }

  withOrigin(): Observable<boolean> {
    return this.getSchemaEntry('with_origin').pipe(
      map(v => Boolean(v))
    );
  }

  propertiesSchema(): Observable<any> {
    if (this.propertiesSchemaCache) {
      return of(this.propertiesSchemaCache)
    }
    return this.getSchema().pipe(
      switchMap(
        schema => this.mergeSchema(schema['properties'] || {}).pipe(
          tap(propertiesSchema => this.propertiesSchemaCache = propertiesSchema)
        )
      )
    );
  }

  properties(): Observable<Record<string, Property>> {
    if (this.propertiesHash) {
      return of(this.propertiesHash);
    }
    return this.propertiesSchema().pipe(
      switchMap(
        propertiesSchemas => (zzip(
          ...Object.keys(propertiesSchemas).map(
            property => this.propertyFrom(property, propertiesSchemas[property])
          )
        ) as Observable<Property[]>)
      ),
      switchMap(props => (zzip(
        ...props.map(prop => (
          prop && (zzip(
            prop.isReferenced(),
            prop.isMany(),
            prop.getSchema(),
            prop.isModel()
          ) as Observable<any[]>).pipe(map(([isRef, isMany, propSch, isModel]) => {
            if (isModel) {
              if (isRef || prop.dataType?._type === FILE_TYPE) { // Referenced
                if (isMany) { // Many
                  prop.type = 'refMany';
                } else { // One
                  prop.type = 'refOne';
                }
              } else if (isMany) {
                prop.type = 'embedsMany';
              } else {
                prop.type = 'embedsOne';
              }
            } else {
              prop.type = propSch['type'] ? propSch['type'] : (prop.name === 'id' ? 'string' : undefined);
            }
            return prop;
          }
          ))
        ) || of(prop))
      ) as Observable<Property[]>)),
      map(
        properties => this.propertiesHash = properties.reduce((hash, p) => (hash[p.name] = p) && hash, {})
      )
    );
  }

  allProperties(): Observable<Property[]> {
    return this.properties().pipe(map(properties => Object.values(properties)));
  }

  getProperty(name: string): Observable<Property | undefined> {
    return this.properties().pipe(map(properties => properties[name]));
  }

  simpleProperties(): Observable<Property[]> {
    return this.allProperties().pipe(
      switchMap((props: Property[]) => (zzip(...props.map(p => p.isSimple())) as Observable<boolean[]>).pipe(
        map(
          simpleFlags => simpleFlags.map(
            (simple, index) => simple ? props[index] : null
          ).filter((p): p is Property => p !== null)
        )
      ))
    );
  }

  queryProps(): Observable<Property[]> {
    return this.allProperties().pipe(
      switchMap((props: Property[]) => (zzip(...props.map(p => p.getSchema())) as Observable<any[]>).pipe(
        map(schemas => schemas.map(
          (schema, index) => (
            schema.type === 'string' &&
            schema.format !== 'date' &&
            schema.format !== 'date-time' &&
            schema.format !== 'time' &&
            schema.format !== 'symbol' &&
            props[index].name !== '_type'
          ) ? props[index] : null
        ).filter((p): p is Property => p !== null)
        )
      ))
    );
  }

  titleProps(): Observable<Property[]> {
    return this.allProperties().pipe(
      switchMap(
        props => this.titlePropNames().pipe(
          map(titlePropNames => props.filter(p => titlePropNames.indexOf(p.name) > -1))
        )
      ));
  }

  visibleProps(...plus: string[]): Observable<Property[]> {
    return this.allProperties().pipe(
      switchMap(
        (props: Property[]) => (zzip(...props.map(prop => prop.isVisible())) as Observable<boolean[]>).pipe(
          map(visible => visible.map(
            (v, index) => (v || plus.indexOf(props[index].name) !== -1) ? props[index] : null
          ).filter((p): p is Property => p !== null))
        )
      ));
  }

  mergeSchema(schema: any): Observable<any> {
    return from(this.async_merge_schema(schema));
  }

  async async_merge_schema(schema: any, options: MergeOptions = {}): Promise<any> {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }
    if (schema.constructor === Array) {
      return Promise.all(schema.map(sch => this.async_merge_schema(sch, options)));
    }
    schema = deepDup(schema);
    options = options || {};
    options.root_schema = options.root_schema || schema;
    if (options.silent === undefined) {
      options.silent = true;
    }
    const references = {};
    let merging = true;
    let merged = false;
    while (merging) {
      merging = false;
      if ((options.expand_extends === undefined && options.only_overriders === undefined) || options.expand_extends) {
        let base_model;
        while ((base_model = schema.extends) !== undefined) {
          delete schema.extends;
          merged = merging = true;
          let ref;
          if (typeof base_model === 'string') {
            base_model = await firstValueFrom(this.find_ref_schema(ref = base_model));
          }
          if (base_model) {
            base_model = await this.async_merge_schema(base_model);
            if (schema.type === 'object' && base_model.type !== 'object') {
              schema.properties = schema.properties || {};
              let value_schema = schema.properties.value || {};
              value_schema = deepMergeObjectsOnly(base_model, value_schema);
              schema.properties.value = { ...value_schema, title: 'Value', xml: { content: true } };
              schema.xml = schema.xml || {};
              schema.xml.content_property = 'value';
            } else {
              let xml_opts = schema.xml;
              if (xml_opts !== undefined && !xml_opts.content_property) {
                if ((xml_opts = base_model.xml) && xml_opts.content_property) {
                  delete schema.xml.content_property
                }
              }
              schema = deepMergeArrayConcat(base_model, schema);
            }
          } else {
            if (!options.silent) {
              throw `contains an unresolved reference ${ref}`;
            }
          }
        }
      } else if (options.only_overriders) {
        let base_model;
        while (schema.extends || options.extends) {
          if (schema.extends) {
            base_model = schema.extends;
            delete schema.extends;
          } else {
            base_model = options.extends;
            delete options.extends;
          }
          merged = merging = true;
          if (typeof base_model === 'string') {
            base_model = await firstValueFrom(this.find_ref_schema(base_model));
          }
          base_model = await this.async_merge_schema(base_model);
          if (base_model.extends) {
            schema.extends = base_model.extends;
          }
          let base_properties = base_model.properties;
          if (base_properties) {
            let properties = schema.properties || {};
            Object.keys(base_properties).forEach(p => {
              if (properties[p] === undefined) {
                delete base_properties[p];
              }
            });
            if (Object.keys(base_properties).length) {
              schema = deepMergeArrayConcat({ properties: base_properties }, schema);
            }
          }
        }
      }
      let refs;
      while ((refs = schema.$ref)) {
        merged = merging = true;
        if (typeof refs !== 'object' || refs.constructor !== Array) {
          refs = [refs];
        }
        refs.forEach(ref => {
          const refHash = Hash.MD5(ref);
          if (references[refHash]) {
            if (options.silent) {
              delete schema.$ref;
            } else {
              throw `contains a circular reference ${ref}`;
            }
          } else {
            references[refHash] = true;
          }
        });
        let sch = {};
        let keys = Object.keys(schema);
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];
          let value = schema[key];
          if (key === '$ref' && (!options.keep_ref || sch[key])) {
            value = (value && typeof value === 'object' && value.constructor === Array && value) || [value];
            for (let j = 0; j < value.length; j++) {
              let ref = value[j];
              let ref_sch = await firstValueFrom(this.find_ref_schema(ref));
              if (ref_sch) {
                sch = deepMergeArrayConcat(ref_sch, sch);
              } else if (!options.silent) {
                throw `contains an unresolved reference ${value}`;
              }
            }
          } else {
            let existing_value = sch[key];
            if (existing_value && typeof existing_value === 'object') {
              if (existing_value.constructor === Object) {
                value = deepMergeArrayConcat(existing_value, value);
              } else if (existing_value.constructor === Array && value && typeof value === 'object' && value.constructor === Array) {
                value = [...value, ...existing_value];
              }
            }
            sch[key] = value;
          }
        }
        schema = sch;
      }
    }
    if (options.recursive || (options.until_merge && !merged)) {
      let keys = Object.keys(schema);
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let val = schema[key];
        if (val && typeof val === 'object') {
          if (val.constructor === Object) {
            schema[key] = await this.async_merge_schema(val, options);
          } else if (val.constructor === Array) {
            schema[key] = await Promise.all(
              val.map(sub_val => {
                if (sub_val && typeof sub_val === 'object' && sub_val.constructor === Object) {
                  return this.async_merge_schema(sub_val, options);
                }
                return Promise.resolve(sub_val);
              })
            );
          }
        }
      }
    }
    return schema;
  }

  find_ref_schema(ref, root_schema = this.schema) {
    let fragment = '';
    let dataTypeObs: Observable<DataType>;
    let sch: Observable<any>;
    if (typeof ref === 'string' && ref.startsWith('#')) {
      fragment = `${ref}`;
      try {
        sch = of(this.get_embedded_schema(ref, root_schema)[1]);
      } catch (_) {
        sch = of(null);
      }
      dataTypeObs = of(this);
    } else {
      dataTypeObs = this.find_data_type(ref);
      sch = dataTypeObs.pipe(
        switchMap(dt => (dt && dt.getSchema()) || of(null))
      );
    }
    return zzip(sch, dataTypeObs).pipe(
      map(([sch, dt]) => {
        if (sch) {
          sch.id = `${session.cenitBackendBaseUrl}/data_type/${dt?.id}${fragment}`;
        }
        return sch;
      })
    );
  }

  findByName(name: string): Observable<DataType | null | undefined> {
    let namespace: string | undefined;
    const split = DataType.splitName(name);
    namespace = split[0];
    name = split[1];
    return this.find_data_type(name, namespace).pipe(
      switchMap(dataType => {
        if (!dataType && name.startsWith('Dt')) {
          return DataType.getById(name.substring(2))
        }

        return of(dataType);
      })
    );
  }

  find_data_type(ref: any, ns: string | null = this.namespace): Observable<DataType> {
    if (ref && typeof ref === 'object' && ref.constructor === Object) {
      ns = `${(ref as any).namespace}`;
      ref = `${(ref as any).name}`;
    }
    if (ref === this.name && (ns === null || ns === undefined || ns === this.namespace)) {
      return of(this);
    }
    if (!this.nss) { // TODO Common cache for shared data types
      this.nss = {};
    }
    let ns_hash = this.nss[ns];
    if (!ns_hash) {
      ns_hash = this.nss[ns] = {};
    }
    let data_type = ns_hash[ref];
    if (data_type) {
      if (data_type[Async]) {
        return data_type;
      }
      return of(data_type);
    }
    let criteria: any = { name: ref };
    if (ns !== null && ns !== undefined) {
      criteria.namespace = ns;
    }
    data_type = DataType.find(criteria).pipe(
      switchMap(
        dt => {
          if (dt || ns !== null || ns !== undefined) {
            return of(dt);
          }
          return this.find_data_type(ref, this.namespace);
        }
      ),
      tap(dt => {
        if (dt) {
          ns_hash[ref] = dt;
          if (dt.namespace !== ns) {
            ns_hash = this.nss[dt.namespace];
            if (!ns_hash) {
              ns_hash = this.nss[dt.namespace] = {};
            }
            ns_hash[ref] = dt;
          }
        }
      }),
      share()
    );
    data_type[Async] = true;
    ns_hash[ref] = data_type;
    return data_type;
  }

  get_embedded_schema(ref, root_schema, root_name = '') {
    if (!ref.match(/#(\/[a-z]+(_|([0-9]|[a-z])+)*)*$/)) {
      throw `invalid format for embedded reference ${ref}`;
    }
    if (ref === '#') {
      throw `embedding itself (referencing '#')`;
    }
    const tokens = ref.split('/');
    tokens.shift();
    let type = root_name;
    while (tokens.length) {
      let token = tokens.shift();
      if (!((root_schema === undefined || (root_schema = root_schema[token])) && ((token === 'properties' || token === 'definitions') && tokens.length))) {
        throw `use invalid embedded reference path '${ref}'`;
      }
      token = tokens.shift();
      if (!(root_schema === undefined || (root_schema = root_schema[token]))) {
        throw `use invalid embedded reference path '${ref}'`;
      }
      type = root_name.length ? `${type}::${token.camelize}` : token.camelize;
    }
    if (!root_schema || typeof root_schema !== 'object' || root_schema.constructor !== Object) {
      throw `use invalid embedded reference path '${ref}'`;
    }
    return [type, root_schema];
  }

  getTitle() {
    return this.config().pipe(
      switchMap(({ title }) => {
        if (title) {
          return of(title);
        }

        return this.getSchema().pipe(
          map(schema => {
            const title = schema && schema['title'];
            if (title) {
              return title.toString();
            }
            return deriveDataTypeTitle(this.name);
          })
        );
      })
    );
  }

  getSchemaEntry(key) {
    return this.getSchema().pipe(map(schema => schema[key]));
  }

  isAbstract() {
    return this.getSchemaEntry('abstract');
  }

  descendantsCount() {
    return this.getSchemaEntry('descendants').pipe(
      map(
        descendants => (descendants || []).length
      )
    );
  }

  descendants(): Observable<DataType[]> {
    return this.getSchemaEntry('descendants').pipe(
      switchMap(
        (descendants: any[]) => (zzip(...(descendants || []).map(
          ({ id }: any) => DataType.getById(id)
        )) as Observable<DataType[]>)
      )
    );
  }

  propertyFrom(name: string, schema: any): Observable<Property> {
    let ref: any;
    let dataType: Observable<DataType | null> = of(null);
    // Checking referenced schema
    if (
      schema.constructor === Object && (
        ((ref = schema['$ref']) && ref.constructor !== Array) || schema['type'] === 'array')
    ) {
      if (ref && ref.constructor !== Object) {
        ref = ref.toString();
      }
      const nakedSchema = this.strip(schema);
      const size = Object.keys(nakedSchema).length;
      let items: any;
      if (
        (ref && (size === 1 || (size === 2 && nakedSchema.hasOwnProperty('referenced')))) ||
        (nakedSchema['type'] === 'array' && (items = this.strip(nakedSchema['items'])) &&
          (size === 2 || (size === 3 && nakedSchema.hasOwnProperty('referenced'))) &&
          Object.keys(items).length === 1 && (ref = items['$ref']) && (ref.constructor === String || ref.constructor === Object))
      ) {
        if (ref.constructor === Object) {
          dataType = DataType.find(ref);
        } else {
          dataType = this.find_data_type(ref, null);
        }
      }
    }

    return dataType.pipe(
      switchMap(dt => {
        let mergedSchema: Observable<any[]>;
        // Not referenced schema
        if (dt) {
          mergedSchema = zzip(of(dt), dt.mergeSchema(schema)) as Observable<any[]>;
        } else {
          mergedSchema = this.mergeSchema(schema).pipe(
            map(ms => {
              let typeSchema;
              if (ms['type'] === 'array' && ms.hasOwnProperty('items')) {
                typeSchema = ms['items'];
              } else {
                typeSchema = ms;
              }
              const dType = DataType.from({
                name: this.name + '::' + name,
                schema: typeSchema
              });

              return [dType, ms];
            })
          ) as Observable<any[]>;
        }

        return mergedSchema.pipe(
          map(([dType, ms]) => {
            const prop = new Property();
            prop.name = name;
            prop.jsonKey = (ms.edi && ms.edi.segment) || name;
            prop.dataType = dType;
            prop.propertySchema = ms;

            return prop;
          })
        );
      })
    );
  }

  strip(schema) {
    return stripDecoratorProps(schema);
  }

  createFrom(data) {
    return API.post(
      'setup', 'data_type', this.id, 'digest', data, {
      template: {
        viewport: '{_id}'
      }
    });
  }

  queryFind(query: string, opts: FindOptions | null = null): Observable<any> {
    query = query?.toString()?.trim() || '';
    if (!query) {
      return this.find(opts || {});
    }

    return this.descendants().pipe(
      switchMap(dts => (zzip(...[this, ...dts].map(dt => dt.isAbstract())) as Observable<boolean[]>).pipe(
        map(abstractFlags => dts.map((dt, index) => abstractFlags[index] && dt).filter(dt => dt))
      )),
      switchMap(dts => (zzip(...dts.map(
        dt => dt.queryProps()
      )) as Observable<Property[][]>).pipe(
        switchMap(queriesProps => {
          let dataTypesSelectors: any = queriesProps.map((queryProps, index) => {
            const $and = [];
            const $or = queryProps.map(
              prop => ({ [prop.name]: { '$regex': `(?i)${query}` } })
            );
            $and.push({ $or });
            if (dts.length > 1) {
              $and.push({ _type: dts[index].type_name() })
            }
            return { $and };
          });
          if (dataTypesSelectors.length > 1) {
            dataTypesSelectors = { $or: dataTypesSelectors };
          } else {
            dataTypesSelectors = dataTypesSelectors[0];
          }
          return of(dataTypesSelectors);
        }),
        switchMap(selector => {
          if (opts?.selector) {
            selector = {
              $and: [
                selector,
                opts.selector
              ]
            } as any;
          }

          return this.find({ ...(opts || {}), selector });
        })
      ))
    );
  }

  find(opts: FindOptions = {}): Observable<any> {
    return ((opts?.viewport && of(opts.viewport as string)) || (this.shallowViewPort() as Observable<string>)).pipe(
      switchMap(viewport => {
        const limit = opts?.limit || 5;
        const page = opts?.page || 1;
        const sort = opts?.sort || {};
        const params: any = { limit, page };

        const headers = buildDigestHeaders(
          viewport,
          sort,
          (opts as any).selector || {},
          true,
          Boolean(opts.include_id)
        );

        const request: any[] = ['setup', 'data_type', this.id, 'digest'];

        const query = opts.query;

        if (query) {
          params.query = query;
          request.push('search');
        }

        request.push({ params, headers });

        return API.get(...request);
      }),
      map(response => response || { items: [] })
    );
  }

  list(opts: any = {}): Observable<any> {
    if (!this.id) {
      console.warn(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] list called for datatype without id; returning empty items.`);
      return of({ items: [] });
    }
    return API.get('setup', 'data_type', this.id, 'digest', opts);
  }

  distinct(field: string, opts: any = {}): Observable<any> {
    if (!this.id) {
      console.warn(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] distinct called for datatype without id; returning empty result.`);
      return of([]);
    }
    let selector = opts?.selector || {};
    return API.get('setup', 'data_type', this.id, `digest.distinct(${field})`, {
      headers: {
        'X-Query-Selector': JSON.stringify(selector)
      }
    });
  }

  titleViewport(...plus: string[]): Observable<string> {
    return this.config().pipe(
      switchMap(config => {
        if (config.titleViewport) {
          return of(config.titleViewport);
        }
        return this.titleProps().pipe(
          map(props => `{${props.map(p => p.name).concat(plus).join(' ')}}`)
        )
      })
    );
  }

  titlePropNames(): Observable<string[]> {
    if (!this.__titleProps) {
      return this.getSchema().pipe(
        switchMap(
          schema => {
            if (schema.label) {
              this.__titleProps = (LiquidEngine.parse(schema.label) as any[]).map(
                (template: any) => (template.token.content || '').split('|')[0].trim()
              ).filter((token: string) => token.length);
            } else {
              this.__titleProps = ['id', 'name', 'title'];
            }

            return of(this.__titleProps);
          })
      );
    }
    return of(this.__titleProps);
  }

  titleFor(item) {
    return this.polymorphicTitlesFor(item).pipe(map(titles => titles[0]));
  }

  straightTitleFor(item) {
    return this.config().pipe(
      switchMap(config => {
        if (config.itemLabel) {
          return of(config.itemLabel(item)?.trim());
        }

        return zzip(this.getSchema(), this.getTitle()).pipe(
          switchMap(([schema, dtTitle]) => {
            if (schema.label) {
              return from(LiquidEngine.parseAndRender(schema.label, item)).pipe(
                map(
                  title => title || `${dtTitle} ${item.id || '(blank)'}`
                )
              );
            }
            return of(deriveItemTitle(item, dtTitle));
          })
        );
      })
    );
  }

  titlesFor(...items: any[]): Observable<string[]> {
    items = [...items];

    return this.config().pipe(switchMap(
      config => {
        if (config.itemLabel) {
          return of(items.map(item => config.itemLabel(item)?.trim()))
        }

        return this.computeTitlesFor(...items);
      }
    ));
  }

  polymorphicTitlesFor(...items: any[]): Observable<string[]> {
    if (!this.type_name()) {
      return this.titlesFor(...items);
    }
    const typeHash: Record<string, any[]> = {};
    const indices: Record<string, number[]> = {};
    items.forEach((item, index) => {
      const type = item._type || this.type_name();
      let typeItems = typeHash[type];
      let typeIndices = indices[type];
      if (!typeItems) {
        typeItems = typeHash[type] = [];
        typeIndices = indices[type] = [];
      }
      typeItems.push(item);
      typeIndices.push(index);
    });
    return (zzip(...Object.keys(typeHash).map(type => this.findByName(type))) as Observable<DataType[]>).pipe(
      switchMap(dataTypes => (zzip(...dataTypes.map(
        dataType => dataType.titlesFor(...typeHash[(dataType as DataType).type_name()])
      )) as Observable<any[][]>).pipe(
        map(titlesByType => {
          const titles: string[] = [];
          titlesByType.forEach((titleGroup, dataTypeIndex) => {
            const type = dataTypes[dataTypeIndex]!.type_name();
            titleGroup.forEach((title, index) => {
              const itemIndex = indices[type][index];
              titles[itemIndex] = title;
            });
          });
          return titles;
        })
      ))
    );
  }

  computeTitlesFor(...items: any[]): Observable<any[]> {
    return (zzip(this.getSchema(), this.titleProps()) as Observable<any[]>).pipe(
      switchMap(
        (args: any[]) => {
          const [schema, titleProps] = args as [any, Property[]];
          const missingProps: Record<string, number[]> = {};

          for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (item.hasOwnProperty('id')) {
              for (let prop of titleProps) {
                if (!item.hasOwnProperty(prop.name)) {
                  missingProps[item.id] = [...(missingProps[item.id] || []), i];
                  break;
                }
              }
            }
          }

          const missingIds = Object.keys(missingProps);
          let completeItems: Observable<any[]>;
          if (missingIds.length > 0) {
            completeItems = this.titleViewport('_id').pipe(
              switchMap(
                viewport => this.list({
                  headers: {
                    'X-Template-Options': JSON.stringify({ viewport }),
                    'X-Query-Selector': JSON.stringify({ _id: { '$in': missingIds } })
                  }
                }).pipe(map(response => response?.items || []))
              ));
          } else {
            completeItems = of([]);
          }

          return completeItems.pipe(
            switchMap(completeItems => {
              for (let item of completeItems) {
                if (missingProps[item.id]) {
                  for (let i of missingProps[item.id]) {
                    items[i] = { ...items[i], ...item };
                  }
                }
              }

              return this.getTitle().pipe(
                switchMap(
                  dtTitle => (zzip(...items.map(item => {
                    if (schema.label) {
                      return from(LiquidEngine.parseAndRender(schema.label, item));
                    }
                    return of(deriveItemTitle(item, dtTitle, true));
                  })
                  ) as Observable<string[]>)
                )
              );
            })
          );
        }
      )
    );
  }

  post(data: any, opts: any = {}): Observable<any> {
    if (!this.id) {
      return API.post('setup', 'data_type', 'digest', data);
    }
    const { viewport, add_only, add_new, polymorphic } = opts;
    opts = { headers: {} };
    let templateOptions: any;
    if (viewport) {
      templateOptions = { viewport };
    }
    if (polymorphic) {
      templateOptions = { ...templateOptions, polymorphic };
    }
    if (templateOptions) {
      opts.headers['X-Template-Options'] = JSON.stringify(templateOptions);
    }
    let parserOptions;
    if (add_only) {
      parserOptions = { add_only: true };
    }
    if (add_new) {
      parserOptions = { ...parserOptions, add_new: true };
    }
    if (parserOptions) {
      opts.headers['X-Parser-Options'] = JSON.stringify(parserOptions);
    }
    return API.post('setup', 'data_type', this.id, 'digest', opts, data);
  }

  get(id: string, opts: GetOptions = {}): Observable<any> {
    if (!this.id) {
      console.warn(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] get called for datatype without id; returning null.`);
      return of(null);
    }
    const { viewport, jsonPath, with_references, include_id } = opts;
    const include_blanks = opts.hasOwnProperty('include_blanks') ? opts.include_blanks : true;
    const templateOptions: any = { include_blanks };
    const requestOpts: any = { headers: { 'X-Record-Id': id } };
    if (viewport) {
      templateOptions.viewport = viewport;
    }
    if (with_references) {
      templateOptions.with_references = with_references;
    }
    if (include_id) {
      templateOptions.include_id = true;
    }
    requestOpts.headers['X-Template-Options'] = JSON.stringify(templateOptions);
    if (jsonPath) {
      requestOpts.headers['X-JSON-Path'] = jsonPath;
    }
    return API.get('setup', 'data_type', this.id, 'digest', requestOpts);
  }

  delete(id: string): Observable<any> {
    return this.bulkDelete({ _id: id });
  }

  bulkDelete(selector) {
    if (!this.id) {
      console.error(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] bulkDelete called for datatype without id; operation aborted.`);
      return throwError(() => new Error('DataType ID missing'));
    }
    return API.delete('setup', 'data_type', this.id, 'digest', {
      headers: { 'X-Query-Selector': JSON.stringify(selector) }
    });
  }

  shallowViewPort(...properties: string[]): Observable<string> {
    let viewportProps: Observable<Property[]>;
    if (properties.length) {
      if (properties.indexOf('_id') !== -1) {
        properties = ['_id', ...properties];
      }
      viewportProps = this.allProperties().pipe(
        map(props => props.filter(p => properties.indexOf(p.name) !== -1))
      );
    } else {
      viewportProps = this.visibleProps('_id');
    }
    return viewportProps.pipe(
      switchMap(
        (props: Property[]) => (zzip(
          ...props.map(
            (p: Property) => p.isModel().pipe(
              switchMap(model => (model && (p.dataType as any).titleViewport('_id')) || of(''))
            )
          )
        ) as Observable<string[]>).pipe(
          map(
            childViewports => '{' + props.map(
              (prop, index) => `${prop.name} ${childViewports[index]}`
            ).join('') + '}'
          )
        )
      )
    );
  }

  shallowGet(id, opts = {}) {
    return this.shallowViewPort().pipe(
      switchMap(viewport => this.get(id, { viewport, ...opts }))
    );
  }

  config(): Observable<any> {
    const runtimeMarker = (globalThis as any)[DATA_TYPE_SERVICE_MARKER_KEY];
    if (runtimeMarker) {
      runtimeMarker.configCalls = (runtimeMarker.configCalls || 0) + 1;
      runtimeMarker.lastConfigFor = this.type_name() || this.id || null;
    }

    let config = (this as any)[ConfigSymbol];
    if (config) {
      const cacheKind = isObservable(config) ? 'observable' : 'value';
      console.log(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] config cache hit (${cacheKind}) for ${this.type_name() || this.id}`);
      if (!isObservable(config)) {
        config = of(config);
      }
    } else if (this.id !== undefined) {
      const path = this.configPath();
      if (path) {
        const loader = resolveDataTypeConfigModuleLoader(path);
        if (!loader) {
          console.warn(
            `DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] config module not found for path=${path}; ` +
            `falling back to {}.`
          );
          config = of({});
          (this as any)[ConfigSymbol] = config;
          return config;
        }
        console.log(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] importing config for path=${path}`);
        config = from(
          loader()
        ).pipe(
          tap(m => console.log(`DEBUG: Config imported successfully for ${path}`, m?.default)),
          map(mod => mod?.default || {}),
          catchError(e => {
            console.error(`DEBUG: Failed importing config for ${path}; falling back to {}.`, e);
            return of({});
          }),
          tap(config => {
            (this as any)[ConfigSymbol] = config;
          }),
          share() // Ensure the observable is shared if multiple subscribers
        );
        (this as any)[ConfigSymbol] = config; // Cache the observable
      } else {
        console.warn(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] configPath unavailable for id=${this.id}; using empty config fallback.`);
        config = of({});
      }
    } else {
      console.warn(`DEBUG: [${DATA_TYPE_SERVICE_FINGERPRINT}] datatype without id; using empty config fallback.`);
      config = of({});
    }
    return config;
  }
}

export class FileDataType extends DataType {

  upload(data: any, opts: UploadOptions = {}): Observable<any> {
    const { id, filename, onUploadProgress, cancelToken, add_new } = opts;
    const requestOpts: any = { headers: {}, onUploadProgress, cancelToken };

    let digestOpts: any;
    if (id) {
      digestOpts = { id };
    }
    if (filename) {
      digestOpts = { ...digestOpts, filename };
    }
    if (add_new) {
      digestOpts = { ...digestOpts, add_new };
    }
    if (digestOpts) {
      requestOpts.headers['X-Digest-Options'] = JSON.stringify(digestOpts);
    }

    const formData = new FormData();
    formData.append('data', data);

    requestOpts.headers['Content-Type'] = 'multipart/form-data';

    return API.post('setup', 'data_type', this.id, 'digest', 'upload', requestOpts, formData);
  }

  config() {
    return of(FileDataTypeConfig).pipe(
      map(config => ({ title: titleize(this.name), ...config }))
    );
  }
}

export class Property {
  name!: string;
  jsonKey!: string;
  dataType!: DataType;
  propertySchema!: any;
  type!: string;

  constructor(attrs: any = {}) {
    Object.keys(attrs).forEach((attr: string) => (this as any)[attr] = attrs[attr]);
  }

  viewportToken(): Observable<string> {
    return this.isModel().pipe(
      switchMap(model => {
        if (model) {
          return this.dataType.titleViewport('_id').pipe(
            map(viewport => `${this.name} ${viewport}`)
          );
        }
        return of(this.name);
      })
    );
  }

  getSchema = () => {
    if (this.propertySchema) {
      return of(this.propertySchema);
    }
    return this.dataType.getSchema();
  };

  config = () => {
    return this.dataType.config();
  };

  getSchemaEntry = key => {
    return this.getSchema().pipe(map(schema => schema[key]));
  };

  isVisible = () => {
    return this.getSchema().pipe(
      map(
        schema => (!schema.hasOwnProperty('visible') || schema['visible']) &&
          (!schema.hasOwnProperty('edi') || (schema['edi'].constructor === Object && !schema['edi']['discard']))
      )
    );
  };

  isSimple = () => this.getSchema().pipe(map(schema => isSimpleSchema(schema)));

  isVirtual = () => this.getSchemaEntry('virtual');

  is = type => this.getSchema().pipe(map(schema => schema['type'] === type));

  isReferenced(): Observable<boolean> {
    return this.getSchema().pipe(map(schema => schema['referenced']));
  }

  isMany(): Observable<boolean> {
    return this.getSchema().pipe(map(schema => schema['referenced'] || schema['type'] === 'array'));
  }

  isTypeMany(): boolean {
    return Boolean(this.type?.includes('Many'));
  }

  getTitle(): Observable<string> {
    return this.getSchema().pipe(
      switchMap(schema => {
        const title: any = schema['title'];
        if (title) {
          return from(LiquidEngine.parseAndRender(title.toString(), this));
        }
        return of(titleize(this.name));
      }));
  }

  getDescription = () => this.getSchemaEntry('description');

  isReadOnly(context) {
    return context === FormContext.edit && (this.name === '_id' || this.name === 'id');
  }

  isModel(andTrueDataType = false) {
    if (andTrueDataType && !this.dataType.id) {
      return of(false);
    }
    return this.getSchema().pipe(
      switchMap(
        schema => {
          if (schema.type === 'object' && schema.properties) {
            return of(true);
          }

          if (schema.type === 'array' && schema.items) {
            return this.dataType.mergeSchema(schema.items).pipe(
              map(
                itemsSchema => itemsSchema.type === 'object' && itemsSchema.properties
              )
            );
          }

          return of(false);
        }
      )
    );
  }
}
