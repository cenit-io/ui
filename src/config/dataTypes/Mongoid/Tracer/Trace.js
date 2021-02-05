import React from 'react';
import TraceTargetViewer from "../../../../viewers/TraceTargetViewer";
import TraceActionViewer from "../../../../viewers/TraceActionViewer";
import { CRUD } from "../../../../actions/ActionRegistry";
import ChangesSetControl from "../../../../components/ChangesSetControl";

const ActionProjection = ({ action }) => action;

export default {
    title: 'Trace',
    actions: {
        index: {
            fields: ['data_type', 'target', 'action', 'message', 'created_at'],
            viewport: '{_id data_type {id name title _id} target action created_at origin}'
        },
        new: {
            fields: ['data_type', 'target', 'action', 'message', 'created_at', 'changes_set']
        }
    },
    fields: {
        changes_set: {
            control: ChangesSetControl
        }
    },
    viewers: {
        target: TraceTargetViewer,
        action: TraceActionViewer(ActionProjection, 'background')
    },
    crud: [CRUD.read, CRUD.delete]
};
