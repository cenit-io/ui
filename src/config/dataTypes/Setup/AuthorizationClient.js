import React from 'react';
import AuthorizationClientsFilledIcon from "../../../icons/AuthorizationClientsFilledIcon";
import ApiSpecsFilledIcon from "../../../icons/ApiSpecsFilledIcon";

export default {
    title: 'Authorization Client',
    icon: <AuthorizationClientsFilledIcon/>,
    actions: {
        index: {
            fields: ['provider', 'name', 'identifier', 'secret', 'updated_at']
        }
    }
};
