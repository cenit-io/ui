import React from 'react';
import { makeStyles } from "@material-ui/core/styles";
import NotDefinedIcon from "../icons/NotDefinedIcon";
import CheckIcon from "../icons/CheckIcon";
import FalseIcon from "../icons/FalseIcon";

const useStyles = makeStyles(theme => ({
    true: {
        color: theme.palette.success.main
    },
    false: {
        color: theme.palette.error.main
    },
    undefined: {
        color: theme.palette.text.secondary
    },
    null: {
        color: theme.palette.text.secondary
    }
}));

export default function BooleanViewer({ value }) {
    const classes = useStyles();

    const Icon = value === undefined || value === null
        ? NotDefinedIcon
        : (value ? CheckIcon : FalseIcon);

    return <Icon className={classes[String(value)]} fontSize="small"/>;
}
