import React, {useState} from 'react';
import {
    AppBar,
    Avatar,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography
} from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import AuthorizationService from "../services/AuthorizationService";

const AdminAppBar = ({ onToggle }) => {

    const [idToken, seIdToken] = useState(null),
        [menuAnchor, setMenuAnchor] = useState(null);

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

    return <div style={{ flexGrow: 1 }}>
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="Menu" onClick={onToggle}>
                    <MenuIcon/>
                </IconButton>
                <Typography variant="h6" style={{ flexGrow: 1 }}>
                    News
                </Typography>
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
            </Toolbar>
        </AppBar>
    </div>
};

export default AdminAppBar;