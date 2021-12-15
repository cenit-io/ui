import React, { useEffect } from 'react';
import {
    AppBar,
    Avatar,
    CircularProgress, ClickAwayListener,
    IconButton, makeStyles,
    Paper,
    Toolbar,
    Typography, useMediaQuery
} from "@material-ui/core";
import HomeIcon from '@material-ui/icons/Home';
import { fade } from '@material-ui/core/styles/colorManipulator';
import TenantSelector from "../components/TenantSelector";
import useTheme from "@material-ui/core/styles/useTheme";
import UserCard from "../components/UserCard";
import ConfigService from "../services/ConfigService";
import { DataTypeSubject, MenuSubject, TabsSubject } from "../services/subjects";
import Search from "../components/Search";
import MenuIcon from "../icons/MenuIcon";
import QuickAccessIcon from "../icons/QuickAccessIcon";
import { useTenantContext } from "./TenantContext";
import { useMainContext } from "./MainContext";
import zzip from "../util/zzip";
import { DataType } from "../services/DataTypeService";
import { useSpreadState } from "../common/hooks";
import NotificationsIcon from "../icons/NotificationsIcon";
import { TaskMenuIcon } from "../config/dataTypes/Setup/Task";
import { TenantMenuIcon } from "../config/dataTypes/Account";
import CenitAdminLogo from "../img/Cenit_IO_Admin_app_Identidad.svg";
import TenantActiveInfo from '../components/TenantActiveInfo';

export const appBarHeight = theme => `${theme.spacing(8)}px`;

const useStyles = makeStyles(theme => ({
    grow: {
        flexGrow: 1,
    },
    changeOrder:{   
        order: -1,
        [theme.breakpoints.up('sm')]: {
            order: 'initial'
        }
    },
    moveRight:{
        order: 1
    },
    brandContainer: {
        transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        borderRadius: "50px",
        cursor: "pointer",
        padding: ".75rem .75rem .75rem 0",
        order: -1,
        '&:hover': {
            backgroundColor: fade(theme.palette.common.black, 0.05)
        },
    
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginRight: theme.spacing(2),
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(3),
            width: 'auto',
        },
    },
    searchIcon: {
        width: theme.spacing(7),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 7),
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: 200,
        },
    },
    quickAccess: {
        marginLeft: theme.spacing(2)
    }
}));

export const DataTypeSelector = { namespace: 'Setup', name: 'DataType' };

export default function ({ onToggle }) {

    const [state, setState] = useSpreadState();

    const { idToken } = useMainContext()[0];

    const [tenantState] = useTenantContext();

    const { loading } = tenantState;

    const classes = useStyles();

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
        setState({ open: Boolean(e.currentTarget) });
    }

    function handleClose() {
        setState({ open: false });
    }

    if (!smUp && open) {
        handleClose();
    }

    if (!idToken) {
        return <CircularProgress/>
    }

    const handleDataTypeSelected = ({ id }) => TabsSubject.next({
        key: DataTypeSubject.for(id).key
    });

    const handlePickNotifications = () => TabsSubject.next({
        key: DataTypeSubject.for(notificationDataType.id).key
    });

    const handlePickTasks = () => TabsSubject.next({
        key: DataTypeSubject.for(taskDataType.id).key
    });

    const handlePickTenants = () => TabsSubject.next({
        key: DataTypeSubject.for(tenantDataType.id).key
    });

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
                <UserCard idToken={idToken} onClose={handleClose}/>
            </Paper>
        </ClickAwayListener>;
    }

    const avatar = smUp && (
        <div style={{ position: 'relative' }}>
            <IconButton onClick={handleClick}>
                <Avatar alt={idToken.name} src={idToken.picture}/>
            </IconButton>
            {menu}
        </div>
    );

    const dataTypeSearch = smUp && (
        <Search dataTypeSelector={DataTypeSelector}
                onSelect={({ record }) => handleDataTypeSelected(record)}
                disabled={loading}/>
    );

    const tenantSearch = (
        <Search searchIcon={<HomeIcon/>}
                selectorComponent={TenantSelector}
                onSelect={handleTenantSelected}
                disabled={loading}/>
        );

    const brandLogo = !smUp && 
        <div onClick={handleQuickAccess} className={classes.brandContainer}>
            <img src={CenitAdminLogo} width="100px" alt=""  style={{filter: 'invert(1)'}}/>
        </div>

    const taskMenu = smUp && (
      <IconButton
        color="inherit"
        disabled={loading}
        onClick={handlePickTasks}
        className={smUp ? classes.changeOrder : ""}
      >
        <TaskMenuIcon />
      </IconButton>
    );   

    const notification = smUp && (
      <IconButton
        color="inherit"
        disabled={loading}
        onClick={handlePickNotifications}
        className={smUp ? classes.changeOrder : ""}
      >
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
              className={classes.moveRight}
            >
              <MenuIcon />
            </IconButton>
          )}
          {/* {dataTypeSearch} */}
          <div className={classes.grow} />
          {notification}  
          {taskMenu}  
          {tenantSearch}
          {avatar}
          {smUp && <TenantActiveInfo />}
        </Toolbar>
      </AppBar>
    );
};
