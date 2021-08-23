import { CircularProgress, Drawer, makeStyles } from "@material-ui/core";
import React from "react";
import UserCard from "./UserCard";
import { useMainContext } from "../layout/MainContext";

const AdminDrawer = ({ children, onClose }) => {

    const [mainContextState] = useMainContext();

    const { idToken, docked } = mainContextState;

    if (!idToken) return <CircularProgress/>;

    const modalStyles =  makeStyles((theme) => ({
        root: {
            backdropFilter: 'blur(6px) saturate(120%)',
            '& .MuiBackdrop-root':  {
                backgroundColor:  "rgba(0, 0, 0, 0.05)"
            },
        },
      }));

    const classes = modalStyles();
   

    return <Drawer open={docked} onClose={onClose} anchor='right' classes={classes}>
        <UserCard idToken={idToken} onClose={onClose}/>
        {children}
    </Drawer>
};

export default AdminDrawer;
