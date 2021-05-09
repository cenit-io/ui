import React from 'react';
import AuthorizationClientsFilledIcon from "../../../icons/AuthorizationClientsFilledIcon";
import itemLabelFor from "../../itemLabelFor";

const title = 'OAuth Client';

export default {
    title,
    itemLabel: itemLabelFor(title),
    icon: <AuthorizationClientsFilledIcon/>,
    titleViewport: '{provider {namespace name} name',
    actions: {
        index: {
            fields: ['_type', 'provider', 'name', 'updated_at'],
            viewport: '{id _type provider {namespace name} name updated_at origin}'
        }
    }
};
