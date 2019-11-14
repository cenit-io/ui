import API from './ApiService';
import { of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import zzip from "../util/zzip";

const isSimpleSchema = schema => ['integer', 'number', 'string', 'boolean'].indexOf(schema['type']) !== -1;

export class DataType {

    static dataTypes = {}; // TODO Store data types cache using a pair key tenant.id -> dataType.id
    static criteria = {};

    static getById(id) {
        const dataType = DataType.dataTypes[id];
        if (dataType) {
            return of(dataType);
        }
        return API.get('setup', 'data_type', id, {
            headers: { 'X-Template-Options': JSON.stringify({ viewport: '{_id namespace name title _type schema}' }) }
        }).pipe(
            map(dataType => {
                if (dataType) {
                    if (dataType._type === JSON_TYPE) delete dataType.schema;
                    dataType.__proto__ = new DataType();
                    DataType.dataTypes[id] = dataType;
                }
                return dataType;
            })
        );
    }

    static find(criteria) {
        const key = Object.keys(criteria).sort()
            .map(
                key => `${key}(${JSON.stringify(criteria[key])})`
            ).join();

        let id = DataType.criteria[key];

        if (id) {
            return this.getById(id);
        }

        return API.get('setup', 'data_type', {
            params: { limit: 1 },
            headers: {
                'X-Template-Options': JSON.stringify({ viewport: '{_id}' }),
                'X-Query-Selector': JSON.stringify(criteria)
            }
        }).pipe(
            switchMap(response => {
                const item = response && response['items'][0];

                if (item) {
                    DataType.criteria[key] = item['id'];

                    return this.getById(item['id']);
                }

                return of(null);
            })
        );
    }

    getSchema() {
        if (this.schema) {
            return of(this.schema);
        }

        return API.get('setup', 'data_type', this.id, 'digest', 'schema').pipe(
            map(schema => this.schema = schema)
        );
    }

    propertiesSchema() {
        if (this.propertiesSchemaCache) {
            return of(this.propertiesSchemaCache)
        }
        return this.getSchema().pipe(
            switchMap(
                schema => this.mergeSchema(schema['properties'] || {}).pipe(
                    map(propertiesSchema => this.propertiesSchemaCache = propertiesSchema)
                )
            )
        );
    }

    getProps() {
        if (this.properties) {
            return of(this.properties);
        }
        return this.propertiesSchema().pipe(
            switchMap(propertiesSchemas => zzip(
                ...Object.keys(propertiesSchemas).map(
                    property => this.propertyFrom(property, propertiesSchemas[property])
                )
            ).pipe(map(properties => this.properties = properties)))
        );
    }

    queryProps() {
        return this.getProps().pipe(
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
        return this.getProps().pipe(
            switchMap(
                props => this.titlePropNames().pipe(
                    map(titlePropNames => props.filter(p => titlePropNames.indexOf(p.name) > -1))
                )
            ));
    }

    visibleProps() {
        return this.getProps().pipe(
            switchMap(
                props => zzip(...props.map(prop => prop.isVisible())).pipe(
                    map(visible => visible.map((v, index) => v ? props[index] : null).filter(p => p))
                )
            ));
    }

    mergeSchema(schema) {
        if (schema['extends'] || schema['$ref']) {
            return API.post('setup', 'data_type', this.id, 'digest', 'schema', schema);
        }
        return of(schema);
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
                    dataType = DataType.find({ namespace: this.namespace, name: ref }).pipe(
                        switchMap(dt => (dt && of(dt)) || DataType.find({ name: ref }))
                    );
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
                        })
                    );
                }

                return mergedSchema.pipe(
                    map(mergedSchema => {
                        const prop = new Property();
                        prop.name = name;
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
        if (this.schema) {
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
        const limit = (opts && opts.limit) || 5;
        const page = (opts && opts.page) || 1;
        const sort = (opts && opts.sort) || {};
        query = (query || '').toString().trim();
        const params = { limit, page };
        const props = (opts && opts.props) || this.titleProps();

        return props.pipe(
            switchMap(queryProps => {
                if (query.length > 0) {
                    const orQuery = queryProps.map(
                        prop => ({ [prop.name]: { '$regex': '(?i)' + query } })
                    );
                    params['$or'] = JSON.stringify(orQuery);
                }
                return API.get('setup', 'data_type', this.id, 'digest', {
                    params,
                    headers: {
                        'X-Template-Options': JSON.stringify({
                            viewport: '{_id ' + queryProps.map(p => p.name).join(' ') + '}'
                        }),
                        'X-Query-Options': JSON.stringify({ sort })
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
            this.__titleProps = ['id', 'name', 'title'];
        }
        return of(this.__titleProps);
    }

    titleFor(item) {
        return this.titlesFor(item).pipe(map(titles => titles[0]));
    }

    titlesFor(...items) {
        items = [...items];

        return this.titleProps().pipe(
            switchMap(
                titleProps => {
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
                                map(
                                    dtTitle => items.map(item => {
                                        let title = item.title || item.name;
                                        if (title) {
                                            return title;
                                        }
                                        return `${dtTitle} ${item.id || '(blank)'}`;
                                    })
                                ));
                        })
                    );
                }
            )
        )
    }

    post(data, opts = {}) {
        const { viewport, add_only } = opts;
        opts = { headers: {} };
        if (viewport) {
            opts.headers['X-Template-Options'] = JSON.stringify({ viewport });
        }
        if (add_only) {
            opts.headers['X-Parser-Options'] = JSON.stringify({ add_only: true });
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

    shallowViewPort() {
        let properties;
        return this.getProps().pipe(
            map(props => properties = props),
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

export class Property {

    constructor(attrs = {}) {
        Object.keys(attrs).forEach(attr => this[attr] = attrs[attr]);
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

    isReferenced() {
        return this.getSchema().pipe(map(schema => schema['referenced']));
    }

    isMany() {
        return this.getSchema().pipe(map(schema => schema['type'] === 'array'));
    }

    getTitle() {
        return this.getSchema().pipe(map(schema => {
            const title = schema['title'];
            if (title) {
                return title.toString();
            }
            return this.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }));
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
