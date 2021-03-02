import React from 'react';
import EmailNotificationIcon from "@material-ui/icons/ForwardToInbox";
import { arrayDiff } from "../../../common/arrays";
import API from "../../../services/ApiService";
import { map } from "rxjs/operators";
import { deepMergeObjectsOnly } from "../../../common/merge";

const fields = [
    'namespace', 'name', 'active', 'data_type', 'observers', 'transformation',
    'email_channel', 'email_data_type'
];

export default {
    title: 'E-Mail Notification',
    icon: <EmailNotificationIcon component="svg"/>,
    actions: {
        index: {
            fields: [...arrayDiff(fields, 'transformation'), 'updated_at']
        },
        new: {
            fields,
            seed: dataType => API.get('setup', 'data_type', dataType.id, 'digest', 'email_data_type').pipe(
                map(data => {
                    if (data) {
                        const { id, namespace, name } = data;
                        return {
                            email_data_type: { _reference: true, id, namespace, name }
                        };
                    }
                    return {};
                })
            )
        }
    },
    fields: {
        data_type: {
            controlProps: {
                deleteDisabled: true
            }
        },
        observers: {
            controlProps: {
                disabled: true
            }
        },
        transformation: {
            controlProps: {
                disabled: true
            }
        },
        email_data_type: {
            controlProps: {
                deleteDisabled: true,
                editDisabled: true
            }
        }
    },
    dynamicConfig: ({ id, data_type, email_data_type }, state) => {
        let changed;
        if ((id || data_type) && state.observers?.controlProps?.disabled !== false) {
            state = deepMergeObjectsOnly(state, {
                observers: {
                    controlProps: {
                        disabled: false
                    }
                },
                transformation: {
                    controlProps: {
                        disabled: false
                    }
                }
            });
            changed = true;
        }
        if (data_type && email_data_type && (
            state.data_type_id !== data_type.id || state.email_data_type_id !== email_data_type.id
        )) {
            state = deepMergeObjectsOnly(state, {
                data_type_id: data_type.id,
                email_data_type_id: email_data_type.id,
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
                            },
                            {
                                type: 'Conversion',
                                source_data_type_id: data_type.id,
                                target_data_type_id: email_data_type.id
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
    },
    groups: {
        email_data_type: {
            title: 'e-mail type',
            variant: 'subtitle1',
            fields: ['email_data_type']
        }
    }
};
