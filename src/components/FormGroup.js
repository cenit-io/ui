import React from 'react';
import {makeStyles} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderLeft: 'solid',
        borderLeftColor: theme.palette.text.secondary
    }
}));

export const FormGroup = ({ children }) => {

    const classes = useStyles();

    return <div className={classes.formGroup}>
        {children}
    </div>
};
