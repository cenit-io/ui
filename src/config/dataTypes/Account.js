import React from 'react';
import HomeIcon from '@material-ui/icons/Home';
import ErrorLevelViewer from "../../viewers/ErrorLevelViewer";
import MenuIcon from "@material-ui/icons/HomeOutlined";
import ViewerControl from "../../components/ViewerControl";
import { isSuperAdmin } from "../../layout/TenantContext";

export const TenantMenuIcon = MenuIcon;

export default {
    title: 'Tenant',
    icon: <HomeIcon component="svg"/>,
    actions: {
        index: {
            fields: user => {
                const fields = ['name', 'notification_level', 'time_zone', 'locked', 'updated_at'];
                if (isSuperAdmin(user)) {
                    fields.splice(fields.length - 2, 0, 'owner', 'users');
                }
                return fields;
            }
        },
        new: {
            fields: user => {
                const fields = ['name', 'notification_level', 'time_zone']
                if (isSuperAdmin(user)) {
                    fields.splice(fields.length - 2, 0, 'owner', 'users');
                }
                return fields;
            }
        },
        edit: {
            fields: user => {
                const fields = ['name', 'notification_level', 'time_zone']
                if (isSuperAdmin(user)) {
                    fields.splice(fields.length - 2, 0, 'owner', 'users');
                }
                return fields;
            }
        },
        show: {
            fields: ['name', 'notification_level', 'time_zone', 'locked', 'owner', 'users']
        },
        delete: {
            confirmation: true
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
        },
        owner: {
            disabled: (_, user) => !isSuperAdmin(user)
        },
        users: {
            disabled: (_, user) => !isSuperAdmin(user)
        }
    }
};
