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
        index: {
            fields: ['namespace', 'name', 'username', 'updated_at']
        },
        new: { fields }
    },
    fields: {
        password: {
            controlProps: {
                type: 'password'
            }
        }
    }
};
