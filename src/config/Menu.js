import React from 'react'
import { DataTypeSubject } from "../services/subjects";
import DataIcon from "../icons/DataIcon";
import ConfigurationIcon from "../icons/ConfigurationIcon";
import FlowsIcon from "../icons/FlowsIcon";
import SystemNotificationIcon from "../icons/NotificationsIcon";
import DataEventsIcon from "../icons/DataEventsIcon";
import EmailChannelsIcon from "../icons/EmailChannelsIcon";
import SchedulersIcon from "../icons/SchedulersIcon";
import TransformationIcon from "../icons/TransformationIcon";
import TemplateIcon from "../icons/TemplateIcon";
import ParserIcon from "../icons/ParserIcon";
import UpdaterIcon from "../icons/UpdaterIcon";
import ConnectorIcon from "../icons/ConnectorIcon";
import ApiSpecsIcon from "../icons/ApiSpecsIcon";
import GatewayIcon from "../icons/GatewayIcon";
import ConverterIcon from "../icons/ConverterIcon";
import AlgorithmIcon from "../icons/AlgorithmIcon";
import ApplicationIcon from "../icons/ApplicationIcon";
import SnippetIcon from "../icons/SnippetIcon";
import FileTypesIcon from "../icons/FileTypesIcon";
import DocumentTypesIcon from "../icons/DocumentTypesIcon";
import MonitorIcon from "../icons/MonitorIcon";
import CollectionIcon from "../icons/CollectionIcon";
import SharedCollectionIcon from "../icons/SharedCollectionIcon";
import IntegrationIcon from "../icons/IntegrationIcon";
import SecurityIcon from "../icons/SecurityIcon";
import ComputeIcon from "../icons/ComputeIcon";
import AuthorizationClientsIcon from "../icons/AuthorizationClientsIcon";
import AuthorizationIcon from "../icons/AuthorizationIcon";
import AccessGrantIcon from "../icons/AccessGrantIcon";
import ProviderIcon from "../icons/ProviderIcon";
import OauthScopesIcon from "../icons/OauthScopesIcon";
import WorkflowIcon from "../icons/WorkflowIcon";
import ResourceIcon from "@material-ui/icons/WorkOutline";
import TraceIcon from "@material-ui/icons/HistoryToggleOff";
import SvgIcon from "@material-ui/core/SvgIcon";
import NamespaceIcon from "@material-ui/icons/DnsOutlined";
import ConfigIcon from "@material-ui/icons/Settings";
import TenantIcon from "@material-ui/icons/HomeOutlined";
import AdministrationIcon from "@material-ui/icons/AdminPanelSettingsOutlined";
import { RoleMenuIcon } from "./dataTypes/Role";
import { UserMenuIcon } from "./dataTypes/User";
import { ScriptMenuIcon } from "./dataTypes/Script";
import { TaskMenuIcon } from "./dataTypes/Setup/Task";
import { ActiveTenantMenuIcon } from "./dataTypes/Cenit/ActiveTenant";
import { RabbitConsumerMenuIcon } from "./dataTypes/RabbitConsumer";
import { SystemReportMenuIcon } from "./dataTypes/Setup/SystemReport";
import { DelayedMessageMenuIcon } from "./dataTypes/Setup/DelayedMessage";

export default {
    groups: [
        {
            title: 'Data',
            IconComponent: DataIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Document Types',
                    $ref: {
                        namespace: 'Setup',
                        name: 'JsonDataType'
                    },
                    icon: <DocumentTypesIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'File Types',
                    $ref: {
                        namespace: 'Setup',
                        name: 'FileDataType'
                    },
                    icon: <FileTypesIcon/>
                }
            ]
        },
        {
            title: 'Workflow',
            IconComponent: WorkflowIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Flows',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Flow'
                    },
                    icon: <FlowsIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Notification Flows',
                    $ref: {
                        namespace: 'Setup',
                        name: 'NotificationFlow'
                    },
                    icon: (
                        <SvgIcon component="svg">
                            <g>
                                <path
                                    d="M12,18.5c0.83,0,1.5-0.67,1.5-1.5h-3C10.5,17.83,11.17,18.5,12,18.5z M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10 c5.52,0,10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8c4.41,0,8,3.59,8,8S16.41,20,12,20z M16,11.39 c0-2.11-1.03-3.92-3-4.39V6.5c0-0.57-0.43-1-1-1s-1,0.43-1,1V7c-1.97,0.47-3,2.27-3,4.39V14H7v2h10v-2h-1V11.39z M14,14h-4v-3 c0-1.1,0.9-2,2-2s2,0.9,2,2V14z"/>
                            </g>
                        </SvgIcon>
                    )
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Observers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Observer'
                    },
                    icon: <DataEventsIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Schedulers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Scheduler'
                    },
                    icon: <SchedulersIcon/>
                }
            ]
        },
        {
            title: 'Transformations',
            IconComponent: TransformationIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Templates',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Template'
                    },
                    icon: <TemplateIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Parsers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'ParserTransformation'
                    },
                    icon: <ParserIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Converters',
                    $ref: {
                        namespace: 'Setup',
                        name: 'ConverterTransformation'
                    },
                    icon: <ConverterIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Updaters',
                    $ref: {
                        namespace: 'Setup',
                        name: 'UpdaterTransformation'
                    },
                    icon: <UpdaterIcon/>
                }
            ]
        },
        {
            title: 'Gateway',
            IconComponent: GatewayIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Connections',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Connection'
                    },
                    icon: <ConnectorIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Resources',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Resource'
                    },
                    icon: <ResourceIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Email Channels',
                    $ref: {
                        namespace: 'Setup',
                        name: 'EmailChannel'
                    },
                    icon: <EmailChannelsIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'SMTP Providers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'SmtpProvider'
                    },
                    icon: <EmailChannelsIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'API Specs',
                    $ref: {
                        namespace: 'Setup',
                        name: 'ApiSpec'
                    },
                    icon: <ApiSpecsIcon component="svg"/>
                }
            ]
        },
        {
            title: 'Compute',
            IconComponent: ComputeIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Algorithms',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Algorithm'
                    },
                    icon: <AlgorithmIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Applications',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Application'
                    },
                    icon: <ApplicationIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Snippets',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Snippet'
                    },
                    icon: <SnippetIcon component="svg"/>
                }
            ]
        },
        {
            title: 'Security',
            IconComponent: SecurityIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Authorization Clients',
                    $ref: {
                        namespace: 'Setup',
                        name: 'AuthorizationClient'
                    },
                    icon: <AuthorizationClientsIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Authorization Providers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'AuthorizationProvider'
                    },
                    icon: <ProviderIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Authorizations',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Authorization'
                    },
                    icon: <AuthorizationIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Access Grant',
                    $ref: {
                        namespace: 'Cenit',
                        name: 'OauthAccessGrant'
                    },
                    icon: <AccessGrantIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'OAuth 2.0 Scopes',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Oauth2Scope'
                    },
                    icon: <OauthScopesIcon component="svg"/>
                }
            ]
        },
        {
            title: 'Integrations',
            IconComponent: IntegrationIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Collections',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Collection'
                    },
                    icon: <CollectionIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Shared Collections',
                    $ref: {
                        namespace: 'Setup',
                        name: 'CrossSharedCollection'
                    },
                    icon: <SharedCollectionIcon component="svg"/>
                }
            ]
        },
        {
            title: 'Monitors',
            IconComponent: MonitorIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Traces',
                    $ref: {
                        namespace: 'Mongoid::Tracer',
                        name: 'Trace'
                    },
                    icon: <TraceIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'System Notifications',
                    $ref: {
                        namespace: 'Setup',
                        name: 'SystemNotification'
                    },
                    icon: <SystemNotificationIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Tasks',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Task'
                    },
                    icon: (
                        <SvgIcon component="svg">
                            <g>
                                <path
                                    d="M14,2H6C4.9,2,4.01,2.9,4.01,4L4,20c0,1.1,0.89,2,1.99,2H18c1.1,0,2-0.9,2-2V8L14,2z M18,20H6V4h7v5h5V20z M8.82,13.05 L7.4,14.46L10.94,18l5.66-5.66l-1.41-1.41l-4.24,4.24L8.82,13.05z"/>
                            </g>
                        </SvgIcon>
                    )
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Storage',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Storage'
                    },
                    icon: (
                        <SvgIcon component="svg">
                            <g xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M18,20H6V4h8v4h4V20z M12,17L12,17 c-1.1,0-2-0.9-2-2l0-5.5C10,9.22,10.22,9,10.5,9h0C10.78,9,11,9.22,11,9.5V15h2V9.5C13,8.12,11.88,7,10.5,7h0C9.12,7,8,8.12,8,9.5 L8,15c0,2.21,1.79,4,4,4h0c2.21,0,4-1.79,4-4v-4h-2v4C14,16.1,13.1,17,12,17z"/>
                            </g>
                        </SvgIcon>
                    )
                }
            ]
        },
        {
            title: 'Configuration',
            IconComponent: ConfigurationIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Namespaces',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Namespace'
                    },
                    icon: <NamespaceIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Data Types Configs',
                    $ref: {
                        namespace: 'Setup',
                        name: 'DataTypeConfig'
                    },
                    icon: <ConfigIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'File Store Config',
                    $ref: {
                        namespace: 'Setup',
                        name: 'FileStoreConfig'
                    },
                    icon: <ConfigIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Flow Config',
                    $ref: {
                        namespace: 'Setup',
                        name: 'FlowConfig'
                    },
                    icon: <ConfigIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Bindings',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Binding'
                    },
                    icon: <ConfigIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Parameters',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Parameter'
                    },
                    icon: <ConfigIcon component="svg"/>
                }
            ]
        },
        {
            title: 'Administration',
            IconComponent: AdministrationIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Tenants',
                    $ref: {
                        namespace: '',
                        name: 'Account'
                    },
                    icon: <TenantIcon component="svg"/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Configuration',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Configuration'
                    },
                    icon: <ConfigIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Users',
                    $ref: {
                        namespace: '',
                        name: 'User'
                    },
                    icon: <UserMenuIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Roles',
                    $ref: {
                        namespace: '',
                        name: 'Role'
                    },
                    icon: <RoleMenuIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Scripts',
                    $ref: {
                        namespace: '',
                        name: 'Script'
                    },
                    icon: <ScriptMenuIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Scripts Executions',
                    $ref: {
                        namespace: '',
                        name: 'ScriptExecution'
                    },
                    icon: <TaskMenuIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Active Tenants',
                    $ref: {
                        namespace: 'Cenit',
                        name: 'ActiveTenant'
                    },
                    icon: <ActiveTenantMenuIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Rabbit Consumers',
                    $ref: {
                        namespace: '',
                        name: 'RabbitConsumer'
                    },
                    icon: <RabbitConsumerMenuIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Delayed Messages',
                    $ref: {
                        namespace: 'Setup',
                        name: 'DelayedMessage'
                    },
                    icon: <DelayedMessageMenuIcon component="svg"/>,
                    superUser: true
                },
                {
                    type: DataTypeSubject.type,
                    title: 'System Reports',
                    $ref: {
                        namespace: 'Setup',
                        name: 'SystemReport'
                    },
                    icon: <SystemReportMenuIcon component="svg"/>,
                    superUser: true
                }
            ]
        }
    ]
};
