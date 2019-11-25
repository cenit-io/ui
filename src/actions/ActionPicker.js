import React from 'react';
import { makeStyles, Tooltip } from "@material-ui/core";
import IconButton from '@material-ui/core/IconButton';
import ActionRegistry, { ActionKind } from "./ActionRegistry";

const useToolbarStyles = makeStyles(theme => ({
    actions: {
        display: 'flex',
        color: theme.palette.text.secondary,
    }
}));

function ActionPicker({ disabled, kind, arity, selectedKey, onAction }) {
    const classes = useToolbarStyles();

    const handleAction = actionKey => () => onAction(actionKey);
    if (arity === 1) {
        kind = ActionKind.member;
    }

    let actions = ActionRegistry.findBy({ kind, arity }, { kind: ActionKind.bulk }).map(
        action => {
            const Icon = action.icon;

            return <Tooltip key={`action_${action.key}`}
                            title={action.title}>
                <IconButton aria-label={action.title}
                            color={selectedKey === action.key ? (action.activeColor || 'primary') : 'default'}
                            onClick={handleAction(action.key)}
                            disabled={disabled}>
                    <Icon/>
                </IconButton>
            </Tooltip>
        }
    );

    return <div className={classes.actions}>
        {actions}
    </div>;
};

export default ActionPicker;
