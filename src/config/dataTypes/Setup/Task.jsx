import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";
import InfoIcon from "@mui/icons-material/Info";
// import PendingIcon from "@mui/icons-material/PendingActions";
import PendingIcon from '@mui/icons-material/UpdateOutlined';
// import RunningIcon from "@mui/icons-material/RunCircle";
import RunningIcon from '@mui/icons-material/DirectionsRunOutlined';
import FailedIcon from "@mui/icons-material/HighlightOff";
import CompletedIcon from "@mui/icons-material/AssignmentTurnedIn";
import RetryingIcon from "@mui/icons-material/Replay";
import BrokenIcon from "@mui/icons-material/BrokenImage";
// import UnscheduleIcon from "@mui/icons-material/UpdateDisabled";
import UnscheduleIcon from '@mui/icons-material/NotInterested';
import PausedIcon from "@mui/icons-material/PauseCircleOutline";
import SvgIcon from "@mui/material/SvgIcon";

export const TaskIcon = props => (
  <SvgIcon {...props}>
    <g>
      <path
        d="M14,2H6C4.9,2,4.01,2.9,4.01,4L4,20c0,1.1,0.89,2,1.99,2H18c1.1,0,2-0.9,2-2V8L14,2z M10.94,18L7.4,14.46l1.41-1.41 l2.12,2.12l4.24-4.24l1.41,1.41L10.94,18z M13,9V3.5L18.5,9H13z" />
    </g>
  </SvgIcon>
);

export const TaskMenuIcon = props => (
  <SvgIcon {...props}>
    <g>
      <path
        d="M14,2H6C4.9,2,4.01,2.9,4.01,4L4,20c0,1.1,0.89,2,1.99,2H18c1.1,0,2-0.9,2-2V8L14,2z M18,20H6V4h7v5h5V20z M8.82,13.05 L7.4,14.46L10.94,18l5.66-5.66l-1.41-1.41l-4.24,4.24L8.82,13.05z" />
    </g>
  </SvgIcon>
);

const fields = [
  '_type', 'description', 'status', 'progress', 'scheduler', 'attempts', 'succeded',
  'retries', 'updated_at'
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
  task => TaskStatusConfig[task?.status]?.level || 'notice',
  'background'
);

export default {
  title: 'Task',
  icon: <TaskIcon />,
  actions: {
    index: { fields },
    new: { fields }
  },
  fields: {
    status: {
      viewer: TaskStatusViewer
    }
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
    "name": "NotificationFlowExecution"
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
  },
  {
    "namespace": "Setup",
    "name": "HookDataProcessing"
  }
];
