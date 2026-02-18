import { Avatar, Box, CircularProgress, ListItem, ListItemText, Typography, useTheme } from "@mui/material";
import SudoIcon from '@mui/icons-material/SupervisorAccountTwoTone';
import React, { useEffect, useState } from "react";
import { logout, appRequest, getAccess } from "../services/AuthorizationService";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import { useTenantContext } from "../layout/TenantContext";
import LogoutIcon from '@mui/icons-material/ExitToAppOutlined';
import PasswordIcon from '@mui/icons-material/VpnKey';
import OkIcon from '@mui/icons-material/Check';
import FailIcon from '@mui/icons-material/CancelOutlined';
import { switchMap } from "rxjs/operators";
import { from } from "rxjs";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from '@mui/material';
import ApartmentIcon from "@mui/icons-material/Apartment";
import { RecordSubject, TabsSubject } from "../services/subjects";
import { DataType } from "../services/DataTypeService";

const NOT_SETTING_PASSWORD = 'NOT_SETTING_PASSWORD';
const SETTING_PASSWORD = 'SETTING_PASSWORD';
const SETTING_PASSWORD_OK = 'SETTING_PASSWORD_OK';
const SETTING_PASSWORD_FAIL = 'SETTING_PASSWORD_FAIL';

const SETTING_PASSWORD_TIMEOUT = 10000;

const UserCard = ({ idToken, onClose }) => {
  const theme = useTheme();

  const [settingPassword, setSettingPassword] = useState(NOT_SETTING_PASSWORD);
  const [tenantState, setTenantState] = useTenantContext();

  const { user } = tenantState;

  useEffect(() => {
    if (settingPassword === SETTING_PASSWORD) {
      const subscription = getAccess().pipe(
        switchMap(access => from(appRequest({ url: 'send_reset_password_instructions' }))),
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

  if (!idToken) return <CircularProgress />;

  const avatar = <Avatar alt={idToken.name}
                         src={idToken.picture}
                         sx={{
                           width: theme.spacing(8),
                           height: theme.spacing(8),
                         }}
                         component="div" />;

  const setupPassword = () => setSettingPassword(SETTING_PASSWORD);

  const handleLogout = () => {
    onClose && onClose();
    logout();
  };

  const showCurrentTenant = () => {
    DataType.find({ namespace: '', name: 'Account' }).subscribe(dataType => {
      TabsSubject.next({
        key: RecordSubject.for(dataType.id, tenantState.tenant.id).key
      });
    });
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
        <ListItemIcon
          sx={{
            color: superEnabled ? theme.palette.success.main : theme.palette.warning.main
          }}>
          <SudoIcon component="svg" />
        </ListItemIcon>
        <ListItemText primary={`${action} super user`} />
      </ListItem>
    );
  }

  let passwordControl;
  if (user.need_password_reset) {
    let icon;
    let text;
    switch (settingPassword) {
      case SETTING_PASSWORD: {
        icon = <CircularProgress size={theme.spacing(3)} />;
        text = 'Processing...';
      }
        break;

      case SETTING_PASSWORD_OK: {
        icon = <OkIcon component="svg" sx={{ color: theme.palette.success.main }} />;
        text = 'Instructions sent!';
      }
        break;

      case SETTING_PASSWORD_FAIL: {
        icon = <FailIcon component="svg" sx={{ color: theme.palette.error.main }} />;
        text = 'Failed';
      }
        break;

      default: {
        icon = <PasswordIcon component="svg" sx={{ color: theme.palette.error.main }} />;
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
        <ListItemText primary={text} />
      </ListItem>
    );
  }

  return (
    <Box
      className="flex column"
      sx={{
        borderBottom: `solid 2px ${theme.palette.primary.light}`,
        position: 'sticky',
        top: 0,
        zIndex: 1500,
        background: theme.palette.common.white,
        minWidth: theme.spacing(26)
      }}>
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            m: theme.spacing(1),
          }}>
          {avatar}
        </Box>
        <div className="flex column align-items-center">
          <Typography component="div" variant="subtitle2">
            {idToken.name}
          </Typography>
          <Typography component="div" variant="caption">
            {idToken.email}
          </Typography>
        </div>
      </Box>
      <List component="ul">
        {sudoControl}
        {passwordControl}
        <ListItem button onClick={showCurrentTenant} component="li">
          <ListItemIcon>
            <ApartmentIcon component="svg" />
          </ListItemIcon>
          <ListItemText primary="Current tenant" />
        </ListItem>
        <ListItem button onClick={handleLogout} component="li">
          <ListItemIcon>
            <LogoutIcon component="svg" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
      <Snackbar open={settingPassword === SETTING_PASSWORD_OK}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert>
          An email with password reset instructions was sent to <strong>{user.email}</strong>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserCard;
