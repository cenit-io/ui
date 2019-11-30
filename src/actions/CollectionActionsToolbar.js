import React from 'react';
import { makeStyles, Toolbar, Typography, Chip } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionPicker from "./ActionPicker";
import { ActionKind } from "./ActionRegistry";

const useToolbarStyles = makeStyles(theme => ({
    root: {
        paddingLeft: theme.spacing(1),
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

function CollectionActionsToolbar({ title, arity, onAction, selectedKey, onRefresh }) {
    const classes = useToolbarStyles();

    return (
        <Toolbar className={classes.root}>
            <div className={classes.title}>
                <Typography variant="h6">
                    {title}
                </Typography>
            </div>
            <div className={classes.spacer}/>
            {arity > 0 && <Chip label={`${arity} selected`} color='secondary'/>}
            <div className={classes.spacer}/>
            <ActionPicker kind={ActionKind.collection}
                          arity={arity}
                          onAction={onAction}
                          selectedKey={selectedKey}/>
        </Toolbar>
    );
};

export default CollectionActionsToolbar;
