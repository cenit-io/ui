import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";
import StringControl from "../../../components/StringControl";
import lazy from "../../../components/lazy";

const LazyControl = lazy(StringControl, { skipChanges: true });

export default {
    title: 'Application',
    icon: <ApplicationFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'slug', 'registered', 'actions', 'application_parameters', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'slug', 'actions', 'application_parameters']
        },
        edit: {
            fields: ['namespace', 'name', 'slug', 'actions', 'application_parameters', 'identifier', 'secret'],
            viewportFields: ['namespace', 'name', 'slug', 'actions', 'application_parameters']
        }
    },
    groups: {
        credentials: {
            fields: ['identifier', 'secret']
        }
    },
    fields: {
        identifier: {
            control: LazyControl,
            readOnly: true
        },
        secret: {
            control: LazyControl,
            readOnly: true
        }
    }
};
