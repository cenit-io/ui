import React from 'react';
import ConfigIcon from "@material-ui/icons/Settings";

const fields = ['flow', 'active', 'auto_retry', 'notify_request', 'notify_response', 'discard_events'];

export default {
    title: 'Flow Config',
    icon: <ConfigIcon component="svg"/>,
    actions: {
        index: {
            fields: [...fields, 'updated_at']
        },
        new: { fields },
        edit: {
            viewport: '{flow {namespace name} active auto_retry notify_request notify_response discard_events}'
        }
    },
    fields: {
        flow: {
            controlProps: {
                addDisabled: true
            }
        }
    },
    dynamicConfig: ({ id, flow }, state) => {
        if (id && !state.flow?.readOnly) {
            return {
                flow: {
                    readOnly: true
                }
            };
        }
    }
};
