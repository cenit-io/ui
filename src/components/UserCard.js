import { Avatar, CircularProgress, Typography, makeStyles, ListItemText, ListItem } from "@material-ui/core";
import SudoIcon from '@material-ui/icons/SupervisorAccountTwoTone';
import React from "react";
import AuthorizationService from "../services/AuthorizationService";
import List from "@material-ui/core/List";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { useTenantContext } from "../layout/TenantContext";
import SvgIcon from "@material-ui/core/SvgIcon";

const LogoutIcon = props => (
    <SvgIcon {...props}>
        <path
            d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
    </SvgIcon>
);

const useStyles = makeStyles(theme => ({
    avatarContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: theme.spacing(1),
        minWidth: theme.spacing(26)
    },
    avatar: {
        width: `${theme.spacing(8)}px`,
        height: `${theme.spacing(8)}px`,
    },
    avatarContentWrapper: {
            width: '90%',
            margin: '0 auto',
            borderBottom: `2px solid ${theme.palette.primary.light}`
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
                        <LogoutIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Logout"/>
                </ListItem>
            </List>
        </div>
    );
};

export default UserCard;
