import {Avatar, Drawer, IconButton} from "@material-ui/core";
import ExitIcon from '@material-ui/icons/ExitToApp';
import React from "react";
import AuthorizationService from "../services/AuthorizationService";

const AdminDrawer = ({ idToken, navigation, docked, onClose }) => {

    const avatar = idToken && <Avatar alt={idToken.name} src={idToken.picture}/>;

    function logout() {
        onClose();
        AuthorizationService.logout();
    }

    return <Drawer open={docked} onClose={onClose}>
        <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
            {avatar}
            <IconButton variant="contained"
                        color="secondary"
                        size="small"
                        onClick={logout}>
                <ExitIcon/>
            </IconButton>
        </div>
        {navigation}
    </Drawer>
};

export default AdminDrawer;