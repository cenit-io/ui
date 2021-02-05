import React from 'react';
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";

const useColorStyle = makeStyles(theme => ({
    create: {
        color: theme.palette.success.main,
    },
    updated: {
        color: theme.palette.info.main
    },
    delete: {
        color: theme.palette.error.main
    },
    cross: {
        color: theme.palette.primary.light
    }
}));

const useBackgroundStyle = makeStyles(theme => ({
    root: {
        padding: theme.spacing(.5, 1),
        borderRadius: theme.spacing(1),
        textAlign: 'center'
    },
    create: {
        background: theme.palette.success.light,
        color: theme.palette.getContrastText(theme.palette.success.light)
    },
    update: {
        background: theme.palette.info.light,
        color: theme.palette.getContrastText(theme.palette.info.light)
    },
    delete: {
        background: theme.palette.error.light,
        color: theme.palette.getContrastText(theme.palette.error.light)
    },
    cross: {
        background: theme.palette.primary.light,
        color: theme.palette.getContrastText(theme.palette.primary.light)
    }
}));

export default (levelProjection, mode) => ({ value, item }) => {

    const classes = mode === 'background' ? useBackgroundStyle() : useColorStyle();

    const str = (value === undefined || value === null)
        ? '-'
        : String(value);

    return <div className={clsx(classes.root, classes[levelProjection(item)])}>{str}</div>;
};
