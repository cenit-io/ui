import React from 'react'
import { DataTypeSubject } from "../services/subjects";
import DataIcon from "../icons/DataIcon";
import WorkflowsIcon from "../icons/WorkflowsIcon";
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
            IconComponent: WorkflowsIcon,
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
                    }
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
                    }
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
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Storage',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Storage'
                    }
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
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Data Types Configs',
                    $ref: {
                        namespace: 'Setup',
                        name: 'DataTypeConfig'
                    }
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
