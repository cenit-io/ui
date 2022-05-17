import { Avatar, CircularProgress, ListItem, ListItemText, makeStyles, Typography, useTheme } from "@material-ui/core";
import SudoIcon from '@material-ui/icons/SupervisorAccountTwoTone';
import React, { useEffect, useState } from "react";
import AuthorizationService, { AppGateway } from "../services/AuthorizationService";
import List from "@material-ui/core/List";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { useTenantContext } from "../layout/TenantContext";
import LogoutIcon from "@material-ui/icons/Logout";
import PasswordIcon from '@material-ui/icons/VpnKey';
import OkIcon from '@material-ui/icons/Check';
import FailIcon from '@material-ui/icons/CancelOutlined';
import { switchMap } from "rxjs/operators";
import { from } from "rxjs";
import Snackbar from "@material-ui/core/Snackbar";
import { Alert } from "@material-ui/lab";

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

const NOT_SETTING_PASSWORD = 'NOT_SETTING_PASSWORD';
const SETTING_PASSWORD = 'SETTING_PASSWORD';
const SETTING_PASSWORD_OK = 'SETTING_PASSWORD_OK';
const SETTING_PASSWORD_FAIL = 'SETTING_PASSWORD_FAIL';

const SETTING_PASSWORD_TIMEOUT = 10000;

const UserCard = ({ idToken, onClose }) => {

    const classes = useStyles();
    const theme = useTheme();

    const [settingPassword, setSettingPassword] = useState(NOT_SETTING_PASSWORD);
    const [tenantState, setTenantState] = useTenantContext();

    const { user } = tenantState;

    useEffect(() => {
        if (settingPassword === SETTING_PASSWORD) {
            const subscription = AuthorizationService.getAccess().pipe(
                switchMap(access => from(
                    AppGateway().get('send_reset_password_instructions', {
                        headers: { Authorization: `Bearer ${access.access_token}` }
                    })
                )),
            ).subscribe(() => {
                    setSettingPassword(SETTING_PASSWORD_OK);
                    setTimeout(onClose, SETTING_PASSWORD_TIMEOUT)
                },
                () => {
                    setSettingPassword(SETTING_PASSWORD_FAIL);
                    setTimeout(onClose, SETTING_PASSWORD_TIMEOUT)
                });

            return () => subscription.unsubscribe();
        }
    }, [settingPassword]);

    const isSuperUser = !!(user.roles || []).find(({ name }) => name === 'super_admin');

    if (!idToken) return <CircularProgress/>;

    const avatar = <Avatar alt={idToken.name}
                           src={idToken.picture}
                           className={classes.avatar}
                           component="div"/>;

    const setupPassword = () => setSettingPassword(SETTING_PASSWORD);

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
            <ListItem button onClick={handleSwitchSudo} component="li">
                <ListItemIcon className={superEnabled ? classes.safe : classes.warn}>
                    <SudoIcon component="svg"/>
                </ListItemIcon>
                <ListItemText primary={`${action} super user`}/>
            </ListItem>
        );
    }

    let passwordControl;
    if (user.need_password_reset) {
        let icon;
        let text;
        switch (settingPassword) {
            case SETTING_PASSWORD: {
                icon = <CircularProgress size={theme.spacing(3)}/>;
                text = 'Processing...';
            }
                break;

            case SETTING_PASSWORD_OK: {
                icon = <OkIcon component="svg" className={classes.safe}/>;
                text = 'Instructions sent!';
            }
                break;

            case SETTING_PASSWORD_FAIL: {
                icon = <FailIcon component="svg" className={classes.danger}/>;
                text = 'Failed';
            }
                break;

            default: {
                icon = <PasswordIcon component="svg" className={classes.danger}/>;
                text = 'Setup a password';
            }
        }
        passwordControl = (
            <ListItem button onClick={setupPassword}
                      disabled={settingPassword === SETTING_PASSWORD}
                      component="li">
                <ListItemIcon>
                    {icon}
                </ListItemIcon>
                <ListItemText primary={text}/>
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
            <List component="ul">
                {sudoControl}
                {passwordControl}
                <ListItem button onClick={logout} component="li">
                    <ListItemIcon>
                        <LogoutIcon component="svg"/>
                    </ListItemIcon>
                    <ListItemText primary="Logout"/>
                </ListItem>
            </List>
            <Snackbar open={settingPassword === SETTING_PASSWORD_OK}
                      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert>
                    An email with password reset instructions was sent to <strong>{user.email}</strong>
                </Alert>
            </Snackbar>
        </div>
    );
};

export default UserCard;
