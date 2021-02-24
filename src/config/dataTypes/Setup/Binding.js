import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import recordViewer from "../../../viewers/recordViewer";
import BindingIcon from "@material-ui/icons/Settings";

const BinderProperties = [
    'flow_binder', 'connection_binder', 'webhook_binder', 'algorithm_binder',
    'translator_binder', 'data_type_binder', 'validator_binder'
];

const BindProperties = [
    'authorization_bind', 'event_bind', 'connection_role_bind', 'snippet_bind'
];

const BindingProperties = [...BinderProperties, ...BindProperties];

const Hidden = { hidden: true };
const NotHidden = { hidden: false };

export default {
    title: 'Binding',
    icon: <BindingIcon component="svg"/>,
    actions: {
        index: {
            fields: ['binder_data_type', 'binder', 'bind_data_type', 'bind', 'updated_at']
        }
    },
    fields: {
        ...BindingProperties.reduce((config, prop) => (config[prop] = Hidden) && config, {})
    },
    viewers: {
        binder: recordViewer(p => p?.binder_data_type),
        bind: recordViewer(p => p?.bind_data_type)
    },
    dynamicConfig: (value, state) => {
        const newState = {};
        BindingProperties.filter(p => value.hasOwnProperty(p)).forEach(prop => {
            if (!state[prop]) {
                newState[prop] = NotHidden;
            }
        });
        if (Object.keys(newState).length) {
            return { ...state, ...newState };
        }
    },
    crud: [CRUD.read, CRUD.delete]
};
