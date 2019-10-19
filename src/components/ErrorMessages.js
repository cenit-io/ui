import React from 'react';
import {makeStyles} from '@material-ui/core';
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles(theme => ({
    error: {
        color: theme.palette.error.main
    }
}));

const ErrorMessages = ({ errors, position, children }) => {
    const classes = useStyles();

    const errorMsgs = (((errors && errors.constructor === Array) ? errors : (errors && errors.$)) || [])
        .map((msg, index) => <Typography key={`msg${index}`}
                                         className={classes.error}
                                         variant="caption"
                                         display="block"
                                         gutterBottom>
                {msg}
            </Typography>
        );


    return <React.Fragment>
        {position === 'top' && errorMsgs}
        {children}
        {(!position || position !== 'top') && errorMsgs}
    </React.Fragment>;
};

export default ErrorMessages;
