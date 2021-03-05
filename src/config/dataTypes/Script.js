import React from 'react';

import ScriptIcon from '@material-ui/icons/CodeRounded';
import MenuIcon from '@material-ui/icons/CodeOutlined';

export const ScriptMenuIcon = MenuIcon;

export default {
    title: 'Script',
    icon: <ScriptIcon component="svg"/>,
    actions: {
        index: {
            fields: ['name', 'description', 'code', 'updated_at']
        },
        new: {
            fields: ['name', 'description', 'code']
        }
    }
};
