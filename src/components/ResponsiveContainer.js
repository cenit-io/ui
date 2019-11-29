import React from 'react';
import { useMediaQuery, makeStyles, useTheme } from "@material-ui/core/index";
import clsx from 'clsx';

const styles = makeStyles(theme => ({
    formContainer: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        overflow: 'auto',
        boxSizing: 'border-box',
        flexGrow: 1
    },
    mdFormContainer: {
        paddingLeft: '25%',
        paddingRight: '25%',
    },
    smFormContainer: {
        paddingLeft: '15%',
        paddingRight: '15%',
    }
}));

function ResponsiveContainer({ docked, forwardRef, children }) {

    const classes = styles();
    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));
    const md = useMediaQuery(theme.breakpoints.up('md'));

    return <div ref={forwardRef}
                className={
                    clsx(
                        classes.formContainer,
                        !xs && classes.smFormContainer,
                        md && classes.mdFormContainer
                    )}>

        {children}
    </div>;
};

export default ResponsiveContainer;
