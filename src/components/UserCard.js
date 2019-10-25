import { Avatar, CircularProgress, Button, Typography, makeStyles } from "@material-ui/core";
import ExitIcon from '@material-ui/icons/ExitToApp';
import React from "react";
import AuthorizationService from "../services/AuthorizationService";

const useStyles = makeStyles(theme => ({
    root: {
        padding: `${theme.spacing(1)}px`,
        display: 'flex',
        flexDirection: 'column'
    },
    profile: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    avatarContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatar: {
        width: `${theme.spacing(8)}px`,
        height: `${theme.spacing(8)}px`,
    },
    profileData: {
        flexGrow: 1,
        flexDirection: 'column',
        textAlign: 'right',
        marginLeft: `${theme.spacing(1)}px`,
        wordBreak: 'break-word',
        maxWidth: `${theme.spacing(20)}px`
    },
    logout: {
        display: 'flex',
        justifyContent: 'flex-end'
    }
}));

const UserCard = ({ idToken, onClose }) => {

    const classes = useStyles();

    if (!idToken) return <CircularProgress/>;

    const avatar = <Avatar alt={idToken.name} src={idToken.picture} className={classes.avatar}/>;

    function logout() {
        onClose && onClose();
        AuthorizationService.logout();
    }

    return <div className={classes.root}>
        <div className={classes.profile}>
            <div className={classes.avatarContainer}>
                {avatar}
            </div>
            <div className={classes.profileData}>
                <Typography component="div" variant="subtitle2">
                    {idToken.name}
                </Typography>
                <Typography component="div" variant="caption">
                    {idToken.email}
                </Typography>
            </div>
        </div>
        <div className={classes.logout}>
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
