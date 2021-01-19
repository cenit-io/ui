import { CircularProgress, Drawer } from "@material-ui/core";
import React from "react";
import UserCard from "./UserCard";
import { useMainContext } from "../layout/MainContext";

const AdminDrawer = ({ children, onClose }) => {

    const [mainContextState] = useMainContext();

    const { idToken, docked } = mainContextState;

    if (!idToken) return <CircularProgress/>;

    return <Drawer open={docked} onClose={onClose}>
        <UserCard idToken={idToken} onClose={onClose}/>
        {children}
    </Drawer>
};

export default AdminDrawer;
