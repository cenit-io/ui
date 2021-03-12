import React from 'react';
import CollectionFilledIcon from "../../../icons/CollectionFilledIcon";

import '../../../actions/Share';
import RefManyControl from "../../../components/RefManyControl";
import CollectionsView from "../../../components/CollectionsView";

const groups = {
    data: {
        fields: ['data_types', 'schemas', 'custom_validators']
    },
    compute: {
        fields: ['translators', 'algorithms', 'applications', 'snippets']
    },
    workflows: {
        fields: ['flows', 'events']
    },
    connectors: {
        fields: ['connections', 'resources', 'webhooks']
    },
    security: {
        fields: ['authorizations', 'oauth_providers', 'oauth_clients', 'generic_clients', 'oauth2_scopes']
    },
    metadata: {
        fields: ['metadata']
    }
};

const groupsFields = Object.values(groups).map(({ fields }) => fields).flat();

const editableFields = ['name', 'title', 'picture', ...groupsFields];

export default {
    title: 'Collection',
    icon: <CollectionFilledIcon/>,
    groups,
    actions: {
        new: {
            fields: editableFields,
        },
        edit: {
            fields: editableFields,
        },
        index: {
            fields: ['name', 'title', 'picture', 'updated_at'],
            viewport: '{id name title picture { public_url } updated_at}',
            viewComponent: CollectionsView
        }
    },
    fields: {
        ...Object.values(groups)
            .map(({ fields }) => fields)
            .flat()
            .reduce((config, field) => {
                config[field] = {
                    control: RefManyControl
                };
                return config
            }, {})
    }
};
