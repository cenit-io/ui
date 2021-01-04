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
        }
    },
    formControl: FlowFormControl,
    fields: {
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
            title: 'Request & Response',
            fields: [
                'webhook', 'authorization', 'connection_role', 'before_submit',
                'response_translator', 'response_data_type', 'discard_events',
                'notify_request', 'notify_response'
            ]
        },
        behavior: {
            title: 'Request & Response',
            fields: ['active', 'auto_retry', 'after_process_callbacks']
        }
    }
};
