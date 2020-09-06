import React from 'react';
import AccessGrantFilledIcon from "../../../icons/AccessGrantFilledIcon";
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";

export default {
    title: 'Access Grant',
    icon: <AccessGrantFilledIcon/>,
    actions: {
        index: {
            fields: ['created_at', 'scope']
        }
    }
};
