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
        display: 'grid',
        width: '100%',
        gridTemplateColumns: 'repeat(auto-fit,minmax(400px ,1fr))',
        gap:'2px',
        maxHeight:'100%'
    }

}));

export const FormGroup = ({ children, error }) => {

    const classes = useStyles();
    const className = clsx('relative', classes.wrapper, (error && classes.errorStyle) || classes.defaultStyle);

    return <div className={className}>
        {children}
    </div>;
};
