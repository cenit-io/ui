import {Avatar, CircularProgress, Drawer} from "@material-ui/core";
import React from "react";
import AuthorizationService from "../services/AuthorizationService";
import UserCard from "./UserCard";

const AdminDrawer = ({ idToken, navigation, docked, onClose }) => {

    if (!idToken) return <CircularProgress/>;

    const avatar = <Avatar alt={idToken.name} src={idToken.picture} style={{ width: '60px', height: '60px' }}/>;

    function logout() {
        onClose();
        AuthorizationService.logout();
    }

    return <Drawer open={docked} onClose={onClose}>
        <UserCard idToken={idToken} onClose={onClose}/>
        {navigation}
    </Drawer>
};

export default AdminDrawer;