import React from 'react';
import { makeStyles, Toolbar, Tooltip, Typography } from "@material-ui/core";
import IconButton from '@material-ui/core/IconButton';
import clsx from "clsx";
import { lighten } from "@material-ui/core/styles";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";

const useToolbarStyles = makeStyles(theme => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
        height: appBarHeight(theme)
    },
    highlight:
        theme.palette.type === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        display: 'flex',
        color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
}));

const ActionToolbar = ({ title, arity, onAction, kind, selectedKey }) => {
    const classes = useToolbarStyles();
    const handleAction = actionKey => () => onAction(actionKey);

    if (arity === 1) {
        kind = ActionKind.member;
    }

    let actions = ActionRegistry.findBy({ kind, arity }).map(
        action => {
            const Icon = action.icon;

            return <Tooltip key={`action_${action.key}`}
                            title={action.title}>
                <IconButton aria-label={action.title}
                            color={action.key === selectedKey ? 'primary' : 'default'}
                            onClick={handleAction(action.key)}>
                    <Icon/>
                </IconButton>
            </Tooltip>
        }
    );

    return (
        <Toolbar className={clsx(classes.root, { [classes.highlight]: arity > 0 })}>
            <div className={classes.title}>
                {arity > 0 ? (
                    <Typography color="inherit" variant="subtitle1">
                        {arity} selected
                    </Typography>
                ) : (
                    <Typography variant="h6" id="tableTitle">
                        {title}
                    </Typography>
                )}
            </div>
            <div className={classes.spacer}/>
            <div className={classes.actions}>
                {actions}
            </div>
        </Toolbar>
    );
};

export default ActionToolbar;
