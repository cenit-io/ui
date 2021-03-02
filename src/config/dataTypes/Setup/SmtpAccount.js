import React from 'react';
import SmtpAccountIcon from "@material-ui/icons/Email";
import { arrayDiff } from "../../../common/arrays";
import { Hidden, NotHidden } from '../../../common/constants';

const fields = ['provider', 'authentication', 'user_name', 'from', 'password'];

export default {
    title: 'SMTP Account',
    icon: <SmtpAccountIcon component="svg"/>,
    actions: {
        index: {
            fields: [...arrayDiff(fields, 'password'), 'updated_at']
        },
        new: {
            fields,
            seed: {
                authentication: 'plain'
            }
        }
    },
    fields: {
        provider: Hidden,
        user_name: Hidden,
        password: {
            controlProps: {
                type: 'password'
            }
        },
        from: {
            title: 'Send e-mail as'
        }
    },
    dynamicConfig: ({ id }, state, _, { errors }) => {
        if ((id || errors) && state.provider?.hidden !== false) {
            return {
                provider: NotHidden,
                authentication: NotHidden,
                user_name: NotHidden
            }
        }
    }
};
