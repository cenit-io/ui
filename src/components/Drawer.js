import { CircularProgress, Drawer } from "@material-ui/core";
import React from "react";
import UserCard from "./UserCard";

const AdminDrawer = ({ idToken, children, docked, onClose }) => {

    if (!idToken) return <CircularProgress/>;

    return <Drawer open={docked} onClose={onClose}>
        <UserCard idToken={idToken} onClose={onClose}/>
        {children}
    </Drawer>
};

export default AdminDrawer;
