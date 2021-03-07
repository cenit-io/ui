import React from 'react';
import recordViewer from "../../../viewers/recordViewer";
import SvgIcon from "@material-ui/core/SvgIcon";
import { CRUD } from "../../../actions/ActionRegistry";
import ViewerControl from "../../../components/ViewerControl";

const StorageIcon = props => (
    <SvgIcon {...props}>
        <path xmlns="http://www.w3.org/2000/svg"
              d="M15 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7l-5-5zM6 20V4h8v4h4v12H6zm10-10v5c0 2.21-1.79 4-4 4s-4-1.79-4-4V8.5c0-1.47 1.26-2.64 2.76-2.49 1.3.13 2.24 1.32 2.24 2.63V15h-2V8.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5V15c0 1.1.9 2 2 2s2-.9 2-2v-5h2z"/>
    </SvgIcon>
);

const fields = ['storer_data_type', 'storer_object', 'storer_property', 'contentType', 'length'];

export default {
    title: 'Storage',
    icon: <StorageIcon/>,
    actions: {
        index: { fields },
        edit: { fields }
    },
    fields: {
        storer_data_type: {
            control: ViewerControl
        },
        storer_object: {
            viewer: recordViewer(storage => storage?.storer_data_type),
            control: ViewerControl
        }
    },
    crud: [CRUD.read, CRUD.delete]
};
