import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';
import Fab from '@material-ui/core/Fab';
import CheckIcon from '@material-ui/icons/Check';
import SaveIcon from '@material-ui/icons/Save';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        alignItems: 'center',
    },
    wrapper: {
        margin: theme.spacing(1),
        position: 'relative',
    },
    loading: {
        backgroundColor: theme.palette.primary.light
    },
    fabProgress: {
        color: theme.palette.primary.main,
        position: 'absolute',
        top: -6,
        left: -6,
        zIndex: 1101,
    }
}));

export default function LoadingButton({ loading, success, onClick, className }) {
    const classes = useStyles();

    const fabClassName = clsx({
        [classes.loading]: loading,
    });

    const rootClassname = clsx(classes.root, className);

    return (
        <div className={rootClassname}>
            <div className={classes.wrapper}>
                <Fab aria-label="save"
                     color="primary"
                     className={fabClassName}
                     onClick={() => !(loading || success) && onClick()}>
                    {success ? <CheckIcon/> : <SaveIcon/>}
                </Fab>
                {loading && <CircularProgress size={68} className={classes.fabProgress}/>}
            </div>
        </div>
    );
}
