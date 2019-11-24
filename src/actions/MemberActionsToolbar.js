import React from 'react';
import { makeStyles, Toolbar, Typography } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionPicker from "./ActionPicker";
import { ActionKind } from "./ActionRegistry";

const useToolbarStyles = makeStyles(theme => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
        height: appBarHeight(theme)
    },
    title: {
        flex: '0 0 auto',
    },
    spacer: {
        flex: '1 1 100%',
    }
}));

const MemberActionsToolbar = ({ title, arity, onAction, kind, selectedKey }) => {
    const classes = useToolbarStyles();

    return (
        <Toolbar className={classes.root}>
            <div className={classes.title}>
                <Typography variant="h6">
                    {title}
                </Typography>
            </div>
            <div className={classes.spacer}/>
            <ActionPicker kind={ActionKind.member}
                          arity={1}
                          onAction={onAction}/>
        </Toolbar>
    );
};

export default MemberActionsToolbar;
