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

const SourceDataTypeID = Symbol.for('source_data_type_id');
const TargetDataTypeID = Symbol.for('target_data_type_id');
const JsonMapping = Symbol.for('json_mapping');

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
                        ...sourceProps.map(p => p.isModel())
                    ),
                    zzip(
                        ...targetProps.map(p => p.isModel())
                    )
                    ).pipe(
                    map(([sourceModelFlags, targetModelFlags]) => [
                        sourceModelFlags,
                        sourceProps.filter((_, index) => sourceModelFlags[index]),
                        targetProps.filter((_, index) => targetModelFlags[index])
                    ]),
                    map(([sourceModelFlags, sourceModelProps, targetModelProps]) => {
                        const autoSuggest = {
                            anchor: '{{',
                            values: sourceProps.map(({ name }) => name),
                            tail: '}}'
                        };
                        const sourceModelPropsEnum = ['$', ...sourceModelProps.map(({ name }) => name)];
                        let properties = {};
                        const config = { fields: {} };
                        if (targetDataType._type === FILE_TYPE) {
                            properties = {
                                id: {
                                    type: 'string',
                                    description: 'Match an existing ID to update an existing record'
                                },
                                filename: {
                                    type: 'string'
                                },
                                contentType: {
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
                            config.fields.filename = { controlProps: { autoSuggest } };
                            config.fields.data = { controlProps: { fetched: true } };
                        } else {
                            targetProps.forEach(({ name }, index) => {
                                if (sourceModelFlags[index]) {
                                    config.fields[name] = { controlProps: { fetched: true } };
                                    properties[name] = {
                                        type: 'object',
                                        label: `${titleize(name)} mapping`,
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
                                    }
                                } else {
                                    properties[name] = { type: 'string' }
                                    if (name === 'id' || name === '_id') {
                                        properties[name].description = 'Match an existing ID to update an existing record';
                                    }
                                    config[name] = {
                                        controlProps: {
                                            autoSuggest
                                        }
                                    }
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
