import React from 'react';
import HomeIcon from '@material-ui/icons/Home';
import ErrorLevelViewer from "../../viewers/ErrorLevelViewer";
import MenuIcon from "@material-ui/icons/HomeOutlined";

export const TenantMenuIcon = MenuIcon;

export default {
    title: 'Tenant',
    icon: <HomeIcon component="svg"/>,
    actions: {
        index: {
            fields: ['name', 'notification_level', 'time_zone', 'active_until', 'locked', 'updated_at']
        },
        new: {
            fields: ['name', 'notification_level', 'time_zone']
        }
    },
    fields: {
        notification_level: {
            viewer: ErrorLevelViewer(
                ({ notification_level }) => notification_level,
                'background'
            )
        }
    }
};
