import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";

const fields = [
    '_type', 'description', 'scheduler', 'attempts', 'succeded', 'retries',
    'progress', 'status', 'updated_at'
];

export default {
    title: 'Task',
    actions: {
        index: { fields },
        new: { fields }
    },
    crud: [CRUD.read, CRUD.delete]
};


export const TasksHierarchy = [
    {
        "namespace": "Setup",
        "name": "Task"
    },
    {
        "namespace": "Setup",
        "name": "AsynchronousPersistence"
    },
    {
        "namespace": "Setup",
        "name": "BasePull"
    },
    {
        "namespace": "Setup",
        "name": "PullImport"
    },
    {
        "namespace": "Setup",
        "name": "SharedCollectionPull"
    },
    {
        "namespace": "Setup",
        "name": "ApiPull"
    },
    {
        "namespace": "",
        "name": "ScriptExecution"
    },
    {
        "namespace": "Setup",
        "name": "AlgorithmExecution"
    },
    {
        "namespace": "Setup",
        "name": "ApiSpecImport"
    },
    {
        "namespace": "Setup",
        "name": "CollectionSharing"
    },
    {
        "namespace": "Setup",
        "name": "CollectionShredding"
    },
    {
        "namespace": "Setup",
        "name": "Crossing"
    },
    {
        "namespace": "Setup",
        "name": "DataImport"
    },
    {
        "namespace": "Setup",
        "name": "DataTypeDigest"
    },
    {
        "namespace": "Setup",
        "name": "DataTypeExpansion"
    },
    {
        "namespace": "Setup",
        "name": "DataTypeGeneration"
    },
    {
        "namespace": "Setup",
        "name": "Deletion"
    },
    {
        "namespace": "Setup",
        "name": "FileStoreMigration"
    },
    {
        "namespace": "Setup",
        "name": "FlowExecution"
    },
    {
        "namespace": "Setup",
        "name": "NamespaceCollection"
    },
    {
        "namespace": "Setup",
        "name": "NotificationExecution"
    },
    {
        "namespace": "Setup",
        "name": "Push"
    },
    {
        "namespace": "Setup",
        "name": "SchemasImport"
    },
    {
        "namespace": "Setup",
        "name": "Submission"
    },
    {
        "namespace": "Setup",
        "name": "Translation"
    }
];
