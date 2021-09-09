import React from 'react';
import { makeStyles } from "@material-ui/core";
import clsx from 'clsx';
import '../common/FlexBox.css';

const useStyles = makeStyles(theme => ({
    defaultStyle: {
        borderLeft: 'solid',
        borderLeftColor: theme.palette.text.secondary
    },
    errorStyle: {
        borderLeft: 'solid',
        borderLeftColor: theme.palette.error.light
    },
    wrapper:{
        margin: '10px',
        boxShadow: "0 2px 5px 1px rgb(64 60 67 / 16%)",
        borderRadius: "6px",
        backgroundColor: "#fff",
    }

}));

export const FormGroup = ({ children, error }) => {

    const classes = useStyles();
    const className = clsx('flex column full-width relative', classes.wrapper, (error && classes.errorStyle) || classes.defaultStyle);

    return <div className={className}>
        {children}
    </div>;
};
