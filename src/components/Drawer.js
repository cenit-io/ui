import { CircularProgress, Drawer } from "@material-ui/core";
import React from "react";
import UserCard from "./UserCard";

const AdminDrawer = ({ idToken, navigation, docked, onClose }) => {

    if (!idToken) return <CircularProgress/>;

    return <Drawer open={docked} onClose={onClose}>
        <UserCard idToken={idToken} onClose={onClose}/>
        {navigation}
    </Drawer>
};

export default AdminDrawer;
