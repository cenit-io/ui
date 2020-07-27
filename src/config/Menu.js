import { DataTypeSubject } from "../services/subjects";
import StorageIcon from "@material-ui/icons/Storage";
import CodeIcon from "@material-ui/icons/Code";

export default {
    groups: [
        {
            title: 'Data',
            IconComponent: StorageIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'JSON Types',
                    $ref: {
                        namespace: 'Setup',
                        name: 'JsonDataType'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'File Types',
                    $ref: {
                        namespace: 'Setup',
                        name: 'FileDataType'
                    }
                }
            ]
        },
        {
            title: 'Workflow',
            IconComponent: StorageIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Flows',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Flow'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Notifications',
                    $ref: {
                        namespace: 'Setup',
                        name: 'SystemNotification'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Observers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Observer'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Schedulers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Scheduler'
                    }
                }
            ]
        },
        {
            title: 'Transformations',
            IconComponent: StorageIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Templates',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Template'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Parsers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'ParserTransformation'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Converters',
                    $ref: {
                        namespace: 'Setup',
                        name: 'ConverterTransformation'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Updaters',
                    $ref: {
                        namespace: 'Setup',
                        name: 'UpdaterTransformation'
                    }
                }
            ]
        },
        {
            title: 'Gateway',
            IconComponent: StorageIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Connections',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Connection'
                    }
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
                    }
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
                    }
                }
            ]
        },
        {
            title: 'Compute',
            IconComponent: StorageIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Algorithms',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Algorithm'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Applications',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Application'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Snippets',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Snippet'
                    }
                }
            ]
        },
        {
            title: 'Security',
            IconComponent: StorageIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Authorization Clients',
                    $ref: {
                        namespace: 'Setup',
                        name: 'AuthorizationClient'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Authorization Providers',
                    $ref: {
                        namespace: 'Setup',
                        name: 'AuthorizationProvider'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Authorizations',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Authorization'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Access Grant',
                    $ref: {
                        namespace: 'Cenit',
                        name: 'OauthAccessGrant'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'OAuth 2.0 Scopes',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Oauth2Scope'
                    }
                }
            ]
        },
        {
            title: 'Integrations',
            IconComponent: StorageIcon,
            items: [
                {
                    type: DataTypeSubject.type,
                    title: 'Collections',
                    $ref: {
                        namespace: 'Setup',
                        name: 'Collection'
                    }
                },
                {
                    type: DataTypeSubject.type,
                    title: 'Shared Collections',
                    $ref: {
                        namespace: 'Setup',
                        name: 'CrossSharedCollection'
                    }
                }
            ]
        },
        {
            title: 'Monitors',
            IconComponent: StorageIcon,
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
                    }
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
            IconComponent: StorageIcon,
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
