import React from 'react';
import ConfigIcon from "@material-ui/icons/Settings";
import { FILE_TYPE } from "../../../services/DataTypeService";

export default {
    title: 'Type Config',
    icon: <ConfigIcon component="svg"/>,
    actions: {
        index: {
            fields: ['data_type', 'slug', 'trace_on_default', 'updated_at']
        },
        new: {
            fields: ['data_type', 'slug', 'trace_on_default']
        },
        edit: {
            viewport: '{data_type {namespace name} slug trace_on_default}'
        }
    },
    fields: {
        data_type: {
            controlProps: {
                addDisabled: true
            }
        }
    },
    dynamicConfig: ({ id, data_type, trace_on_default }, state, value) => {
        let newState;
        if (id && !state.data_type?.readOnly) {
            newState = {
                data_type: {
                    readOnly: true
                }
            };
        }
        if (!data_type || data_type._type === FILE_TYPE) {
            if (trace_on_default !== undefined && trace_on_default !== null) {
                value.propertyValue('trace_on_default').set(null, true);
            }
            if (!state.trace_on_default?.hidden) {
                newState = {
                    ...newState,
                    trace_on_default: {
                        hidden: true
                    }
                };
            }
        } else if (state.trace_on_default?.hidden) {
            newState = {
                ...newState,
                trace_on_default: {
                    hidden: false
                }
            };
        }
        if (newState && Object.keys(newState).length) {
            return {...state, ...newState};
        }
    }
};
