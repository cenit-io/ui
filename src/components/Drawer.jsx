import { CircularProgress, Drawer } from "@mui/material";
import React from "react";
import UserCard from "./UserCard";
import { useMainContext } from "../layout/MainContext";

const AdminDrawer = ({ children, onClose }) => {

  const [mainContextState] = useMainContext();

  const { idToken, docked } = mainContextState;

  if (!idToken) return <CircularProgress />;

  return <Drawer
    open={docked}
    onClose={onClose}
    anchor='right'
    ModalProps={{
      BackdropProps: {
        sx: {
          backdropFilter: 'blur(6px) saturate(120%)',
          backgroundColor: "rgba(0, 0, 0, 0.05)"
        }
      }
    }}>
    <UserCard idToken={idToken} onClose={onClose} />
    {children}
  </Drawer>
};

export default AdminDrawer;
