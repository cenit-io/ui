import API from './ApiService';

const isSimpleSchema = schema => ['integer', 'number', 'string', 'boolean'].indexOf(schema['type']) !== -1;

export class DataType {

    static dataTypes = {}; // TODO Store data types cache using a pair key tenant.id -> dataType.id
    static criteria = {};

    static async getById(id) {
        let dataType = DataType.dataTypes[id];
        if (!dataType) {
            dataType = await API.get('setup', 'data_type', id, {
                headers: { 'X-Template-Options': JSON.stringify({ viewport: '{_id namespace name title _type schema}' }) }
            });
            if (dataType) {
                if (dataType._type === JSON_TYPE) delete dataType.schema;
                dataType.__proto__ = new DataType();
                DataType.dataTypes[id] = dataType;
            }
        }
        return dataType;
    }

    static async find(criteria) {
        const key = Object.keys(criteria).sort()
            .map(
                key => `${key}(${JSON.stringify(criteria[key])})`
            ).join();

        let id = DataType.criteria[key];

        if (id) {
            return this.getById(id);
        }

        const response = await API.get('setup', 'data_type', {
                params: { limit: 1 },
                headers: {
                    'X-Template-Options': JSON.stringify({ viewport: '{_id}' }),
                    'X-Query-Selector': JSON.stringify(criteria)
                }
            }),

            item = response && response['items'][0];

        if (item) {
            DataType.criteria[key] = item['id'];

            return this.getById(item['id']);
        }

        return null;
    }

    async getSchema() {
        if (!this.schema) {
            this.schema = await API.get('setup', 'data_type', this.id, 'digest', 'schema');
        }
        return this.schema;
    }

    async getProps() {
        if (!this.properties) {
            const schema = await this.getSchema();

            this.propertiesSchema = this.propertiesSchema || await this.mergeSchema(schema['properties'] || {});

            this.properties = await Promise.all(
                Object.keys(this.propertiesSchema).map(
                    property => this.propertyFrom(property, this.propertiesSchema[property])
                )
            );
        }
        return this.properties;
    }

    async queryProps() {
        let props = await this.getProps();
        return (await Promise.all(props.map(p => p.getSchema()))).map(
            (schema, index) => isSimpleSchema(schema) ? props[index] : null
        ).filter(p => p)
    }

    async titleProps() {
        const props = await this.getProps(),
            titlePropNames = await this.titlePropNames();
        return props.filter(p => titlePropNames.indexOf(p.name) > -1);
    }

    async visibleProps() {
        const props = await this.getProps();

        return (await Promise.all(props.map(prop => prop.isVisible())))
            .map((v, index) => v ? props[index] : null)
            .filter(p => p);
    }

    async mergeSchema(schema) {
        if (schema['extends'] || schema['$ref']) {
            return API.post('setup', 'data_type', this.id, 'digest', 'schema', schema);
        }
        return schema;
    }

    async getTitle() {
        const schema = (await this.getSchema());

        let title = schema && schema['title'];
        if (title) {
            return title.toString();
        }

        return this.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    async getSchemaEntry(key) {
        return (await this.getSchema())[key];
    }

    async propertyFrom(name, schema) {
        let ref, mergedSchema, dataType;
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
                    dataType = await DataType.find(ref);
                } else {
                    dataType = (await DataType.find({ namespace: this.namespace, name: ref })) ||
                        (await DataType.find({ name: ref }));
                }
            }
        }
        // Not referenced schema
        if (!dataType) {
            mergedSchema = (await this.mergeSchema(schema)) || {};
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
        }

        mergedSchema = await dataType.mergeSchema(schema);

        const prop = new Property();
        prop.name = name;
        prop.dataType = dataType;
        prop.propertySchema = mergedSchema;

        return prop;
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

    async find(query, opts = null) {
        const limit = (opts && opts.limit) || 5;
        const page = (opts && opts.page) || 1;
        query = (query || '').toString().trim();
        const params = { limit, page };
        const queryProps = await ((opts && opts.props) || this.titleProps());
        if (query.length > 0) {
            const orQuery = queryProps.map(
                prop => ({ [prop.name]: { '$regex': '(?i)' + query } })
            );
            params['$or'] = JSON.stringify(orQuery);
        }
        return (await API.get('setup', 'data_type', this.id, 'digest', {
            params,
            headers: {
                'X-Template-Options': JSON.stringify({
                    viewport: '{_id ' + queryProps.map(p => p.name).join(' ') + '}'
                })
            }
        })) || { items: [] };
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

    async titleFor(item) {
        return (await this.titlesFor(item))[0];
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

    post(data) {
        return API.post('setup', 'data_type', this.id, 'digest', data);
    }
}

export class Property {

    constructor(attrs = {}) {
        Object.keys(attrs).forEach(attr => this[attr] = attrs[attr]);
    }

    getSchema = async () => {
        if (this.propertySchema) {
            return this.propertySchema;
        }
        return this.dataType.getSchema();
    };

    getSchemaEntry = async key => {
        return (await this.getSchema())[key];
    };

    isVisible = async () => {
        const schema = await this.getSchema();

        return (!schema.hasOwnProperty('visible') || schema['visible']) &&
            (!schema.hasOwnProperty('edi') || (schema['edi'].constructor === Object && !schema['edi']['discard']));
    };

    isSimple = async () => this.isSimpleSchema(await this.getSchema());

    async isReferenced() {
        return (await this.getSchema())['referenced'];
    }

    async isMany() {
        return (await this.getSchema())['type'] === 'array';
    }

    async getTitle() {
        const schema = await this.getSchema();

        let title = schema['title'];
        if (title) {
            return title.toString();
        }

        return this.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
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
