import React from 'react';
import EmailNotificationIcon from "@material-ui/icons/ForwardToInbox";
import { arrayDiff } from "../../../common/arrays";
import API from "../../../services/ApiService";
import { map } from "rxjs/operators";
import { deepMergeObjectsOnly } from "../../../common/merge";
import { Hidden, NotHidden } from "../../../common/constants";
import ViewerControl from "../../../components/ViewerControl";

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
                    const seed = {
                        observers: []
                    };
                    if (data) {
                        const { id, namespace, name } = data;
                        seed.email_data_type = { _reference: true, id, namespace, name };
                    }
                    return seed;
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
            ...Hidden,
            title: 'Triggers',
            newSeed: value => {
                const formValue = value.parent;
                const data_type = formValue.propertyValue('data_type').get();
                return { data_type };
            },
            formConfig: () => ({ fields: { data_type: { control: ViewerControl } } })
        },
        transformation: {
            ...Hidden,
            newSeed: (value, dataType) => {
                const formValue = value.parent;
                const source_data_type = formValue.propertyValue('data_type').get();
                let target_data_type;
                if (dataType && dataType.name.includes('Converter')) {
                    target_data_type = formValue.propertyValue('email_data_type').get();
                }
                return { source_data_type, target_data_type };
            },
            typesFilter: dataTypes => dataTypes.filter(
                ({ name }) => name.includes('Template') || name.includes('Converter')
            ),
            formConfig: dataType => {
                const config = { fields: { source_data_type: { control: ViewerControl } } };
                if (dataType.name.includes('Converter')) {
                    config.fields.target_data_type = { control: ViewerControl };
                }
                return config;
            }
        },
        email_channel: {
            ...Hidden,
            title: 'E-Mail Channel'
        },
        email_data_type: {
            ...Hidden,
            title: 'Type',
            controlProps: {
                deleteDisabled: true,
                editDisabled: true
            }
        }
    },
    dynamicConfig: ({ id, data_type, email_data_type }, state) => {
        let changed;
        if ((id || data_type) && state.observers?.hidden !== false) {
            state = deepMergeObjectsOnly(state, {
                observers: NotHidden,
                transformation: NotHidden,
                email_channel: NotHidden,
                email_data_type: NotHidden
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
                                source_data_type_id: `$oid#${data_type.id}`
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
                                source_data_type_id: `$oid#${data_type.id}`,
                                target_data_type_id: `$oid#${email_data_type.id}`
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
