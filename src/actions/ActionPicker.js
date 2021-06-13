import React, { useEffect, useRef } from 'react';
import { makeStyles, Tooltip } from "@material-ui/core";
import IconButton from '@material-ui/core/IconButton';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { useContainerContext } from "./ContainerContext";
import { useSpreadState } from "../common/hooks";
import useResizeObserver from "@react-hook/resize-observer";
import useTheme from "@material-ui/core/styles/useTheme";
import MoreIcon from "@material-ui/icons/MoreVert";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Menu from "@material-ui/core/Menu";
import clsx from "clsx";

const useToolbarStyles = makeStyles(theme => ({
    actions: {
        display: 'flex',
        flexGrow: 1,
        color: theme.palette.text.secondary,
        minWidth: theme.spacing(6),
        overflow: 'hidden',
        paddingLeft: theme.spacing(0.5),
        justifyContent: 'flex-end'
    },
    selected: {
        background: theme.palette.background.default
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
    const [state, setState] = useSpreadState({
        actions: [],
        width: 0
    });

    const theme = useTheme();
    const classes = useToolbarStyles();

    const { actions, width, moreEl, config } = state;

    const [containerState] = useContainerContext();

    const { selectedItems } = containerState;

    const frame = useRef(null);

    useEffect(() => {
        if (dataType) {
            const subscription = dataType.config().subscribe(config => {
                const k = arity === 1 ? ActionKind.member : kind;
                const actions = [];

                (
                    config.onlyActions ||
                    ActionRegistry.findBy(
                        { kind: k, arity },
                        { kind: k, bulkable: true },
                        { kind: undefined, arity },
                        { kind: undefined, bulkable: true },
                    )
                ).forEach(
                    action => {
                        if (
                            (!action.onlyFor || action.onlyFor.find(criteria => match(dataType, criteria))) &&
                            (!action.onlyForMembers || (
                                selectedItems.length === 1 && action.onlyForMembers.find(
                                    criteria => match(selectedItems[0], criteria)
                                )
                            ))
                        ) {
                            if (
                                action.onlyFor || !config.crud || !action.crud || (
                                    !action.crud.find(op => config.crud.indexOf(op) === -1)
                                )) {
                                actions.push(action)
                            }
                        }
                    }
                );

                setState({ actions, config });
            });

            return () => subscription.unsubscribe();
        } else {
            setState({ actions: [] });
        }
    }, [dataType, arity, kind, selectedItems]);

    useResizeObserver(frame, entry => setState({ width: Math.floor(entry.contentRect.width) }));

    const handleAction = actionKey => () => {
        setState({ moreEl: null });
        onAction(actionKey);
    };

    let max = Math.max(0, Math.floor((width - theme.spacing(0.5)) / theme.spacing(6)));

    if (max < actions.length) {
        max--;
    }

    const iconFor = action => (config.actions && config.actions[action.key]?.icon) || action.icon;

    const actionsControls = [];

    let cursor = 0;
    for (let i = 0; i < max && i < actions.length; i++) {
        cursor++;
        const action = actions[i];

        const Icon = iconFor(action);

        const title = typeof action.title === "function"
            ? action.title.call(this, containerState)
            : action.title;

        actionsControls.push(
            <Tooltip key={`action_${action.key}`}
                     title={title}>
                <IconButton aria-label={action.title}
                            color={selectedKey === action.key ? (action.activeColor || 'primary') : 'default'}
                            onClick={handleAction(action.key)}
                            disabled={disabled}
                            className={clsx(selectedKey === action.key && classes.selected)}>
                    <Icon/>
                </IconButton>
            </Tooltip>
        );
    }

    let menu;
    if (max < actions.length) {
        actionsControls.push(
            <Tooltip key="_more_actions" title="More">
                <IconButton disabled={disabled} onClick={({ target }) => setState({ moreEl: target })}>
                    <MoreIcon/>
                </IconButton>
            </Tooltip>
        );
        menu = [];
        while (cursor < actions.length) {
            const action = actions[cursor];
            const Icon = iconFor(action);
            const title = typeof action.title === "function"
                ? action.title.call(this, containerState)
                : action.title;
            menu.push(
                <MenuItem key={`action_${action.key}`} button onClick={handleAction(action.key)}>
                    <ListItemIcon>
                        <Icon/>
                    </ListItemIcon>
                    {title}
                </MenuItem>
            );
            cursor++;
        }
        menu = (
            <Menu anchorEl={moreEl}
                  keepMounted
                  open={Boolean(moreEl)}
                  onClose={() => setState({ moreEl: null })}>
                {menu}
            </Menu>
        );
    }

    return (
        <div className={classes.actions} ref={frame}>
            {actionsControls}
            {menu}
        </div>
    );
}

export default ActionPicker;
