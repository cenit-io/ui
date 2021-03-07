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

const JsonMapping = Symbol.for('json_mapping');

const idDescription = 'Match an existing ID to update an existing record';

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
                        ...sourceProps.map(p => p.isModel())
                    ),
                    zzip(
                        ...targetProps.map(p => p.isModel())
                    )
                    ).pipe(
                    map(([sourceModelFlags, targetModelFlags]) => [
                        targetModelFlags,
                        sourceProps.filter((_, index) => sourceModelFlags[index]),
                        targetProps.filter((_, index) => targetModelFlags[index])
                    ]),
                    map(([targetModelFlags, sourceModelProps, targetModelProps]) => {
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
                        let properties = {};
                        const config = { fields: { id: { readOnly: false } } };
                        if (targetDataType._type === FILE_TYPE) {
                            properties = {
                                id: {
                                    type: 'string',
                                    description: idDescription
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
                            filePlainProperties.forEach(p => config.fields[p] = autoSuggestProps);
                            config.fields.data = { controlProps: { fetched: true } };
                        } else {
                            targetProps.forEach(({ name }, index) => {
                                if (targetModelFlags[index]) {
                                    config.fields[name] = { controlProps: { fetched: true } };
                                    properties[name] = {
                                        label: `${titleize(name)} mapping`,
                                        ...subMappingSchema
                                    }
                                } else {
                                    properties[name] = { type: 'string' };
                                    if (name === 'id' || name === '_id') {
                                        properties[name].description = idDescription;
                                        config.fields[name].controlProps = autoSuggestProps.controlProps;
                                    } else {
                                        config.fields[name] = autoSuggestProps
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
