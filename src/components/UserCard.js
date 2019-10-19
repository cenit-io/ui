import {Avatar, CircularProgress, Button, Typography} from "@material-ui/core";
import ExitIcon from '@material-ui/icons/ExitToApp';
import React from "react";
import AuthorizationService from "../services/AuthorizationService";

const UserCard = ({ idToken, onClose }) => {

    if (!idToken) return <CircularProgress/>;

    const avatar = <Avatar alt={idToken.name} src={idToken.picture} style={{ width: '60px', height: '60px' }}/>;

    function logout() {
        onClose && onClose();
        AuthorizationService.logout();
    }

    return <div style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {avatar}
            </div>
            <div style={{
                flexGrow: 1,
                flexDirection: 'column',
                textAlign: 'right',
                marginLeft: '10px',
                wordBreak: 'break-word',
                maxWidth: '160px'
            }}>
                <Typography component="div" variant="subtitle2">
                    {idToken.name}
                </Typography>
                <Typography component="div" variant="caption">
                    {idToken.email}
                </Typography>
            </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button variant="contained"
                    color="secondary"
                    size="small"
                    onClick={logout}>
                Logout
                <ExitIcon/>
            </Button>
        </div>
    </div>;
};

export default UserCard;