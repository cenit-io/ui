import React from 'react';
import SharedCollectionFilledIcon from "../../../icons/SharedCollectionFilledIcon";
import CollectionsView from "../../../components/CollectionsView";
import { CRUD } from "../../../actions/ActionRegistry";

export default {
    title: 'Shared Collection',
    icon: <SharedCollectionFilledIcon/>,
    actions: {
        index: {
            fields: ['name', 'title', 'summary', 'updated_at'],
            viewComponent: CollectionsView
        },
        edit: {
            fields: ['name', 'title', 'summary', 'pull_parameters']
        }
    },
    crud: [CRUD.read, CRUD.update, CRUD.delete]
};
