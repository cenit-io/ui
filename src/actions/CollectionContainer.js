import React, { useEffect } from 'react';
import Loading from '../components/Loading';
import { useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';

import Index from "./Index";
import './New';
import "./Show";
import './Delete';
import './Export';
import './Import';
import './Update';
import './Convert';

import CollectionActionsToolbar from "./CollectionActionsToolbar";
import Random from "../util/Random";
import { DataType } from "../services/DataTypeService";
import FrezzerLoader from "../components/FrezzerLoader";
import ContainerContext, { useContainerContext } from "./ContainerContext";
import { useSpreadState } from "../common/hooks";


const actionContainerStyles = makeStyles(theme => ({
    root: {
        position: 'relative'
    },
    actionContainer: {
        width: '100%',
        overflow: 'auto',
        position: 'relative',
        height: props => `calc(${props.height} - ${appBarHeight(theme)})`
    }
}));

const InitialState = {
    limit: 5,
    page: 0,
    actionKey: Index.key,
    actionComponentKey: Random.string(),
    selectedItems: []
};

function CollectionContainerLayout({ docked, subject, height, width, onSubjectPicked }) {
    const [state, setState] = useSpreadState();

    const [containerState] = useContainerContext();

    const { selectedItems, loading, actionKey, actionComponentKey } = containerState;

    const theme = useTheme();
    const classes = actionContainerStyles();

    const { dataType, title } = state;
    const { dataTypeId } = subject;

    useEffect(() => {
        const subscription = subject.title(2).subscribe(
            title => setState({ title })
        );
        subject.computeTitle();
        return () => subscription.unsubscribe();
    }, [subject]);

    useEffect(() => {
        const subscription = DataType.getById(dataTypeId).subscribe(
            dataType => setState({ dataType })
        );
        return () => subscription.unsubscribe();
    }, [dataTypeId]);

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
                                                       onSubjectPicked={onSubjectPicked}/>;

    let loader;
    if (loading) {
        loader = <FrezzerLoader/>;
    }

    return (
        <div className={classes.root}>
            <CollectionActionsToolbar dataType={dataType}
                                      title={title}
                                      onRefresh={() => setState({ actionComponentKey: Random.string() })}
                                      onSubjectPicked={onSubjectPicked}/>
            <div className={classes.actionContainer}
                 style={{ height: `calc(${componentHeight})` }}>
                {action}
            </div>
            {loader}
        </div>
    );
}

export default function CollectionContainer(props) {
    return (
        <ContainerContext initialState={InitialState}>
            <CollectionContainerLayout {...props}/>
        </ContainerContext>
    );
}
