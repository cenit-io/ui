import React, { useEffect } from 'react';
import Loading from '../components/Loading';
import { useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';

import Index from "./Index";
import './New';
import "./Show";
import "./Edit";
import './Delete';
import './Export';
import './Import';
import './Update';
import './Convert';
import './SendToFlow';
import './Cross';
import './PullImport';
import './CleanActiveTenants';
import './CancelConsumers';

import CollectionActionsToolbar from "./CollectionActionsToolbar";
import Random from "../util/Random";
import { DataType } from "../services/DataTypeService";
import FrezzerLoader from "../components/FrezzerLoader";
import ContainerContext, { useContainerContext } from "./ContainerContext";
import { useSpreadState } from "../common/hooks";
import Alert from "./Alert";
import Button from "@material-ui/core/Button";
import ReloadIcon from "@material-ui/icons/Refresh";

const miniDrawerStyles = makeStyles(theme => ({
    drop: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: theme.palette.common.black,
        opacity: 0,
        zIndex: 10,
        transition: 'all 0.3s ease'
    },
    card: {
        top: 0,
        position: 'absolute',
        width: theme.spacing(40),
        height: '100%',
        right: theme.spacing(-40),
        background: theme.palette.background.paper,
        zIndex: 11,
        transition: 'all 0.3s ease'
    }
}));

function MiniDrawer({ children, onClose }) {
    const [state, setState] = useSpreadState({
        open: true
    });

    const classes = miniDrawerStyles();

    const { open, cardStyle, dropStyle } = state;

    useEffect(() => {
        setState({
            dropStyle: { opacity: 0.5 },
            cardStyle: { right: 0 }
        });
    }, []);

    const handleClose = () => {
        if (open) {
            setState({
                open: false,
                cardStyle: null,
                dropStyle: null
            });
            setTimeout(onClose, 300);
        }
    };

    return (
        <>
            <div className={classes.drop} style={dropStyle} onClick={handleClose}>
            </div>
            <div className={classes.card} style={cardStyle}>
                {children}
            </div>
        </>
    );
}

const actionContainerStyles = makeStyles(theme => ({
    root: {
        position: 'relative'
    },
    actionContainer: {
        width: '100%',
        overflow: 'auto',
        position: 'relative',
        height: props => `calc(${props.height} - ${appBarHeight(theme)})`,
        backgroundColor: theme.palette.background.default,
    }
}));

const InitialState = {
    limit: 5,
    page: 0,
    actionKey: Index.key,
    actionComponentKey: Random.string(),
    selectedItems: [],
    landingActionKey: Index.key,
    selector: {}
};

function CollectionContainerLayout({ docked, subject, height, width, onSubjectPicked, activeActionKey }) {
    const [state, setState] = useSpreadState();

    const [containerState, setContainerState] = useContainerContext();

    const { selectedItems, loading, actionKey, actionComponentKey, drawerActionKey } = containerState;

    const theme = useTheme();
    const classes = actionContainerStyles();

    const { dataType, title, error } = state;
    const { dataTypeId } = subject;

    useEffect(() => {
        setContainerState({containerTitle: title})
    }, [title, setContainerState]);

    useEffect(() => {
        if (activeActionKey) {
            setContainerState({ actionKey: activeActionKey });
        }
    }, [activeActionKey]);

    useEffect(() => {
        const subscription = subject.title(2).subscribe(
            title => setState({ title })
        );
        subject.computeTitle();
        return () => subscription.unsubscribe();
    }, [subject]);

    useEffect(() => {
        if (!error) {
            const subscription = DataType.getById(dataTypeId).subscribe(
                dataType => {
                    if (dataType) {
                        setState({ dataType });
                    } else {
                        setState({
                            error: `Data type with ID ${dataTypeId} not found!`
                        });
                    }
                }
            );

            return () => subscription.unsubscribe();
        }
    }, [dataTypeId, error]);

    if (error) {
        return (
            <Alert message={error}>
                <Button variant="outlined"
                        color="primary"
                        endIcon={<ReloadIcon component="svg"/>}
                        onClick={() => setState({ error: null })}>
                    Reload
                </Button>
            </Alert>
        );
    }

    if (!dataType) {
        return <Loading/>;
    }

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent key={actionComponentKey}
                                                       docked={docked}
                                                       dataType={dataType}
                                                       subject={subject}
                                                       selectedItems={selectedItems}
                                                       height={componentHeight}
                                                       width={width}
                                                       onSubjectPicked={onSubjectPicked}
                                                       onCancel={() => setContainerState({ actionKey: Index.key })}/>;

    let drawerAction;
    if (drawerActionKey) {
        const DrawerActionComponent = ActionRegistry.byKey(drawerActionKey);
        drawerAction = (DrawerActionComponent &&
            <DrawerActionComponent key={actionComponentKey}
                                   docked={docked}
                                   dataType={dataType}
                                   subject={subject}
                                   selectedItems={selectedItems}
                                   height={componentHeight}
                                   width={width}
                                   onSubjectPicked={onSubjectPicked}
                                   onCancel={() => setContainerState({ actionKey: Index.key })}/>
        );
        drawerAction = (
            <MiniDrawer anchor="right"
                        open={Boolean(drawerActionKey)}
                        onClose={() => setContainerState({ drawerActionKey: null })}>
                {drawerAction}
            </MiniDrawer>
        );
    }

    let loader;
    if (loading) {
        loader = <FrezzerLoader/>;
    }

    return (
        <div className={classes.root}>
            <CollectionActionsToolbar dataType={dataType}
                                      title={title}
                                      onRefresh={() => setState({ actionComponentKey: Random.string() })}
                                      onSubjectPicked={onSubjectPicked}
                                      selectedKey={actionKey}/>
            <div className={classes.actionContainer}
                 style={{ height: `calc(${componentHeight})` }}>
                {action}
            </div>
            {loader}
            {drawerAction}
        </div>
    );
}

export default function CollectionContainer(props) {
    return (
        <ContainerContext initialState={InitialState} homeActionKey={Index.key}>
            <CollectionContainerLayout {...props}/>
        </ContainerContext>
    );
}
