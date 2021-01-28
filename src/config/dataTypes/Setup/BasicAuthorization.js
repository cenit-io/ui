import React from 'react';
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";

const fields = ['namespace', 'name', 'username', 'password'];

export default {
    title: 'Basic Authorization',
    icon: <AuthorizationFilledIcon/>,
    groups: {
        credentials: {
            fields: ['username', 'password']
        }
    },
    actions: {
        new: { fields },
        edit: { fields }
    },
    fields: {
        password: {
            controlProps: {
                type: 'password'
            }
        }
    }
};
