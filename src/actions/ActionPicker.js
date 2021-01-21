import React, { useEffect, useState } from 'react';
import { makeStyles, Tooltip } from "@material-ui/core";
import IconButton from '@material-ui/core/IconButton';
import ActionRegistry, { ActionKind } from "./ActionRegistry";

const useToolbarStyles = makeStyles(theme => ({
    actions: {
        display: 'flex',
        color: theme.palette.text.secondary,
    }
}));

function match(target, criteria) {
    const keys = Object.keys(criteria);
    let i = 0;
    while (i < keys.length) {
        if (criteria[keys[i]] !== target[keys[i]]) {
            return false;
        }
        i++;
    }
    return true;
}

function ActionPicker({ disabled, kind, arity, selectedKey, onAction, dataType }) {
    const [actions, setActions] = useState([]);
    const classes = useToolbarStyles();

    useEffect(() => {
        if (dataType) {
            const subscription = dataType.config().subscribe(config => {
                const k = arity === 1 ? ActionKind.member : kind;
                const actions = [];

                ActionRegistry.findBy(
                    { kind: k, arity },
                    { kind: k, bulkable: true },
                    { kind: undefined, arity },
                    { kind: undefined, bulkable: true },
                ).forEach(
                    action => {
                        if (!action.onlyFor || action.onlyFor.find(criteria => match(dataType, criteria))) {
                            if (
                                !config.crud || !action.crud || (
                                    !config.crud.find(op => action.crud.indexOf(op) === -1)
                                )) {
                                actions.push(action)
                            }
                        }
                    }
                );

                setActions(actions);
            });

            return () => subscription.unsubscribe();
        } else {
            setActions([]);
        }
    }, [dataType, arity, kind]);

    const handleAction = actionKey => () => onAction(actionKey);

    const actionsControls = actions.map(
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
        {actionsControls}
    </div>;
}

export default ActionPicker;
