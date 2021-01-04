import React from 'react';
import FlowFilledIcon from "../../../icons/FlowFilledIcon";
import FlowFormControl from "../../../components/FlowFormControl";
import AutocompleteControl from "../../../components/AutocompleteControl";
import { justOneParameterSelector } from "./JsonDataType";

export default {
    title: 'Flow',
    icon: <FlowFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'description', 'active', 'event', 'translator', 'updated_at']
        },
        new: {
            fields: [
                'namespace', 'name', 'description', 'event', 'translator',
                'custom_data_type', 'data_type_scope', 'scope_filter', 'scope_evaluator', 'lot_size',
                'webhook', 'authorization', 'connection_role', 'before_submit',
                'response_translator', 'response_data_type', 'discard_events',
                'notify_request', 'notify_response',
                'active', 'auto_retry', 'after_process_callbacks'
            ]
        }
    },
    formControl: FlowFormControl,
    fields: {
        event: {
            controlProps: {
                editDisabled: true
            }
        },
        translator: {
            controlProps: {
                editDisabled: true
            }
        },
        data_type_scope: {
            control: AutocompleteControl
        },
        response_translator: {
            selector: { type: 'Import' }
        },
        after_process_callbacks: {
            selector: justOneParameterSelector
        }
    },
    groups: {
        request_and_response: {
            activeByDefault: true,
            title: 'Request & Response',
            fields: [
                'webhook', 'authorization', 'connection_role', 'before_submit',
                'response_translator', 'response_data_type', 'discard_events',
                'notify_request', 'notify_response'
            ]
        },
        behavior: {
            activeByDefault: true,
            fields: ['active', 'auto_retry', 'after_process_callbacks']
        }
    }
};
