import API from './ApiService';
import { from, Observable, of } from "rxjs";
import { map, share, switchMap, tap } from "rxjs/operators";
import zzip from "../util/zzip";
import FormContext from "./FormContext";
import LiquidEngine from "./LiquidEngine";
import { Config } from "./AuthorizationService";
import { Async } from "../common/Symbols";
import { deepMergeArrayConcat, deepMergeObjectsOnly } from "../common/merge";
import deepDup from "../common/deepDup";
import Hash from 'object-hash';

const isSimpleSchema = schema => ['integer', 'number', 'string', 'boolean'].indexOf(schema['type']) !== -1;

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

    static dataTypes = {}; // TODO Store data types cache using a pair key tenant.id -> dataType.id
    static criteria = {};
    static gets = {};

    static getById(id) {
        let dataType = DataType.dataTypes[id];
        if (dataType) {
            return of(dataType);
        }
        dataType = DataType.gets[id];
        if (!dataType) {
            dataType = API.get('setup', 'data_type', id, {
                headers: { 'X-Template-Options': JSON.stringify({ viewport: '{_id namespace name title _type schema}' }) }
            }).pipe(
                tap(dataType => {
                    if (dataType) {
                        if (dataType._type === JSON_TYPE) {
                            delete dataType.schema;
                        } else {
                            injectCommonProperties(dataType.schema);
                        }
                        if (dataType._type === FILE_TYPE) {
                            dataType.__proto__ = new FileDataType();
                        } else {
                            dataType.__proto__ = new DataType();
                        }
                        DataType.dataTypes[id] = dataType;
                    }
                    delete DataType.gets[id];
                    return dataType;
                }),
                share()
            );
        }

        DataType.gets[id] = dataType;
        return dataType;
    }

    static find(criteria) {
        let key = Object.keys(criteria).sort()
            .map(
                key => `${key}(${JSON.stringify(criteria[key])})`
            ).join();

        let id = DataType.criteria[key];

        if (id) {
            return this.getById(id);
        }

        key = `find_${key}`;

        let get = DataType.gets[key];

        if (!get) {
            get = API.get('setup', 'data_type', {
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
            );
            DataType.gets[key] = get;
        }

        return get;
    }

    type_name() {
        if (this._type === CENIT_TYPE) {
            if (this.namespace) {
                return `${this.namespace}::${this.name}`;
            }
            return this.name;
        }
        return `Dt${this.id}`;
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
                                if (isRef) { // Referenced
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

    queryProps() {
        return this.allProperties().pipe(
            switchMap(props => zzip(...props.map(p => p.getSchema())).pipe(
                map(
                    schemas => schemas.map(
                        (schema, index) => isSimpleSchema(schema) ? props[index] : null
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

    visibleProps() {
        return this.allProperties().pipe(
            switchMap(
                props => zzip(...props.map(prop => prop.isVisible())).pipe(
                    map(visible => visible.map((v, index) => v ? props[index] : null).filter(p => p))
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
        let ns = null;
        name = name.split('::');
        if (name.length > 1) {
            [name, ns] = [name.pop(), name];
            ns = ns.join('::');
        }
        return this.find_data_type(name, ns).pipe(
            switchMap(dataType => {
                if (!dataType && name.startsWith('Dt')) {
                    return DataType.getById(name.substring(3))
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
                ns_hash[ref] = dt;
                if (dt.namespace !== ns) {
                    ns_hash = this.nss[dt.namespace];
                    if (!ns_hash) {
                        ns_hash = this.nss[dt.namespace] = {};
                    }
                    ns_hash[ref] = dt;
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
        return this.getSchema().pipe(
            map(schema => {
                const title = schema && schema['title'];
                if (title) {
                    return title.toString();
                }
                return this.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
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
                    mergedSchema = dataType.mergeSchema(schema);
                } else {
                    mergedSchema = this.mergeSchema(schema).pipe(
                        map(mergedSchema => {
                            let typeSchema;
                            if (mergedSchema['type'] === 'array' && mergedSchema.hasOwnProperty('items')) {
                                typeSchema = mergedSchema['items'];
                            } else {
                                typeSchema = mergedSchema;
                            }
                            dataType = new DataType();
                            dataType._type = JSON_TYPE;
                            dataType.name = this.name + '::' + name;
                            dataType.schema = typeSchema;

                            return mergedSchema;
                        })
                    );
                }

                return mergedSchema.pipe(
                    map(mergedSchema => {
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

    find(query, opts = null) {
        const limit = opts?.limit || 5;
        const page = opts?.page || 1;
        const sort = opts?.sort || {};
        let selector = opts?.selector || {};
        query = query?.toString()?.trim() || '';
        const params = { limit, page };
        const props = opts?.props ||
            this.titleProps().pipe(
                switchMap(
                    titleProps => zzip(
                        ...titleProps.map(p => p.is('string')
                        )
                    ).pipe(
                        map(
                            strFlags => strFlags.map(
                                (flag, index) => flag && titleProps[index]).filter(p => p)
                        )
                    )
                )
            ); // TODO Query on other types than string and prevent no query props

        return props.pipe(
            switchMap(queryProps => {
                if (query.length > 0) {
                    const $or = queryProps.map(
                        prop => ({ [prop.name]: { '$regex': `(?i)${query}` } })
                    );
                    selector = {
                        $and: [
                            { $or },
                            selector
                        ]
                    };
                }
                return API.get('setup', 'data_type', this.id, 'digest', {
                    params,
                    headers: {
                        'X-Template-Options': JSON.stringify({
                            viewport: opts.viewport || (
                                '{_id ' + (opts.viewportProps || queryProps).map(p => p.name).join(' ') + '}'
                            ),
                            polymorphic: true
                        }),
                        'X-Query-Options': JSON.stringify({ sort }),
                        'X-Query-Selector': JSON.stringify(selector)
                    }
                }).pipe(map(response => response || { items: [] }));
            })
        );
    }

    list(opts = {}) {
        return API.get('setup', 'data_type', this.id, 'digest', opts);
    }

    titleViewPort(...plus) {
        return this.titleProps().pipe(
            map(props => `{${props.map(p => p.name).concat(plus).join(' ')}}`)
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
        return this.titlesFor(item).pipe(map(titles => titles[0]));
    }

    straightTitleFor(item) {
        return zzip(this.getSchema(), this.getTitle()).pipe(
            switchMap(
                ([schema, dtTitle]) => {
                    if (schema.label) {
                        return from(LiquidEngine.parseAndRender(schema.label, item));
                    }
                    let title = item.title || item.name;
                    if (title) {
                        return of(title);
                    }
                    return of(`${dtTitle} ${item.id || '(blank)'}`);
                })
        );
    }

    titlesFor(...items) {
        items = [...items];

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
                        completeItems = this.titleViewPort('_id').pipe(
                            switchMap(
                                viewport => this.list({
                                    params: { _id: { '$in': missingIds } },
                                    headers: { 'X-Template-Options': JSON.stringify({ viewport }) }
                                }).pipe(map(response => response.items))
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
                                            let title = item.title || item.name;
                                            if (title) {
                                                return of(title);
                                            }
                                            return of(`${dtTitle} ${item.id || '(blank)'}`);
                                        })
                                    )
                                )
                            );
                        })
                    );
                }
            )
        )
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
        const { viewport, jsonPath, with_references } = opts;
        const include_blanks = opts.hasOwnProperty('include_blanks') ? opts.include_blanks : true;
        const templateOptions = { include_blanks };
        opts = { headers: { 'X-Record-Id': id } };
        if (viewport) {
            templateOptions.viewport = viewport;
        }
        if (with_references) {
            templateOptions.with_references = with_references;
        }
        opts.headers['X-Template-Options'] = JSON.stringify(templateOptions);
        if (jsonPath) {
            opts.headers['X-JSON-Path'] = jsonPath;
        }
        return API.get('setup', 'data_type', this.id, 'digest', opts);
    }

    delete(selector) {
        return API.delete('setup', 'data_type', this.id, 'digest', {
            headers: { 'X-Query-Selector': JSON.stringify(selector) }
        });
    }

    shallowViewPort() {
        let properties;
        return this.visibleProps().pipe(
            tap(props => properties = props),
            switchMap(
                props => zzip(
                    ...props.map(
                        p => p.isSimple().pipe(
                            switchMap(simple => (simple && of('')) || p.dataType.titleViewPort('_id'))
                        )
                    )
                )
            ),
            map(
                childViewports => '{' + properties.map(
                    (prop, index) => `${prop.name} ${childViewports[index]}`
                ).join('') + '}'
            )
        );
    }

    shallowGet(id, opts = {}) {
        return this.shallowViewPort().pipe(
            switchMap(viewport => this.get(id, { viewport, ...opts }))
        );
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
}

export class Property {

    constructor(attrs = {}) {
        Object.keys(attrs).forEach(attr => this[attr] = attrs[attr]);
    }

    viewportToken() {
        return this.isSimple().pipe(
            switchMap(simple => {
                if (simple) {
                    return of(this.name);
                }
                return this.dataType.titleViewPort('_id').pipe(
                    map(viewport => `${this.name} ${viewport}`)
                );
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

    is = type => this.getSchema().pipe(map(schema => schema['type'] === type));

    isReferenced() {
        return this.getSchema().pipe(map(schema => schema['referenced']));
    }

    isMany() {
        return this.getSchema().pipe(map(schema => schema['type'] === 'array'));
    }

    getTitle() {
        return this.getSchema().pipe(
            switchMap(schema => {
                const title = schema['title'];
                if (title) {
                    return from(LiquidEngine.parseAndRender(title.toString(), this));
                }
                return of(this.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
            }));
    }

    isReadOnly(context) {
        return context === FormContext.edit && (this.name === '_id' || this.name === 'id');
    }

    isModel() {
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
