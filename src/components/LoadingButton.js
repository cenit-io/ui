import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';
import Fab from '@material-ui/core/Fab';
import CheckIcon from '@material-ui/icons/Check';
import SaveIcon from '@material-ui/icons/SaveOutlined';
import { Close } from '@material-ui/icons';
import { Tooltip } from '@material-ui/core';

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
        top: 0,
        left: 0,
        zIndex: 1101,
    },
    fabCustom:{
        borderRadius: "2px"
    }
}));

export default function LoadingButton({ loading, success, onClick, onClickCancel, className, actionIcon }) {
    const classes = useStyles();

    const fabClassName = clsx({
        [classes.loading]: loading,
    });

    const rootClassname = clsx(classes.root, className);

    return (
      <div className={rootClassname}>
        <div className={classes.wrapper}>
          <Tooltip arrow title="Save">
          <Fab
            aria-label="save"
            size="small"
            className={classes.fabCustom}
            onClick={() => !(loading || success) && onClick()}
          >
            {success ? <CheckIcon /> : actionIcon || <SaveIcon />}
          </Fab>
          </Tooltip>
          {loading && (
            <CircularProgress size={40} className={classes.fabProgress} />
          )}
        </div>

        {success ||
          (!loading && (
            <div className={classes.wrapper}>
              <Tooltip arrow title="Cancel">
              <Fab
                aria-label="cancel"
                size="small"
                className={classes.fabCustom}
                onClick={() => !(loading || success) && onClickCancel()}
              >
                <Close />
              </Fab>
              </Tooltip>
            </div>
          ))}
      </div>
    );
}
