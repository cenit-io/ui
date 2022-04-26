import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";
import { CRUD } from "../../../actions/ActionRegistry";
import lazy from "../../../components/lazy";
import StringControl from "../../../components/StringControl";

const LazyControl = lazy(StringControl, { skipChanges: true });

export default {
    title: 'Build-in App',
    icon: <ApplicationFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'slug', 'updated_at']
        },
        edit: {
            fields: ['namespace', 'name', 'slug', 'identifier', 'secret', 'application_parameters'],
            viewportFields: ['namespace', 'name', 'slug', 'application_parameters']
        }
    },
    fields: {
        namespace: {
            readOnly: true
        },
        name: {
            readOnly: true
        },
        slug: {
            readOnly: true
        },
        identifier: {
            readOnly: true,
            control: LazyControl,
        },
        secret: {
            readOnly: true,
            control: LazyControl,
        }
    },
    crud: [CRUD.read, CRUD.update]
};
