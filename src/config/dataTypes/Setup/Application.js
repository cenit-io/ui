import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";
import { LazyStringControl } from "../../../components/LazyStringControl";

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
            control: LazyStringControl,
            readOnly: true
        },
        secret: {
            control: LazyStringControl,
            readOnly: true
        }
    }
};
