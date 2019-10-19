import React from 'react';
import Loading from '../components/Loading';
import {makeStyles, Toolbar, Tooltip, Typography, withStyles} from "@material-ui/core";
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import clsx from "clsx";
import {lighten} from "@material-ui/core/styles";
import Index from "./Index";
import New from "./New";
import {appBarHeight} from "../layout/AppBar";

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

const CollectionActions = [
    Index,
    New
];

const CollectionToolbar = ({ title, selectedCount, onAction }) => {
    const classes = useToolbarStyles(),

        handleAction = actionIndex => () => onAction(actionIndex);

    let actions;

    if (selectedCount > 0) {
        actions = <Tooltip title="Delete">
            <IconButton aria-label="Delete">
                <DeleteIcon/>
            </IconButton>
        </Tooltip>;
    } else {
        actions = CollectionActions.map((action, index) => {
                const Icon = action.Icon;

                return <Tooltip key={`action_${index}`}
                                title={action.title}>
                    <IconButton aria-label={action.title}
                                onClick={handleAction(index)}>
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

class CollectionContainer extends React.Component {

    state = {
        actionIndex: 0,
        selected: []
    };

    computeDataTypeState = async () => {
        const { dataType } = this.props;

        const title = await dataType.getTitle();

        return { title };
    };

    handleSelect = selected => this.setState({ selected });

    handleAction = actionIndex => this.setState({ actionIndex });

    render() {

        const { dataType, height, width, classes, theme } = this.props,

            { title, selected, actionIndex } = this.state,

            componentHeight = `${height} - ${appBarHeight(theme)}`;

        if (!title) {
            this.computeDataTypeState().then(state => this.setState(state));
            return <Loading/>;
        }

        const Component = CollectionActions[actionIndex],

            action = <Component dataType={dataType}
                                selected={selected}
                                height={componentHeight}
                                width={width}
                                onSelect={this.handleSelect}/>;

        return <Paper className={classes.root}>
            <CollectionToolbar title={title}
                               selectedCount={selected.length}
                               onAction={this.handleAction}/>
            {action}
        </Paper>;
    }
}

export default withStyles(styles, { withTheme: true })(CollectionContainer);