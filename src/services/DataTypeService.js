import API from './ApiService';
import { from, isObservable, of } from "rxjs";
import { catchError, map, share, switchMap, tap } from "rxjs/operators";
import zzip from "../util/zzip";
import FormContext from "./FormContext";
import LiquidEngine from "./LiquidEngine";
import { AppGateway, Config } from "./AuthorizationService";
import { Async } from "../common/Symbols";
import { deepMergeArrayConcat, deepMergeObjectsOnly } from "../common/merge";
import deepDup from "../common/deepDup";
import Hash from 'object-hash';
import { Config as ConfigSymbol } from "../common/Symbols";
import { titleize } from "../common/strutls";
import FileDataTypeConfig from "../config/FileDataTypeConfig";

const SimpleTypes = ['integer', 'number', 'string', 'boolean'];

export function isSimpleSchema(schema) {
    return SimpleTypes.indexOf(schema?.type) !== -1;
}

function injectCommonProperties(schema) {
    const properties = schema?.properties;
    if (properties) {
        if (!properties.created_at) {
            properties.created_at = {
                type: 'string',
                format: 'date-time',
                edi: {
                    discard: true
                }
            }
        }
        if (!properties.updated_at) {
            properties.updated_at = {
                type: 'string',
                format: 'date-time',
                edi: {
                    discard: true
                }
            }
        }
    }
}

export class DataType {

    static loaded;
    static loading;
    static dataTypes = {}; // TODO Store data types cache using a pair key tenant.id -> dataType.id
    static criteria = {};
    static gets = {};

    static load(obs) {
        if (DataType.loaded === true) {
            return obs
        }

        if (!DataType.loading) {
            DataType.loading = from(AppGateway.get('build_in_types')).pipe(
                tap(({ data }) => {
                    DataType.initBuildIns(data);
                    DataType.loaded = true;
                    DataType.loading = null;
                })
            );
        }

        return DataType.loading.pipe(
            switchMap(() => obs)
        );
    }

    static initBuildIns(buildIns) {
        buildIns.forEach(dataType => {
            const { id, namespace, name } = dataType;
            DataType.dataTypes[id] = DataType.from(dataType);
            DataType.criteria[DataType.criteriaKey({ namespace, name })] = id;
        });
    }

    static from(spec) {
        if (spec._type === JSON_TYPE) {
            delete spec.schema;
        } else {
            injectCommonProperties(spec.schema);
        }
        if (spec._type === FILE_TYPE) {
            spec.__proto__ = new FileDataType();
        } else {
            spec.__proto__ = new DataType();
        }
        return spec;
    }

    static getById(id) {
        let dataType = DataType.dataTypes[id];
        if (dataType) {
            return of(dataType);
        }
        dataType = DataType.gets[id];
        if (!dataType) {
            dataType = DataType.load(
                API.get('setup', 'data_type', id, {
                    headers: { 'X-Template-Options': JSON.stringify({ viewport: '{_id namespace name title _type schema}' }) }
                }).pipe(
                    tap(dataType => {
                        if (dataType) {
                            DataType.dataTypes[id] = DataType.from(dataType);
                        }
                        delete DataType.gets[id];
                        return dataType;
                    }),
                    share()
                )
            );
        }

        DataType.gets[id] = dataType;
        return dataType;
    }

    static splitName(name) {
        let namespace = '';
        name = name.split('::');
        if (name.length > 1) {
            [name, namespace] = [name.pop(), name];
            namespace = namespace.join('::');
        } else {
            name = name[0];
        }
        return [namespace, name];
    }

    static byTypeName(name) {
        let namespace;
        [namespace, name] = this.splitName(name);
        return this.find({ namespace, name }).pipe(
            switchMap(dataType => {
                if (!dataType && name.startsWith('Dt')) {
                    return DataType.getById(name.substring(2))
                }

                return of(dataType);
            })
        );
    }

    static criteriaKey(criteria) {
        return Object.keys(criteria)
            .sort()
            .map(key => `${key}(${JSON.stringify(criteria[key])})`)
            .join();
    }

    static find(criteria) {
        let key = DataType.criteriaKey(criteria);

        let id = DataType.criteria[key];

        if (id) {
            return this.getById(id);
        }

        key = `find_${key}`;

        let get = DataType.gets[key];

        if (!get) {
            get = DataType.load(
                API.get('setup', 'data_type', {
                    params: { limit: 1 },
                    headers: {
                        'X-Template-Options': JSON.stringify({ viewport: '{_id}' }),
                        'X-Query-Selector': JSON.stringify(criteria)
                    }
                }).pipe(
                    switchMap(response => {

                        delete DataType.gets[key];

                        const item = response && response['items'][0];

                        if (item) {
                            DataType.criteria[key] = item['id'];

                            return this.getById(item['id']);
                        }

                        return of(null);
                    }),
                    share()
                )
            );
            DataType.gets[key] = get;
        }

        return get;
    }

    asRef() {
        const { id, name, namespace, _type } = this;
        return {
            _reference: true,
            id, namespace, name, _type
        };
    }

    type_name() {
        if (this._type === CENIT_TYPE) {
            if (this.namespace) {
                return `${this.namespace}::${this.name}`;
            }
            return this.name;
        }
        return this.id && `Dt${this.id}`;
    }

    getSchema() {
        if (this.schema) {
            return of(this.schema);
        }

        if (!this.gettingSchema) {
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

    withOrigin() {
        return this.getSchemaEntry('with_origin').pipe(
            map(v => Boolean(v))
        );
    }

    propertiesSchema() {
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

    properties() {
        if (this.propertiesHash) {
            return of(this.propertiesHash);
        }
        return this.propertiesSchema().pipe(
            switchMap(
                propertiesSchemas => zzip(
                    ...Object.keys(propertiesSchemas).map(
                        property => this.propertyFrom(property, propertiesSchemas[property])
                    )
                )
            ),
            switchMap(props => zzip(
                ...props.map(prop => (
                    prop && zzip(
                        prop.isReferenced(),
                        prop.isMany(),
                        prop.getSchema(),
                        prop.isModel()
                    ).pipe(map(([isRef, isMany, propSch, isModel]) => {
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
                                prop.type = propSch['type'];
                            }
                            return prop;
                        }
                    ))
                ) || of(prop))
            )),
            map(
                properties => this.propertiesHash = properties.reduce((hash, p) => (hash[p.name] = p) && hash, {})
            )
        );
    }

    allProperties() {
        return this.properties().pipe(map(properties => Object.values(properties)));
    }

    getProperty(name) {
        return this.properties().pipe(map(properties => properties[name]));
    }

    simpleProperties() {
        return this.allProperties().pipe(
            switchMap(props => zzip(...props.map(p => p.isSimple())).pipe(
                map(
                    simpleFlags => simpleFlags.map(
                        (simple, index) => simple ? props[index] : null
                    ).filter(p => p)
                )
            ))
        );
    }

    queryProps() {
        return this.allProperties().pipe(
            switchMap(props => zzip(...props.map(p => p.getSchema())).pipe(
                map(schemas => schemas.map(
                    (schema, index) => (
                        schema.type === 'string' &&
                        schema.format !== 'date' &&
                        schema.format !== 'date-time' &&
                        schema.format !== 'time' &&
                        schema.format !== 'symbol' &&
                        props[index].name !== '_type'
                    ) ? props[index] : null
                    ).filter(p => p)
                )
            ))
        );
    }

    titleProps() {
        return this.allProperties().pipe(
            switchMap(
                props => this.titlePropNames().pipe(
                    map(titlePropNames => props.filter(p => titlePropNames.indexOf(p.name) > -1))
                )
            ));
    }

    visibleProps(...plus) {
        return this.allProperties().pipe(
            switchMap(
                props => zzip(...props.map(prop => prop.isVisible())).pipe(
                    map(visible => visible.map(
                        (v, index) => (v || plus.indexOf(props[index].name) !== -1) ? props[index] : null
                    ).filter(p => p))
                )
            ));
    }

    mergeSchema(schema) {
        return from(this.async_merge_schema(schema));
    }

    async async_merge_schema(schema, options = {}) {
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
                        base_model = await this.find_ref_schema(ref = base_model).toPromise();
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
                            throw  `contains an unresolved reference ${ref}`;
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
                        base_model = await this.find_ref_schema(base_model).toPromise();
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
                            let ref_sch = await this.find_ref_schema(ref).toPromise();
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
        let data_type = this;
        let sch;
        if (typeof ref === 'string' && ref.startsWith('#')) {
            fragment = `${ref}`;
            try {
                sch = of(this.get_embedded_schema(ref, root_schema)[1]);
            } catch (_) {
                sch = of(null);
            }
        } else {
            sch = (data_type = this.find_data_type(ref)).pipe(
                switchMap(data_type => (data_type && data_type.getSchema()) || of(null))
            );
        }
        return sch.pipe(
            tap(sch => {
                    if (sch) {
                        sch.id = `${Config.getCenitHost()}/data_type/${data_type.id}${fragment}`;
                    }
                }
            )
        );
    }

    findByName(name) {
        let namespace;
        [namespace, name] = DataType.splitName(name);
        return this.find_data_type(name, namespace).pipe(
            switchMap(dataType => {
                if (!dataType && name.startsWith('Dt')) {
                    return DataType.getById(name.substring(2))
                }

                return of(dataType);
            })
        );
    }

    find_data_type(ref, ns = this.namespace) {
        if (ref && typeof ref === 'object' && ref.constructor === Object) {
            ns = `${ref.namespace}`;
            ref = `${ref.name}`;
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
        let criteria = { name: ref };
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
                        return this.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
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

    descendants() {
        return this.getSchemaEntry('descendants').pipe(
            switchMap(
                descendants => zzip(...(descendants || []).map(
                    ({ id }) => DataType.getById(id)
                    )
                )
            )
        );
    }

    propertyFrom(name, schema) {
        let ref, dataType = of(null);
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
            let items;
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
            switchMap(dataType => {
                let mergedSchema;
                // Not referenced schema
                if (dataType) {
                    mergedSchema = zzip(of(dataType), dataType.mergeSchema(schema));
                } else {
                    mergedSchema = this.mergeSchema(schema).pipe(
                        map(mergedSchema => {
                            let typeSchema;
                            if (mergedSchema['type'] === 'array' && mergedSchema.hasOwnProperty('items')) {
                                typeSchema = mergedSchema['items'];
                            } else {
                                typeSchema = mergedSchema;
                            }
                            dataType = DataType.from({
                                name: this.name + '::' + name,
                                schema: typeSchema
                            });

                            return [dataType, mergedSchema];
                        })
                    );
                }

                return mergedSchema.pipe(
                    map(([dataType, mergedSchema]) => {
                        const prop = new Property();
                        prop.name = name;
                        prop.jsonKey = (mergedSchema.edi && mergedSchema.edi.segment) || name;
                        prop.dataType = dataType;
                        prop.propertySchema = mergedSchema;

                        return prop;
                    })
                );
            })
        );
    }

    strip(schema) {
        let nakedSchema = null;
        if (schema) {
            nakedSchema = {};
            Object.keys(schema).forEach(key => {
                if (DECORATOR_PROPS.indexOf(key) === -1) {
                    nakedSchema[key] = schema[key];
                }
            });
        }
        return nakedSchema;
    }

    createFrom(data) {
        return API.post(
            'setup', 'data_type', this.id, 'digest', data, {
                template: {
                    viewport: '{_id}'
                }
            });
    }

    queryFind(query, opts = null) {
        query = query?.toString()?.trim() || '';
        if (!query) {
            return this.find(opts);
        }

        return this.descendants().pipe(
            switchMap(dataTypes => zzip(...[this, ...dataTypes].map(dt => dt.isAbstract())).pipe(
                map(abstractFlags => dataTypes.map((dt, index) => abstractFlags[index] && dt).filter(dt => dt))
            )),
            switchMap(dataTypes => zzip(...dataTypes.map(
                dataType => dataType.queryProps()
            )).pipe(
                switchMap(queriesProps => {
                    let dataTypesSelectors = queriesProps.map((queryProps, index) => {
                        const $and = [];
                        const $or = queryProps.map(
                            prop => ({ [prop.name]: { '$regex': `(?i)${query}` } })
                        );
                        $and.push({ $or });
                        if (dataTypes.length > 1) {
                            $and.push({ _type: dataTypes[index].type_name() })
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
                        };
                    }

                    return this.find({ ...opts, selector });
                })
            ))
        );

    }

    find(opts = null) {
        return ((opts?.viewport && of(opts.viewport)) || this.shallowViewPort()).pipe(
            switchMap(viewport => {
                const limit = opts?.limit || 5;
                const page = opts?.page || 1;
                const sort = opts?.sort || {};
                const params = { limit, page };

                const headers = {
                    'X-Template-Options': JSON.stringify({
                        viewport,
                        polymorphic: true,
                        include_id: Boolean(opts.include_id)
                    }),
                    'X-Query-Options': JSON.stringify({ sort }),
                    'X-Query-Selector': JSON.stringify(opts.selector || {})
                };

                const request = ['setup', 'data_type', this.id, 'digest'];

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

    list(opts = {}) {
        return API.get('setup', 'data_type', this.id, 'digest', opts);
    }

    distinct(field, opts = {}) {
        let selector = opts?.selector || {};
        return API.get('setup', 'data_type', this.id, `digest.distinct(${field})`, {
            headers: {
                'X-Query-Selector': JSON.stringify(selector)
            }
        });
    }

    titleViewport(...plus) {
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

    titlePropNames() {
        if (!this.__titleProps) {
            return this.getSchema().pipe(
                switchMap(
                    schema => {
                        if (schema.label) {
                            this.__titleProps = LiquidEngine.parse(schema.label).map(
                                template => (template.token.content || '').split('|')[0].trim()
                            ).filter(token => token.length);
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
                        return of(
                            item.title ||
                            (item.namespace && item.name && `${item.namespace} | ${item.name}`) ||
                            item.name || `${dtTitle} ${item.id || '(blank)'}`
                        );
                    })
                );
            })
        );
    }

    titlesFor(...items) {
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

    polymorphicTitlesFor(...items) {
        if (!this.type_name()) {
            return this.titlesFor(...items);
        }
        const typeHash = {};
        const indices = {};
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
        return zzip(...Object.keys(typeHash).map(type => this.findByName(type))).pipe(
            switchMap(dataTypes => zzip(...dataTypes.map(
                dataType => dataType.titlesFor(...typeHash[dataType.type_name()])
            )).pipe(
                map(titlesByType => {
                    const titles = [];
                    titlesByType.forEach((titleGroup, dataTypeIndex) => {
                        const type = dataTypes[dataTypeIndex].type_name();
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

    computeTitlesFor(...items) {
        return zzip(this.getSchema(), this.titleProps()).pipe(
            switchMap(
                ([schema, titleProps]) => {
                    const missingProps = {};

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
                    let completeItems;
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
                                    dtTitle => zzip(...items.map(item => {
                                            if (schema.label) {
                                                return from(LiquidEngine.parseAndRender(schema.label, item));
                                            }
                                            let { title, origin } = item;
                                            if (!title) {
                                                const { namespace, name } = item;
                                                if (namespace && name) {
                                                    title = `${namespace} | ${name}`
                                                } else {
                                                    title = name || `${dtTitle} ${item.id || '(blank)'}`;
                                                }
                                            }
                                            if (origin !== undefined && origin !== 'default') {
                                                title = `${title} [${origin}]`
                                            }
                                            return of(title);
                                        })
                                    )
                                )
                            );
                        })
                    );
                }
            )
        );
    }

    post(data, opts = {}) {
        const { viewport, add_only, add_new, polymorphic } = opts;
        opts = { headers: {} };
        let templateOptions;
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

    get(id, opts = {}) {
        const { viewport, jsonPath, with_references, include_id } = opts;
        const include_blanks = opts.hasOwnProperty('include_blanks') ? opts.include_blanks : true;
        const templateOptions = { include_blanks };
        opts = { headers: { 'X-Record-Id': id } };
        if (viewport) {
            templateOptions.viewport = viewport;
        }
        if (with_references) {
            templateOptions.with_references = with_references;
        }
        if (include_id) {
            templateOptions.include_id = true;
        }
        opts.headers['X-Template-Options'] = JSON.stringify(templateOptions);
        if (jsonPath) {
            opts.headers['X-JSON-Path'] = jsonPath;
        }
        return API.get('setup', 'data_type', this.id, 'digest', opts);
    }

    delete(_id) {
        return this.bulkDelete({ _id });
    }

    bulkDelete(selector) {
        return API.delete('setup', 'data_type', this.id, 'digest', {
            headers: { 'X-Query-Selector': JSON.stringify(selector) }
        });
    }

    shallowViewPort(...properties) {
        let viewportProps;
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
                props => zzip(
                    ...props.map(
                        p => p.isModel().pipe(
                            switchMap(model => (model && p.dataType.titleViewport('_id')) || of(''))
                        )
                    )
                ).pipe(
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

    config() {
        let config = this[ConfigSymbol];
        if (config) {
            if (!isObservable(config)) {
                config = of(config);
            }
        } else if (this.id !== undefined) {
            let path = (this.namespace || '')
                .split('::')
                .join('/');
            if (path) {
                path = `${path}/${this.name}`;
            } else {
                path = this.name;
            }
            this[ConfigSymbol] = config = from(
                import(`../config/dataTypes/${path}.js`)
            ).pipe(
                map(mod => mod.default),
                catchError(e => of({})),
                tap(config => {
                    this[ConfigSymbol] = config;
                })
            );
        } else {
            config = of({});
        }
        return config;
    }
}

export class FileDataType extends DataType {

    upload(data, opts = {}) {
        const { id, filename, onUploadProgress, cancelToken } = opts;
        opts = { headers: {}, onUploadProgress, cancelToken };

        let digestOpts;
        if (id) {
            digestOpts = { id };
        }
        if (filename) {
            digestOpts = { ...digestOpts, filename };
        }
        if (digestOpts) {
            opts.headers['X-Digest-Options'] = JSON.stringify(digestOpts);
        }

        const formData = new FormData();
        formData.append('data', data);

        opts.headers['Content-Type'] = 'multipart/form-data';

        return API.post('setup', 'data_type', this.id, 'digest', 'upload', opts, formData);
    }

    config() {
        return of(FileDataTypeConfig).pipe(
            map(config => ({ title: titleize(this.name), ...config }))
        );
    }
}

export class Property {

    constructor(attrs = {}) {
        Object.keys(attrs).forEach(attr => this[attr] = attrs[attr]);
    }

    viewportToken() {
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

    isReferenced() {
        return this.getSchema().pipe(map(schema => schema['referenced']));
    }

    isMany() {
        return this.getSchema().pipe(map(schema => schema['type'] === 'array'));
    }

    isTypeMany() {
        return this.type?.includes('Many')
    }

    getTitle() {
        return this.getSchema().pipe(
            switchMap(schema => {
                const title = schema['title'];
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

export const JSON_TYPE = 'Setup::JsonDataType';
export const FILE_TYPE = 'Setup::FileDataType';
export const CENIT_TYPE = 'Setup::CenitDataType';


const DECORATOR_PROPS = [
    'types',
    'contextual_params',
    'data',
    'filter',
    'group',
    'xml',
    'unique',
    'title',
    'description',
    'edi',
    'format',
    'example',
    'enum',
    'readOnly',
    'default',
    'visible',
    'referenced_by',
    'export_embedded',
    'exclusive'
];
