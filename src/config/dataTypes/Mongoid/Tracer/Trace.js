import React from 'react';
import TraceTargetViewer from "../../../../viewers/TraceTargetViewer";
import TraceActionViewer from "../../../../viewers/TraceActionViewer";
import { CRUD } from "../../../../actions/ActionRegistry";
import ChangesSetControl from "../../../../components/ChangesSetControl";
import TraceIcon from "@material-ui/icons/HistoryEdu";
import ViewerControl from "../../../../components/ViewerControl";

const ActionProjection = t => t?.action;

export default {
    title: 'Trace',
    icon: <TraceIcon/>,
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
        data_type: {
            control: ViewerControl
        },
        target: {
            control: ViewerControl
        },
        action: {
            control: ViewerControl
        },
        message: {
            controlProps: {
                multiline: true
            }
        },
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
