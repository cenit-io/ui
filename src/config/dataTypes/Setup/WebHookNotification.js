import React from 'react';
import { arrayDiff } from "../../../common/arrays";
import { deepMergeObjectsOnly } from "../../../common/merge";
import { Hidden, NotHidden } from "../../../common/constants";
import WebhookFilledIcon from "../../../icons/WebhookFilledIcon";

const fields = [
    'namespace', 'name', 'active', 'data_type', 'observers', 'url', 'hook_method',
    'transformation', 'template_options'
];

export default {
    title: 'Web-Hook Notification',
    icon: <WebhookFilledIcon component="svg"/>,
    actions: {
        index: {
            fields: [...arrayDiff(fields, 'transformation'), 'updated_at']
        },
        new: {
            fields,
            seed: {
                observers: []
            }
        }
    },
    fields: {
        data_type: {
            controlProps: {
                deleteDisabled: true
            }
        },
        observers: {
            ...Hidden,
            title: 'Triggers',
            newSeed: value => {
                const formValue = value.parent;
                const data_type = formValue.propertyValue('data_type').get();
                return { data_type };
            }
        },
        url: Hidden,
        hook_method: Hidden,
        transformation: {
            ...Hidden,
            title: 'Template',
            newSeed: value => {
                const formValue = value.parent;
                const source_data_type = formValue.propertyValue('data_type').get();
                return { source_data_type };
            }
        },
        template_options: Hidden
    },
    dynamicConfig: ({ id, data_type, email_data_type }, state) => {
        let changed;
        if ((id || data_type) && state.observers?.hidden !== false) {
            state = deepMergeObjectsOnly(state, {
                observers: NotHidden,
                url: NotHidden,
                hook_method: NotHidden,
                transformation: NotHidden,
                template_options: NotHidden
            });
            changed = true;
        }
        if (data_type && state.data_type_id !== data_type.id) {
            state = deepMergeObjectsOnly(state, {
                data_type_id: data_type.id,
                observers: {
                    selector: {
                        data_type_id: data_type.id
                    }
                },
                transformation: {
                    selector: {
                        $or: [
                            {
                                type: 'Export',
                                source_data_type_id: data_type.id
                            },
                            {
                                type: 'Export',
                                source_data_type_id: null
                            },
                            {
                                type: 'Export',
                                source_data_type_id: { $exists: false }
                            }
                        ]
                    }
                }
            });
            changed = true
        }
        if (changed) {
            return state;
        }
    }
};
