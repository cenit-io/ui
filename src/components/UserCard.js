import { Avatar, CircularProgress, Typography, makeStyles, ListItemText, ListItem } from "@material-ui/core";
import SudoIcon from '@material-ui/icons/SupervisorAccountTwoTone';
import React from "react";
import AuthorizationService from "../services/AuthorizationService";
import List from "@material-ui/core/List";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { useTenantContext } from "../layout/TenantContext";
import LogoutIcon from "@material-ui/icons/Logout";

const useStyles = makeStyles(theme => ({
    avatarContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: theme.spacing(1),
    },
    avatar: {
        width: theme.spacing(8),
        height: theme.spacing(8),
    },
    avatarContentWrapper: {
        borderBottom: `solid 2px ${theme.palette.primary.light}`,
        position: 'sticky',
        top: 0,
        zIndex: 1500,
        background: theme.palette.common.white,
        minWidth: theme.spacing(26)
    },
    danger: {
        color: theme.palette.error.main
    },
    safe: {
        color: theme.palette.success.main
    },
    warn: {
        color: theme.palette.warning.main
    }
}));

const UserCard = ({ idToken, onClose }) => {

    const classes = useStyles();

    const [tenantState, setTenantState] = useTenantContext();

    const { user } = tenantState;

    const isSuperUser = !!(user.roles || []).find(({ name }) => name === 'super_admin');

    if (!idToken) return <CircularProgress/>;

    const avatar = <Avatar alt={idToken.name} src={idToken.picture} className={classes.avatar}/>;

    const logout = () => {
        onClose && onClose();
        AuthorizationService.logout();
    };

    const handleSwitchSudo = () => {
        setTenantState({ switchSudo: true });
        onClose && onClose();
    };

    let sudoControl;
    if (isSuperUser) {
        const superEnabled = user.super_admin_enabled;
        const action = superEnabled ? 'Disable' : 'Enable';
        sudoControl = (
            <ListItem button onClick={handleSwitchSudo}>
                <ListItemIcon className={superEnabled ? classes.safe : classes.warn}>
                    <SudoIcon/>
                </ListItemIcon>
                <ListItemText primary={`${action} super user`}/>
            </ListItem>
        );
    }

    return (
        <div className={`flex column ${classes.avatarContentWrapper}`}>
            <div className={classes.profile}>
                <div className={classes.avatarContainer}>
                    {avatar}
                </div>
                <div className="flex column align-items-center">
                    <Typography component="div" variant="subtitle2">
                        {idToken.name}
                    </Typography>
                    <Typography component="div" variant="caption">
                        {idToken.email}
                    </Typography>
                </div>
            </div>
            <List>
                {sudoControl}
                <ListItem button onClick={logout}>
                    <ListItemIcon>
                        <LogoutIcon component="svg"/>
                    </ListItemIcon>
                    <ListItemText primary="Logout"/>
                </ListItem>
            </List>
        </div>
    );
};

export default UserCard;
