import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";
import InfoIcon from "@material-ui/icons/Info";
import PendingIcon from "@material-ui/icons/PendingActions";
import RunningIcon from "@material-ui/icons/RunCircle";
import FailedIcon from "@material-ui/icons/HighlightOff";
import CompletedIcon from "@material-ui/icons/AssignmentTurnedIn";
import RetryingIcon from "@material-ui/icons/Replay";
import BrokenIcon from "@material-ui/icons/BrokenImage";
import UnscheduleIcon from "@material-ui/icons/UpdateDisabled";
import PausedIcon from "@material-ui/icons/PauseCircleOutline";

const fields = [
    '_type', 'description', 'status', 'scheduler', 'attempts', 'succeded',
    'retries', 'progress', 'updated_at'
];

export const TaskStatusConfig = {
    pending: {
        mainIcon: PendingIcon
    },
    running: {
        mainIcon: RunningIcon
    },
    failed: {
        mainIcon: FailedIcon,
        background: theme => theme.palette.error.light,
        smallIconColor: theme => theme.palette.error.main,
        level: 'error'
    },
    completed: {
        mainIcon: CompletedIcon,
        background: theme => theme.palette.success.light,
        smallIconColor: theme => theme.palette.success.main,
        level: 'info'
    },
    retrying: {
        mainIcon: RetryingIcon
    },
    broken: {
        mainIcon: BrokenIcon,
        background: theme => theme.palette.error.light,
        smallIconColor: theme => theme.palette.error.main,
        level: 'error'
    },
    unscheduled: {
        mainIcon: UnscheduleIcon,
        background: theme => theme.palette.warning.light,
        smallIconColor: theme => theme.palette.warning.main,
        level: 'warning'
    },
    paused: {
        mainIcon: PausedIcon
    },
    default: {
        mainIcon: InfoIcon,
        smallIcon: InfoIcon,
        background: theme => theme.palette.info.light,
        smallIconColor: theme => theme.palette.info.main
    }
};

export const TaskStatusViewer = ErrorLevelViewer(
    ({ status }) => TaskStatusConfig[status]?.level || 'notice',
    'background'
);

export default {
    title: 'Task',
    actions: {
        index: { fields },
        new: { fields }
    },
    viewers: {
        status: TaskStatusViewer
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
        "name": "SharedCollectionReinstall"
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
