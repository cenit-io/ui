import React from "react";
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";
import { DataType, FILE_TYPE } from "../../../services/DataTypeService";
import JsonControl from "../../../components/JsonControl";
import EmbedsOneControl from "../../../components/EmbedsOneControl";
import { switchMap, map } from "rxjs/operators";
import zzip from "../../../util/zzip";
import Random from "../../../util/Random";
import { formConfigProperties } from "../../../components/ObjectControl";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { Config } from "../../../common/Symbols";
import { of } from "rxjs";
import { titleize } from "../../../common/strutls";
import ViewerControl from "../../../components/ViewerControl";

const JsonMapping = Symbol.for('json_mapping');

const idDescription = 'Match an existing ID to update a record';

const filePlainProperties = ['id', 'filename', 'contentType'];

function dynamicConfig({ source_data_type, target_data_type }, state) {
    if (source_data_type?.id && target_data_type?.id) {
        if (
            state.source_data_type_id !== source_data_type.id ||
            state.target_data_type_id !== target_data_type.id
        ) {
            return zzip(
                DataType.getById(source_data_type.id),
                DataType.getById(target_data_type.id)
            ).pipe(
                switchMap(
                    dts => zzip(
                        ...dts.map(dt => of(dt)),
                        ...dts.map(dt => formConfigProperties(dt))
                    )
                ),
                switchMap(([sourceDataType, targetDataType, [, sourceProps], [, targetProps]]) => zzip(
                    zzip(
                        ...sourceProps.map(p => p.isModel(true))
                    ),
                    zzip(
                        ...targetProps.map(p => p.isModel(true))
                    )
                    ).pipe(
                    map(([sourceModelFlags, targetModelFlags]) => [
                        targetModelFlags,
                        sourceProps.filter((prop, index) => sourceModelFlags[index]),
                        targetProps.filter((_, index) => targetModelFlags[index])
                    ]),
                    map(([targetModelFlags, sourceModelProps]) => {
                        const autoSuggestProps = {
                            controlProps: {
                                autoSuggest: {
                                    anchor: '{{',
                                    values: sourceProps.map(({ name }) => name),
                                    tail: '}}'
                                }
                            }
                        };
                        const sourceModelPropsEnum = ['$', ...sourceModelProps.map(({ name }) => name)];
                        const subMappingSchema = {
                            type: 'object',
                            properties: {
                                source: {
                                    type: 'string',
                                    enum: sourceModelPropsEnum,
                                    default: '$'
                                },
                                transformation: {
                                    referenced: true,
                                    $ref: {
                                        namespace: 'Setup', name: 'Translator'
                                    }
                                },
                                options: {
                                    type: 'string'
                                }
                            }
                        };
                        let properties = {
                            id: {
                                type: 'string',
                                description: idDescription
                            }
                        };
                        const config = {
                            fields: {
                                id: {
                                    readOnly: false,
                                    controlProps: autoSuggestProps.controlProps
                                }
                            }
                        };
                        if (targetDataType._type === FILE_TYPE) {
                            properties = {
                                id: {
                                    type: 'string',
                                    description: idDescription
                                },
                                filename: {
                                    type: 'string',
                                    title: 'File name'
                                },
                                contentType: {
                                    title: 'Content Type',
                                    type: 'string'
                                },
                                data: {
                                    type: 'object',
                                    label: 'Data mapping',
                                    properties: {
                                        source: {
                                            type: 'string',
                                            enum: sourceModelPropsEnum,
                                            default: '$'
                                        },
                                        transformation: {
                                            referenced: true,
                                            $ref: {
                                                namespace: 'Setup', name: 'Template'
                                            }
                                        },
                                        options: {
                                            type: 'string'
                                        }
                                    }
                                }
                            };
                            filePlainProperties.forEach(p => config.fields[p] = autoSuggestProps);
                            config.fields.id = { readOnly: false };
                            config.fields.data = {
                                controlProps: {
                                    fetched: true,
                                    config: {
                                        fields: {
                                            source: {
                                                controlProps: {
                                                    deleteDisabled: true
                                                }
                                            },
                                            transformation: {
                                                title: 'Template',
                                                typesFilter: dataTypes => dataTypes.filter(
                                                    ({ name }) => name.includes('Template')
                                                ),
                                                newSeed: (value, dataType) => {
                                                    const formValue = value.parent;
                                                    const source = formValue.propertyValue('source').get();
                                                    let source_data_type = source === '$'
                                                        ? sourceDataType
                                                        : sourceProps.find(({ name }) => name === source)?.dataType;
                                                    return { source_data_type };
                                                },
                                                formConfig: {
                                                    fields: {
                                                        source_data_type: { control: ViewerControl }
                                                    }
                                                },
                                                controlProps: {
                                                    deleteDisabled: true
                                                }
                                            }
                                        },
                                        dynamicConfig: ({ source }, state) => {
                                            if (state.source_key !== source) {
                                                let sourceProp;
                                                let dataType;
                                                if (source === '$') {
                                                    dataType = sourceDataType;
                                                } else {
                                                    sourceProp = sourceProps.find(
                                                        ({ name }) => name === source
                                                    );
                                                    dataType = sourceProp.dataType;
                                                }
                                                let selector = {
                                                    $or: [
                                                        { source_data_type_id: dataType.id },
                                                        { source_data_type_id: null },
                                                        { source_data_type_id: { $exists: false } }
                                                    ]
                                                };
                                                let description;
                                                if (sourceProp?.isTypeMany()) {
                                                    description = `Define the file data from a bulk source template for ${dataType.name}`
                                                    selector = { $and: [selector, { bulk_source: true }] }
                                                } else {
                                                    description = `Define the file data from a template for ${dataType.name}`
                                                }
                                                return {
                                                    source_key: source,
                                                    transformation: {
                                                        selector,
                                                        description
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            };
                        } else {
                            const subMappingConfigFor = prop => ({
                                controlProps: {
                                    fetched: true,
                                    config: {
                                        fields: {
                                            source: {
                                                controlProps: {
                                                    deleteDisabled: true
                                                }
                                            },
                                            transformation: {
                                                typesFilter: dataTypes => dataTypes.filter( // TODO Exclude XSLT template when bulk source
                                                    ({ name }) => name.includes('Template') || name.includes('Converter')
                                                ),
                                                newSeed: (value, transformationDataType) => {
                                                    const formValue = value.parent;
                                                    const source = formValue.propertyValue('source').get();
                                                    let sourceProp;
                                                    let source_data_type;
                                                    if (source === '$') {
                                                        source_data_type = sourceDataType;
                                                    } else {
                                                        sourceProp = sourceProps.find(
                                                            ({ name }) => name === source
                                                        );
                                                        source_data_type = sourceProp.dataType;
                                                    }
                                                    source_data_type = source_data_type.asRef();
                                                    let bulk_source;
                                                    if (
                                                        transformationDataType.name.includes('Template') &&
                                                        sourceProp?.isTypeMany() && !prop.isTypeMany()
                                                    ) {
                                                        bulk_source = true;
                                                    }
                                                    let target_data_type;
                                                    if (transformationDataType.name.includes('Converter')) {
                                                        target_data_type = prop.dataType.asRef()
                                                    }
                                                    let source_handler;
                                                    if (transformationDataType.name === 'RubyConverter') {
                                                        source_handler = false;
                                                    }
                                                    return {
                                                        source_data_type,
                                                        target_data_type,
                                                        source_handler,
                                                        bulk_source
                                                    };
                                                },
                                                formConfig: (transformationDataType, value) => {
                                                    const source = value.parent.propertyValue('source').get();
                                                    let sourceProp;
                                                    if (source !== '$') {
                                                        sourceProp = sourceProps.find(
                                                            ({ name }) => name === source
                                                        );
                                                    }
                                                    let bulk_source;
                                                    if (
                                                        transformationDataType.name.includes('Template') &&
                                                        sourceProp?.isTypeMany() && !prop.isTypeMany()
                                                    ) {
                                                        bulk_source = { control: ViewerControl };
                                                    }
                                                    return {
                                                        fields: {
                                                            source_data_type: { control: ViewerControl },
                                                            target_data_type: { control: ViewerControl },
                                                            source_handler: { control: ViewerControl },
                                                            bulk_source
                                                        }
                                                    };
                                                },
                                                controlProps: {
                                                    deleteDisabled: true
                                                }
                                            }
                                        },
                                        dynamicConfig: ({ source }, state) => {
                                            if (state.source_key !== source) {
                                                let sourceProp;
                                                let dataType;
                                                if (source === '$') {
                                                    dataType = sourceDataType;
                                                } else {
                                                    sourceProp = sourceProps.find(
                                                        ({ name }) => name === source
                                                    );
                                                    dataType = sourceProp.dataType;
                                                }
                                                let bulk_source;
                                                if (sourceProp?.isTypeMany() && !prop.isTypeMany()) {
                                                    bulk_source = true;
                                                }
                                                let selector = {
                                                    $or: [
                                                        {
                                                            type: 'Export',
                                                            source_data_type_id: `$oid#${dataType.id}`,
                                                            bulk_source
                                                        },
                                                        {
                                                            type: 'Export',
                                                            source_data_type_id: null,
                                                            bulk_source
                                                        },
                                                        {
                                                            type: 'Export',
                                                            source_data_type_id: { $exists: false },
                                                            bulk_source
                                                        },
                                                        {
                                                            type: 'Conversion',
                                                            source_data_type_id: `$oid#${dataType.id}`,
                                                            target_data_type_id: `$oid#${prop.dataType.id}`,
                                                            source_handler: { $ne: true }
                                                        }
                                                    ]
                                                };
                                                let description = `Map ${dataType.name} (from ${source === '$' ? 'source' : source}) to ${prop.dataType.name} (${prop.name})`;
                                                if (bulk_source) {
                                                    description += ` with a bulk source transformation`;
                                                    selector = { $and: [selector, { bulk_source: true }] }
                                                }
                                                return {
                                                    source_key: source,
                                                    transformation: {
                                                        selector,
                                                        description
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                            targetProps.forEach((prop, index) => {
                                const { name } = prop;
                                if (targetModelFlags[index]) {
                                    properties[name] = {
                                        label: `${titleize(name)} mapping`,
                                        ...subMappingSchema
                                    }
                                    config.fields[name] = subMappingConfigFor(prop);
                                } else if (name !== 'id' && name !== '_id') {
                                    properties[name] = { type: 'string' };
                                    config.fields[name] = autoSuggestProps
                                }
                            });
                        }
                        return {
                            source_data_type_id: source_data_type.id,
                            target_data_type_id: target_data_type.id,
                            mapping: {
                                key: Random.string(),
                                control: EmbedsOneControl,
                                controlProps: {
                                    fetched: true,
                                    dataType: DataType.from({
                                        name: 'Mapping',
                                        schema: {
                                            type: 'object',
                                            label: 'Mapping',
                                            properties
                                        },
                                        [Config]: config
                                    })
                                }
                            }
                        };
                    })
                    )
                )
            );
        }
    } else {
        if (!state.hasOwnProperty(JsonMapping))
            return {
                [JsonMapping]: true,
                mapping: {
                    key: Random.string(),
                    control: JsonControl
                }
            }
    }
}

const fields = ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'mapping'];

export default {
    title: 'Mapping Converter',
    icon: <ConverterFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'updated_at']
        },
        new: {
            fields,
            seed: {
                mapping: {}
            }
        },
        edit: {
            viewportFields: [...fields, 'origin']
        }
    },
    orchestrator: sharedOriginFields(...fields),
    dynamicConfig
};
