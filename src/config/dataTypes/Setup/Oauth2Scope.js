import React from 'react';
import OauthScopesFilledIcon from "../../../icons/OauthScopesFilledIcon";
import AccessGrantFilledIcon from "../../../icons/AccessGrantFilledIcon";

export default {
    title: 'OAuth 2.0 Scope',
    icon: <OauthScopesFilledIcon/>,
    actions: {
        index: {
            fields: ['provider', 'name', 'description', 'updated_at']
        }
    }
};
