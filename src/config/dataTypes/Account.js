import React from 'react';
import HomeIcon from '@material-ui/icons/Home';
import ErrorLevelViewer from "../../viewers/ErrorLevelViewer";
import MenuIcon from "@material-ui/icons/HomeOutlined";
import ViewerControl from "../../components/ViewerControl";

export const TenantMenuIcon = MenuIcon;

export default {
    title: 'Tenant',
    icon: <HomeIcon component="svg"/>,
    actions: {
        index: {
            fields: ['name', 'notification_level', 'time_zone', 'locked', 'updated_at']
        },
        new: {
            fields: ['name', 'notification_level', 'time_zone', 'locked']
        }
    },
    fields: {
        notification_level: {
            viewer: ErrorLevelViewer(
                ({ notification_level }) => notification_level,
                'background'
            )
        },
        locked: {
            control: ViewerControl
        }
    }
};
