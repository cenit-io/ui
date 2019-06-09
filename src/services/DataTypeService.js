import API from './ApiService';

export class DataType {

    static dataTypes = {};
    static promises = {};

    static getById(id) {
        let promise = DataType.promises[id];
        if (!promise) {
            DataType.promises[id] = promise = new Promise(
                (resolve, reject) => {
                    let dataType = DataType.dataTypes[id];
                    if (!dataType) {
                        API.get('setup', 'data_type', id, {
                            headers: { 'X-Template-Options': JSON.stringify({ viewport: '{_id namespace name title _type schema}' }) }
                        }).then(dataType => {
                            if (dataType._type === JSON_TYPE) delete dataType.schema;
                            dataType.__proto__ = new DataType();
                            DataType.promises[id] = dataType;
                            resolve(dataType);
                            delete DataType.promises[id];
                        }).catch(error => reject(error));
                    } else {
                        resolve(dataType);
                    }
                });
        }
        return promise;
    }

    static find(criteria) {
        return new Promise(
            (resolve, reject) => {
                API.get('setup', 'data_type', {
                    params: { limit: 1 },
                    headers: {
                        'X-Template-Options': JSON.stringify({ viewport: '{_id}' }),
                        'X-Query-Selector': JSON.stringify(criteria)
                    }
                }).then(
                    response => {
                        const item = response['items'][0];
                        if (item) {
                            this.getById(item['id'])
                                .then(dataType => resolve(dataType))
                                .catch(error => reject(error));
                        } else {
                            reject('Data type ref ' + JSON.stringify(criteria) + ' not found');
                        }
                    })
                    .catch(error => reject(error));
            });
    }

    getSchema() {
        if (!this.schemaPromise) {
            this.schemaPromise = new Promise(
                (resolve, reject) => {
                    if (this.schema) {
                        resolve(this.schema);
                    } else {
                        API.get('setup', 'data_type', this.id, 'digest', 'schema')
                            .then(
                                schema => {
                                    this.schema = schema;
                                    resolve(schema);
                                    this.schemaPromise = null;
                                })
                            .catch(
                                error => reject(error)
                            );
                    }
                }
            );
        }
        return this.schemaPromise;
    }

    getProps() {
        if (!this.propsPromise) {
            this.propsPromise = new Promise(
                (resolve, reject) => {
                    const handleError = error => reject(error);
                    if (this.properties) {
                        resolve(this.properties);
                        this.propsPromise = null;
                    } else {
                        this.getSchema()
                            .then(schema => {
                                this.mergeSchema(schema['properties'] || {}).then(
                                    propSchemas => {
                                        Promise.all(
                                            Object.keys(propSchemas).map(
                                                property => this.propertyFrom(property, propSchemas[property])
                                            )
                                        ).then(properties => {
                                            resolve(properties);
                                            this.propsPromise = null;
                                        })
                                            .catch(handleError);
                                    }
                                ).catch(handleError);
                            })
                            .catch(handleError);
                    }
                }
            );
        }
        return this.propsPromise;
    }

    async queryProps() {
        let props = await this.getProps();
        return (await Promise.all(props.map(p => p.getSchema()))).map(
            (schema, index) => schema['type'] === 'string' ? props[index] : null
        ).filter(p => p)
    }

    async titleProps() {
        const props = await this.getProps(),
            titlePropNames = await this.titlePropNames();
        return props.filter(p => titlePropNames.indexOf(p.name) > -1);
    }

    visibleProps() {
        return new Promise(
            (resolve, reject) => {
                this.getProps()
                    .then(
                        props => {
                            Promise.all(props.map(prop => prop.isVisible()))
                                .then(
                                    visibles => {
                                        resolve(
                                            visibles.map((v, index) => v ? props[index] : null)
                                                .filter(p => p)
                                        );
                                    }
                                )
                                .catch(error => reject(error));
                        }
                    )
                    .catch(error => reject(error));
            }
        );
    }

    mergeSchema(schema) {
        return new Promise(
            (resolve, reject) => {
                if (schema['extends'] || schema['$ref']) {
                    API.post('setup', 'data_type', this.id, 'digest', 'schema', schema)
                        .then(mergedSchema => resolve(mergedSchema))
                        .catch(error => reject(error));
                } else {
                    resolve(schema);
                }
            }
        );
    }

    getTitle() {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(
                        schema => {
                            let title = schema['title'];
                            if (title) {
                                resolve(title.toString());
                            } else {
                                resolve(this.name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
                            }
                        }
                    )
                    .catch(e => reject(e));
            }
        );
    }

    getSchemaEntry(key) {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(schema => resolve(schema[key]))
                    .catch(e => reject(e));
            }
        );
    }

    propertyFrom(name, schema) {
        return new Promise(
            (propResolve, propReject) => {
                let ref, resolveDataType;
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
                            resolveDataType = DataType.find(ref);
                        } else {
                            resolveDataType = new Promise(
                                (resolve, reject) => DataType.find({ namespace: this.namespace, name: ref })
                                    .then(dataType => resolve(dataType))
                                    .catch(
                                        () => DataType.find({ name: ref })
                                            .then(dataType => resolve(dataType))
                                            .catch(() => reject('Data type ref ' + JSON.stringify(ref) + ' not found'))
                                    )
                            );
                        }
                    }
                }
                // Not referenced schema
                if (!resolveDataType) {
                    resolveDataType = new Promise(
                        (resolve, reject) => {
                            this.mergeSchema(schema)
                                .then(
                                    mergedSchema => {
                                        let typeSchema;
                                        if (mergedSchema['type'] === 'array' && mergedSchema.hasOwnProperty('items')) {
                                            typeSchema = mergedSchema['items'];
                                        } else {
                                            typeSchema = mergedSchema;
                                        }
                                        let dataType = new DataType();
                                        dataType._type = JSON_TYPE;
                                        dataType.name = this.name + '::' + name;
                                        dataType.schema = typeSchema;
                                        resolve(dataType);
                                    }
                                )
                                .catch(err => reject(err));
                        }
                    );
                }
                resolveDataType.then(
                    dataType => {
                        dataType.mergeSchema(schema)
                            .then(
                                mergedSchema => {
                                    const prop = new Property();
                                    prop.name = name;
                                    prop.dataType = dataType;
                                    prop.propertySchema = mergedSchema;
                                    propResolve(prop);
                                }
                            )
                            .catch(error => propReject(error));
                    }
                ).catch(error => propReject(error));
            }
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

    async find(query) {
        const limit = 5;
        query = (query || '').toString().trim();
        const params = { limit };
        const queryProps = await this.titleProps();
        const orQuery = queryProps.map(
            prop => ({ [prop.name]: { '$regex': '(?i)' + query } })
        );
        params['$or'] = JSON.stringify(orQuery);
        return API.get('setup', 'data_type', this.id, 'digest', {
            params,
            headers: {
                'X-Template-Options': JSON.stringify({
                    viewport: '{_id ' + queryProps.map(p => p.name).join(' ') + '}'
                })
            }
        });
    }

    async titleViewPort() {
        return `{${(await this.titleProps()).map(p => p.name).join(' ')}}`;
    }

    async titlePropNames() {
        if (!this.__titleProps) {
            this.__titleProps = ['id', 'name', 'title'];
        }
        return this.__titleProps;
    }

    async titlesFor(...items) {
        items = [...items];

        const titleProps = await this.titleProps(),
            missingProps = {};

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
            completeItems = (
                await this.find({
                    params: { _id: { '$in': missingIds } },
                    headers: { 'X-Template-Options': JSON.stringify({ viewport: await this.titleViewPort() }) }
                })
            ).items;
        } else {
            completeItems = [];
        }

        for (let item of completeItems) {
            if (missingProps[item.id]) {
                for (let i of missingProps[item.id]) {
                    items[i] = item;
                }
            }
        }

        const dtTitle = await this.getTitle();

        return items.map(item => {
            let title = item.title || item.name;
            if (title) {
                return title;
            }
            return `${dtTitle} ${item.id}`;
        });
    }
}

export class Property {

    getSchema = () => {
        if (this.propertySchema) {
            return Promise.resolve(this.propertySchema);
        }
        return this.dataType.getSchema();
    };

    getSchemaEntry = key => {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(
                        schema => {
                            resolve(schema[key]);
                        }
                    )
                    .catch(e => reject(e));
            }
        );
    };

    isVisible = () => {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(
                        schema => resolve(
                            (!schema.hasOwnProperty('visible') || schema['visible']) &&
                            (!schema.hasOwnProperty('edi') || (schema['edi'].constructor === Object && !schema['edi']['discard']))
                        )
                    )
                    .catch(error => reject(error));
            }
        );
    };

    isSimple = () => {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(
                        schema => resolve(['integer', 'number', 'string', 'boolean'].indexOf(schema['type']) !== -1)
                    )
                    .catch(error => reject(error));
            }
        );
    };

    isReferenced() {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(
                        schema => resolve(schema['referenced'])
                    )
                    .catch(error => reject(error));
            }
        );
    }

    isMany() {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(
                        schema => resolve(schema['type'] === 'array')
                    )
                    .catch(error => reject(error));
            }
        );
    }

    getTitle() {
        return new Promise(
            (resolve, reject) => {
                this.getSchema()
                    .then(
                        schema => {
                            let title = schema['title'];
                            if (title) {
                                resolve(title.toString());
                            } else {
                                resolve(this.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
                            }
                        }
                    )
                    .catch(e => reject(e));
            }
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