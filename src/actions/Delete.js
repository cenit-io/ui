import React, { useEffect, useState } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import DeleteIcon from '@material-ui/icons/Delete';
import WarningIcon from '@material-ui/icons/Info';
import CheckIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import clsx from "clsx";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { CircularProgress, makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    okBox: {
        width: '100px',
        minHeight: '100px',
        borderRadius: '50%',
        position: 'relative',
        background: theme.palette.secondary.light,
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
        justifyContent: 'center'
    },
    infoIcon: {
        position: 'absolute',
        top: '8px',
        right: 0,
        background: theme.palette.background.paper,
        borderRadius: '50%'
    },
    fullHeight: {
        height: '100%'
    },
    center: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    actionButton: {
        margin: theme.spacing(1)
    },
    okContainer: {
        height: props => props.height,
        overflow: 'auto',
        background: theme.palette.background.default
    },
    successLabel: {
        color: theme.palette.text.secondary
    },
    alignCenter: {
        textAlign: 'center'
    },
    loading: {
        color: theme.palette.secondary.main,
        position: 'absolute',
        top: -4,
        left: -4,
        zIndex: 1101,
    }
}));

const Status = Object.freeze({
    loading: 1,
    ready: 2,
    destroying: 3,
    destroyed: 4,
    failed: 5
});

const Delete = ({ docked, dataType, onDisable, theme, onItemPickup, height, item, onCancel, onClose }) => {
    const [status, setStatus] = useState(Status.loading);
    const [title, setTitle] = useState(null);
    const classes = useStyles();

    useEffect(() => {
        if (item) {
            const subscription = dataType.titleFor(item).subscribe(
                title => {
                    setStatus(Status.ready);
                    setTitle(title);
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [dataType, item]);

    useEffect(() => {
        switch (status) {
            case Status.destroying: {
                onDisable(true);
                let selector;
                if (item) {
                    selector = { _id: item.id };
                }
                const subscription = dataType.delete(selector).subscribe(
                    () => setStatus(Status.destroyed)
                );
                return () => subscription.unsubscribe();
            }
                break;
            case Status.destroyed:
                setTimeout(() => onClose(), 1000);
        }
    }, [status]);

    const handleDestroy = () => setStatus(Status.destroying);

    let statusUI, actions, text;
    switch (status) {
        case Status.ready:
            statusUI = <WarningIcon className={classes.infoIcon} color="secondary"/>;
            text = `${title} will be destroyed!`;
            actions = <React.Fragment>
                <Typography variant='subtitle1' className={clsx(classes.successLabel, classes.alignCenter)}>
                    Are you sure you want to proceed?
                </Typography>
                <div className={classes.alignCenter}>
                    <Button variant="outlined"
                            color="secondary"
                            startIcon={<CancelIcon/>}
                            className={classes.actionButton}
                            onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="contained"
                            color="secondary"
                            startIcon={<CheckIcon/>}
                            className={classes.actionButton}
                            onClick={handleDestroy}>
                        Yes, I'm sure!
                    </Button>
                </div>
            </React.Fragment>
            break;
        case Status.destroyed:
            statusUI = <CheckIcon className={classes.infoIcon} color="secondary"/>;
            text = `Done!`;
            break;
        default:
            statusUI = <CircularProgress size={110} className={classes.loading}/>;
            if (status === Status.destroying) {
                text = `Destroying ${title}`;
            }
    }

    return <div key='successAlert' className={clsx(classes.fullHeight, classes.center, classes.okContainer)}>
        <div className={clsx(classes.okBox, classes.center)}>
            {statusUI}
            <DeleteIcon/>
        </div>
        <Typography variant='h5' className={classes.alignCenter}>
            {text}
        </Typography>
        {actions}
    </div>;
};

export default ActionRegistry.register(Delete, {
    kind: ActionKind.member, // TODO Define as bulk when ready for collection container
    icon: DeleteIcon,
    arity: 1,
    title: 'Delete',
    activeColor: 'secondary'
});
