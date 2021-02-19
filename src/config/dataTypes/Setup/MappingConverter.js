import React from "react";
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";
import { DataType } from "../../../services/DataTypeService";
import JsonControl from "../../../components/JsonControl";
import EmbedsOneControl from "../../../components/EmbedsOneControl";
import { switchMap, map } from "rxjs/operators";
import zzip from "../../../util/zzip";
import Random from "../../../util/Random";
import { formConfigProperties } from "../../../components/ObjectControl";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";

const SourceDataTypeID = Symbol.for('source_data_type_id');
const TargetDataTypeID = Symbol.for('target_data_type_id');
const JsonMapping = Symbol.for('json_mapping');

function dynamicConfig({ source_data_type, target_data_type }, state) {
    if (source_data_type?.id && target_data_type?.id) {
        if (
            state[SourceDataTypeID] !== source_data_type.id ||
            state[TargetDataTypeID] !== target_data_type.id
        ) {
            return DataType.getById(target_data_type.id).pipe(
                switchMap(
                    targetDataType => formConfigProperties(targetDataType).pipe(
                        switchMap(
                            ([, props]) => zzip(
                                ...props.map(
                                    p => p.isModel()
                                )
                            ).pipe(
                                map(modelProps => {
                                    const properties = {};
                                    const modelPropsEnum = ['$', ...props.filter(
                                        (_, index) => modelProps[index]
                                    ).map(({ name }) => name)];
                                    props.forEach((prop, index) => {
                                        if (modelProps[index]) {
                                            properties[prop.name] = {
                                                type: 'object',
                                                properties: {
                                                    source: {
                                                        type: 'string',
                                                        enum: modelPropsEnum
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
                                            properties[prop.name] = { type: 'string' }
                                        }
                                    });
                                    return {
                                        [SourceDataTypeID]: source_data_type.id,
                                        [TargetDataTypeID]: target_data_type.id,
                                        mapping: {
                                            key: Random.string(),
                                            control: EmbedsOneControl,
                                            controlProps: {
                                                dataType: DataType.from({
                                                    name: 'Mapping',
                                                    schema: {
                                                        type: 'object',
                                                        properties
                                                    }
                                                })
                                            }
                                        }
                                    };
                                })
                            )
                        )
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
