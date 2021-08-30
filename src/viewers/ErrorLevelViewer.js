import React from 'react';
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";

const useColorStyle = makeStyles(theme => ({
    error: {
        color: theme.palette.error.main,
    },
    warning: {
        color: theme.palette.warning.main
    },
    notice: {
        color: theme.palette.info.main
    },
    info: {
        color: theme.palette.success.main
    }
}));

const useBackgroundStyle = makeStyles(theme => ({
    root: {
        padding: theme.spacing(.5, 0.1),
        borderRadius: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        textTransform: 'capitalize'
    },
    error: {
        background: theme.palette.error.light,
        color: theme.palette.getContrastText(theme.palette.error.light)
    },
    warning: {
        background: theme.palette.warning.light,
        color: theme.palette.getContrastText(theme.palette.warning.light)
    },
    notice: {
        background: theme.palette.info.light,
        color: theme.palette.getContrastText(theme.palette.info.light)
    },
    info: {
        background: theme.palette.success.light,
        color: theme.palette.getContrastText(theme.palette.success.light)
    }
}));

export default (levelProjection, mode) => ({ value, item }) => {

    const classes = mode === 'background' ? useBackgroundStyle() : useColorStyle();

    const str = (value === undefined || value === null)
        ? '-'
        : String(value);

    return (
      <div className={clsx(classes.root)}>
        <div style={{ marginRight: "0.5rem"}}>
          <div
            style={{ width: "10px", height: "10px", borderRadius: "50%" }}
            className={classes[levelProjection(item)]}
          ></div>
        </div>
        <div style={{ width: "90%" }}>{str}</div>
      </div>
    ); 
};
