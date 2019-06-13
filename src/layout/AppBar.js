import React, {useState} from 'react';
import {
    AppBar,
    Avatar,
    CircularProgress,
    IconButton, makeStyles,
    Menu,
    MenuItem,
    Toolbar,
    Typography, useMediaQuery
} from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import AuthorizationService from "../services/AuthorizationService";
import RecordSelector from "../components/RecordSelector";
import SearchIcon from '@material-ui/icons/Search';
import HomeIcon from '@material-ui/icons/Home';
import {fade} from '@material-ui/core/styles/colorManipulator';
import TenantSelector from "../components/TenantSelector";
import useTheme from "@material-ui/core/styles/useTheme";

const useStyles = makeStyles(theme => ({
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
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
    sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
            display: 'flex',
        },
    },
    sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
}));

const DataTypeSelector = { namespace: 'Setup', name: 'DataType' };

const AdminAppBar = ({ onToggle, onTenantSelected, onDataTypeSelected, dataTypeSelectorDisabled }) => {

    const [idToken, seIdToken] = useState(null),
        [menuAnchor, setMenuAnchor] = useState(null),

        classes = useStyles(),
        inputClasses = {
            root: classes.inputRoot,
            input: classes.inputInput,
        },

        theme = useTheme(),
        xs = !useMediaQuery(theme.breakpoints.down('xs'));

    function handleClick(e) {
        setMenuAnchor(e.currentTarget);
    }

    function handleClose() {
        setMenuAnchor(null);
    }

    function handleLogout() {
        handleClose();
        AuthorizationService.logout();
    }

    if (!idToken) {
        AuthorizationService.getIdToken().then(token => seIdToken(token));
        return <CircularProgress/>
    }

    const avatar = xs && <React.Fragment>
        <IconButton onClick={handleClick}>
            <Avatar alt={idToken.name} src={idToken.picture}/>
        </IconButton>
        <Menu anchorEl={menuAnchor}
              anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right"
              }}
              getContentAnchorEl={null}
              keepMounted
              open={Boolean(menuAnchor)}
              onClose={handleClose}>
            <MenuItem onClick={handleLogout}>Sign out</MenuItem>
        </Menu>
    </React.Fragment>;

    return <div style={{ flexGrow: 1 }}>
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="Menu" onClick={onToggle}>
                    <MenuIcon/>
                </IconButton>
                {
                    xs &&
                    <Typography variant="h6">
                        Admin
                    </Typography>
                }
                <div className={classes.search}>
                    <div className={classes.searchIcon}>
                        <SearchIcon/>
                    </div>
                    <RecordSelector dataTypeSelector={DataTypeSelector}
                                    onSelect={onDataTypeSelected}
                                    inputClasses={inputClasses}
                                    disabled={dataTypeSelectorDisabled}/>
                </div>
                <div className={classes.grow}/>
                <div className={classes.search}>
                    <div className={classes.searchIcon}>
                        <HomeIcon/>
                    </div>
                    <TenantSelector inputClasses={inputClasses} onSelect={onTenantSelected}/>
                </div>
                {avatar}
            </Toolbar>
        </AppBar>
    </div>
};

export default AdminAppBar;