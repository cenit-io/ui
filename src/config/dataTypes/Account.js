import React from 'react';
import HomeIcon from '@material-ui/icons/Home';
import ErrorLevelViewer from "../../viewers/ErrorLevelViewer";

export default {
    title: 'Tenant',
    icon: <HomeIcon/>,
    actions: {
        index: {
            fields: ['name', 'notification_level', 'time_zone', 'updated_at']
        },
        new: {
            fields: ['name', 'notification_level', 'time_zone']
        }
    },
    viewers: {
        notification_level: ErrorLevelViewer(
            ({ notification_level }) => notification_level,
            'background'
        )
    }
};
