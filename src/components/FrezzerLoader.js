import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Loading from "./Loading";


const useStyles = makeStyles(theme => ({
    loader: {
        zIndex: 3,
        opacity: 0.6,
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: theme.palette.background.paper
    }
}));

export default function () {
    const classes = useStyles();
    return (
        <div className={classes.loader}>
            <Loading/>
        </div>
    );
}
