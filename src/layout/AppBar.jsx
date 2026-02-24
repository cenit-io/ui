import React, { useEffect } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  Paper,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import { useTheme } from '@mui/material/styles';
import TenantSelector from "../components/TenantSelector";
import UserCard from "../components/UserCard";
import ConfigService from "../services/ConfigService";
import { DataTypeSubject, MenuSubject, TabsSubject } from "../services/subject";
import Search from "../components/Search";
import MenuIcon from "../icons/MenuIcon";
import { useTenantContext } from "./TenantContext";
import { useMainContext } from "./MainContext";
import zzip from "../util/zzip";
import { DataType } from "../services/DataTypeService";
import { useSpreadState } from "../common/hooks";
import NotificationsIcon from "../icons/NotificationsIcon";
import { TaskMenuIcon } from "../config/dataTypes/Setup/Task";
import Badge from "@mui/material/Badge";
// import NotificationIcon from '@mui/icons-material/CircleNotifications';
import NotificationIcon from '@mui/icons-material/NotificationsActiveOutlined';
import session from '../util/session';
import brandLogoUrl from "../util/brandLogoUrl";

const USER_NOTIFIED = 'USER_NOTIFIED';

export const appBarHeight = theme => theme.spacing(8);

export const DataTypeSelector = { namespace: 'Setup', name: 'DataType' };

export default function ({ onToggle }) {

  const [state, setState] = useSpreadState();

  const { idToken } = useMainContext()[0];

  const [tenantState] = useTenantContext();

  const { loading, user } = tenantState;

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  const { open, tenantDataType, notificationDataType, taskDataType } = state;

  useEffect(() => {
    const subscription = zzip(
      DataType.find({ namespace: '', name: 'Account' }),
      DataType.find({ namespace: 'Setup', name: 'SystemNotification' }),
      DataType.find({ namespace: 'Setup', name: 'Task' })
    ).subscribe(
      ([tenantDataType, notificationDataType, taskDataType]) => setState({
        tenantDataType,
        notificationDataType,
        taskDataType
      })
    );
    return () => subscription.unsubscribe();
  }, []);

  function handleClick(e) {
    session.set(USER_NOTIFIED, 'true');
    setState({ open: Boolean(e.currentTarget) });
  }

  function handleClose() {
    setState({ open: false });
  }

  if (!smUp && open) {
    handleClose();
  }

  if (!idToken) {
    return <CircularProgress />
  }

  const openDataTypeTab = (id) => {
    if (!id) {
      return;
    }
    const subject = DataTypeSubject.for(id);
    if (subject) {
      TabsSubject.next({ key: subject.key });
    }
  };

  const handleDataTypeSelected = ({ id }) => openDataTypeTab(id);

  const handlePickNotifications = () => openDataTypeTab(notificationDataType?.id);

  const handlePickTasks = () => openDataTypeTab(taskDataType?.id);

  const handlePickTenants = () => openDataTypeTab(tenantDataType?.id);

  const handleTenantSelected = ({ id }) => {
    if (ConfigService.state().tenant_id !== id) {
      ConfigService.update({ tenant_id: id });
    }
  };

  const handleQuickAccess = () => TabsSubject.next({
    key: MenuSubject.instance().key
  });

  let menu;

  if (open) {
    menu = <ClickAwayListener onClickAway={handleClose}>
      <Paper style={{
        position: 'absolute',
        background: 'white',
        border: 'gray',
        zIndex: 1101,
        right: 0,
        width: 'max-content'
      }}>
        <UserCard idToken={idToken} onClose={handleClose} />
      </Paper>
    </ClickAwayListener>;
  }

  const userNotification = user.need_password_reset && !session.get(USER_NOTIFIED)
    ? (
      <NotificationIcon
        component="svg"
        fontSize="small"
        sx={{
          color: theme.palette.error.main,
          background: theme.palette.common.white,
          borderRadius: "50%",
        }}
      />
    )
    : undefined;
  const avatar = smUp && (
    <Box sx={{ position: 'relative' }}>
      <IconButton onClick={handleClick} size="large">
        <Badge badgeContent={userNotification}>
          <Avatar alt={idToken.name} src={idToken.picture} />
        </Badge>
      </IconButton>
      {menu}
    </Box>
  );

  const dataTypeSearch = smUp && (
    <Search dataTypeSelector={DataTypeSelector}
      onSelect={({ record }) => handleDataTypeSelected(record)}
      disabled={loading} />
  );

  const tenantSearch = (
    <Search searchIcon={<HomeIcon />}
      selectorComponent={TenantSelector}
      onSelect={handleTenantSelected}
      disabled={loading} />
  );

  const brandLogo = !smUp &&
    <Box
      onClick={handleQuickAccess}
      sx={{
        transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        borderRadius: "50px",
        cursor: "pointer",
        padding: "0 .45rem 0 0",
        order: -1,
        "&:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.05)",
        },
      }}>
      <img src={brandLogoUrl()} width="40px" alt=""
        style={{ filter: 'invert(1)' }} />
    </Box>

  const taskMenu = (
    <IconButton
      color="inherit"
      disabled={loading}
      onClick={handlePickTasks}
      sx={{
        p: "4px",
        order: smUp ? -1 : 1,
      }}
      size="large">
      <TaskMenuIcon />
    </IconButton>
  );

  const notifications = (
    <IconButton
      color="inherit"
      disabled={loading}
      onClick={handlePickNotifications}
      sx={{
        p: "4px",
        order: smUp ? -1 : 1,
      }}
      size="large">
      <NotificationsIcon />
    </IconButton>
  );

  return (
    <AppBar position="absolute">
      <Toolbar>
        {brandLogo}
        {!smUp && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Menu"
            onClick={onToggle}
            disabled={loading}
            sx={{ order: 2 }}
            size="large">
            <MenuIcon />
          </IconButton>
        )}
        {/* {dataTypeSearch} */}
        <Box sx={{ flexGrow: 1 }} />
        {notifications}
        {taskMenu}
        {tenantSearch}
        {avatar}
      </Toolbar>
    </AppBar>
  );
}
