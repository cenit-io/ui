import React from 'react'
import { DataTypeSubject } from "../services/subjects";
import DataIcon from "../icons/DataIcon";
import ConfigurationIcon from "../icons/ConfigurationIcon";
import FlowsIcon from "../icons/FlowsIcon";
import NotificationsIcon from "../icons/NotificationsIcon";
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
import NamespaceIcon from "@material-ui/icons/Dns";
import ConfigIcon from "@material-ui/icons/Settings";

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
                    title: 'Notifications',
                    $ref: {
                        namespace: 'Setup',
                        name: 'SystemNotification'
                    },
                    icon: <NotificationsIcon/>
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
                    icon: <ResourceIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Email Channels',
                    $ref: {
                        namespace: 'Setup',
                        name: 'EmailChannel'
                    },
                    icon: <EmailChannelsIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'SMTP Providers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'SmtpProvider'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'API Specs',
                    $ref: {
                        namespace: 'Setup',
                        name: 'ApiSpec'
                    },
                    icon: <ApiSpecsIcon/>
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
                    icon: <AlgorithmIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Applications',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Application'
                    },
                    icon: <ApplicationIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Snippets',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Snippet'
                    },
                    icon: <SnippetIcon/>
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
                    icon: <AuthorizationClientsIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Authorization Providers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'AuthorizationProvider'
                    },
                    icon: <ProviderIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Authorizations',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Authorization'
                    },
                    icon: <AuthorizationIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Access Grant',
                    $ref: {
                        namespace: 'Cenit',
                        name: 'OauthAccessGrant'
                    },
                    icon: <AccessGrantIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'OAuth 2.0 Scopes',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Oauth2Scope'
                    },
                    icon: <OauthScopesIcon/>
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
                    icon: <CollectionIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Shared Collections',
                    $ref: {
                        namespace: 'Setup',
                        name: 'CrossSharedCollection'
                    },
                    icon: <SharedCollectionIcon/>
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
                    icon: <TraceIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Notifications',
                    $ref: {
                        namespace: 'Setup',
                        name: 'SystemNotification'
                    },
                    icon: <NotificationsIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Tasks',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Task'
                    },
                    icon: (
                        <SvgIcon>
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
                        <SvgIcon>
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
                    icon: <NamespaceIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Data Types Configs',
                    $ref: {
                        namespace: 'Setup',
                        name: 'DataTypeConfig'
                    },
                    icon: <ConfigIcon/>
                },
                {
                    type: DataTypeSubject.type,
                    title: 'File Store Config',
                    $ref: {
                        namespace: 'Setup',
                        name: 'FileStoreConfig'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Flow Config',
                    $ref: {
                        namespace: 'Setup',
                        name: 'FlowConfig'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Bindings',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Binding'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Parameters',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Parameter'
                    }
                }
            ]
        },
    ]
};
