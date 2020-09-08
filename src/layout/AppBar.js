import React, { useState } from 'react';
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

export const appBarHeight = theme => `${theme.spacing(8)}px`;

const useStyles = makeStyles(theme => ({
    grow: {
        flexGrow: 1,
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

export default function ({ onToggle, idToken, disabled }) {

    const [open, setOpen] = useState(false);

    const classes = useStyles();

    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'));

    function handleClick(e) {
        setOpen(e.currentTarget);
    }

    function handleClose() {
        setOpen(null);
    }

    if (!smUp && open) {
        handleClose();
    }

    if (!idToken) {
        return <CircularProgress/>
    }

    const handleDataTypeSelected = ({ id }) => TabsSubject.next(DataTypeSubject.for(id).key);

    const handleTenantSelected = ({ id }) => {
        if (ConfigService.state().tenant_id !== id) {
            ConfigService.update({ tenant_id: id });
        }
    };

    const handleQuickAccess = () => TabsSubject.next(MenuSubject.instance().key);

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
                <UserCard idToken={idToken}/>
            </Paper>
        </ClickAwayListener>;
    }

    const avatar = smUp && <div style={{ position: 'relative' }}>
        <IconButton onClick={handleClick}>
            <Avatar alt={idToken.name} src={idToken.picture}/>
        </IconButton>
        {menu}
    </div>;

    return <AppBar position="fixed">
        <Toolbar>
            <IconButton edge="start"
                        color="inherit"
                        aria-label="Menu"
                        onClick={onToggle}
                        disabled={disabled}>
                <MenuIcon/>
            </IconButton>
            {
                smUp &&
                <Typography variant="h6">
                    Admin
                </Typography>
            }
            <IconButton className={classes.quickAccess}
                        color="inherit"
                        disabled={disabled}
                        onClick={handleQuickAccess}>
                <QuickAccessIcon/>
            </IconButton>
            <Search dataTypeSelector={DataTypeSelector}
                    onSelect={({ record }) => handleDataTypeSelected(record)}
                    disabled={disabled}/>
            <div className={classes.grow}/>
            <Search searchIcon={<HomeIcon/>}
                    selectorComponent={TenantSelector}
                    onSelect={handleTenantSelected}
                    disabled={disabled}/>
            {avatar}
        </Toolbar>
    </AppBar>
};
