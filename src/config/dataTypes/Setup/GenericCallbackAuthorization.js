import React from 'react';
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";
import ViewerControl from "../../../components/ViewerControl";
import { arrayDiff } from "../../../common/arrays";
import { ExactlyTwoParameter } from "../../../common/selectors";

const fields = [
    'id', 'namespace', 'name', 'authorized', 'client', 'callback_resolver', 'parameters_signer',
    'parameters', 'template_parameters', 'metadata'
];

export default {
    title: 'Callback Authorization',
    icon: <AuthorizationFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'authorized', 'client', 'updated_at'],
            viewport: '{id namespace name authorized client {id provider {namespace name} name} updated_at}'
        },
        new: { fields: arrayDiff(fields, 'id', 'authorized') },
        edit: {
            fields,
            viewport: '{id namespace name authorized client {id provider {namespace name} name}' +
                'callback_resolver parameters_signer parameters template_parameters metadata}'
        }
    },
    fields: {
        authorized: {
            control: ViewerControl
        },
        client: {
            controlProps: {
                additionalViewportProps: ['namespace', 'provider']
            }
        },
        callback_resolver: {
            selector: ExactlyTwoParameter
        },
        parameters_signer: {
            selector: ExactlyTwoParameter
        }
    }
};
