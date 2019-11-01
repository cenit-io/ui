import React, { useState } from 'react';
import Loading from '../components/Loading';
import { makeStyles, Toolbar, Tooltip, Typography, withStyles } from "@material-ui/core";
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import clsx from "clsx";
import { lighten } from "@material-ui/core/styles";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";

import Index from "./Index";
import New from './New';
import Show from "./Show";

const useToolbarStyles = makeStyles(theme => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
        height: ({ height }) => `calc(${height})`
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

const ActionToolbar = ({ title, selectedCount, onAction, kind, selectedKey }) => {
    const classes = useToolbarStyles();
    const handleAction = actionKey => () => onAction(actionKey);

    let actions;

    if (selectedCount > 0) {
        actions = <Tooltip title="Delete">
            <IconButton aria-label="Delete">
                <DeleteIcon/>
            </IconButton>
        </Tooltip>;
    } else {
        actions = ActionRegistry.findBy({ kind }).map(
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
    }

    return (
        <Toolbar className={clsx(classes.root, { [classes.highlight]: selectedCount > 0 })}>
            <div className={classes.title}>
                {selectedCount > 0 ? (
                    <Typography color="inherit" variant="subtitle1">
                        {selectedCount} selected
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

const styles = theme => ({
    root: {
        width: '100%',
        overflow: 'auto',
        position: 'relative'
    }
});

function ActionContainer({ docked, item, height, width, classes, theme, onSelectItem, kind }) {
    const [actionKey, setActionKey] = useState((kind === ActionKind.member ? Show : Index).key);
    const [selected, setSelected] = useState([]);
    const [title, setTitle] = useState(null);
    const [dataType, setDataType] = useState(null);

    const handleSelect = selected => setSelected(selected);

    const handleAction = actionKey => setActionKey(actionKey);

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    if (!title) {
        item.getDataType().then(dataType => {
            setDataType(dataType);
            item.getTitle().then(title => setTitle(title));
        });
        return <Loading/>;
    }

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent docked={docked}
                                                       dataType={dataType}
                                                       item={item}
                                                       selected={selected}
                                                       height={componentHeight}
                                                       width={width}
                                                       onSelect={handleSelect}
                                                       onSelectItem={onSelectItem}/>;

    return <Paper className={classes.root}>
        <ActionToolbar title={title}
                       kind={kind}
                       selectedCount={selected.length}
                       onAction={handleAction}
                       selectedKey={actionKey}/>
        {action}
    </Paper>;
}

export default withStyles(styles, { withTheme: true })(ActionContainer);
