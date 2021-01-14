import React, { useEffect, useReducer, useRef } from 'react';
import Loading from '../components/Loading';
import { useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';

import Index from "./Index";
import New from './New';
import Show from "./Show";
import Delete from './Delete';

import CollectionActionsToolbar from "./CollectionActionsToolbar";
import Random from "../util/Random";
import { DataType } from "../services/DataTypeService";
import { RecordSubject } from "../services/subjects";
import { isObservable, of } from "rxjs";
import spreadReducer from "../common/spreadReducer";
import FrezzerLoader from "../components/FrezzerLoader";
import { switchMap } from "rxjs/operators";


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

function CollectionContainer({ docked, subject, height, width, onSubjectPicked }) {
    const [state, setState] = useReducer(spreadReducer, {
        selectedItems: [],
        actionKey: Index.key,
        actionComponentKey: Random.string()
    });

    const actionSubscription = useRef(null);

    const theme = useTheme();
    const classes = actionContainerStyles();

    const { dataType, title, actionKey, selectedItems, actionComponentKey, loading } = state;
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

    const handleSelect = selectedItems => setState({ selectedItems });

    const execute = action => {
        const r = action.call(this, { dataType });
        if (isObservable(r)) {
            setState({ loading: true });
            actionSubscription.current = r.subscribe(() => {
                setState({ loading: false });
            });
        }
    };

    const handleAction = actionKey => {
        if (actionSubscription.current) {
            actionSubscription.current.unsubscribe();
            actionSubscription.current = null;
        }
        const action = ActionRegistry.byKey(actionKey);
        if (action) {
            if (action.kind === ActionKind.collection || action.kind === ActionKind.bulk) {
                if (action.executable) {
                    execute(action);
                } else {
                    setState({ actionKey, actionComponentKey: Random.string() });
                }
            } else {
                setState({ loading: true });
                const { _type, id } = selectedItems[0];
                actionSubscription.current = (
                    ((!_type || _type === dataType.type_name()) && of(dataType)) ||
                    dataType.findByName(_type)
                ).pipe(
                    switchMap(dataType => {
                            if (dataType) {
                                if (action.executable) {
                                    const r = action.call(this, { dataType, record: selectedItems[0] });
                                    if (isObservable(r)) {
                                        return r;
                                    }
                                } else {
                                    onSubjectPicked(RecordSubject.for(dataType.id, id).key);
                                }
                                return of(true);
                            }
                        }
                    )
                ).subscribe(() => setState({
                    selectedItems: [],
                    loading: false
                }));
            }
        }
    };

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent key={actionComponentKey}
                                                       docked={docked}
                                                       dataType={dataType}
                                                       subject={subject}
                                                       selectedItems={selectedItems}
                                                       height={componentHeight}
                                                       width={width}
                                                       onSelect={handleSelect}
                                                       onSubjectPicked={onSubjectPicked}/>;

    let loader;
    if (loading) {
        loader = <FrezzerLoader/>;
    }
    return (
        <div className={classes.root}>
            <CollectionActionsToolbar dataType={dataType}
                                      title={title}
                                      onAction={handleAction}
                                      arity={selectedItems.length}
                                      selectedKey={actionKey}
                                      onRefresh={() => setState({ actionComponentKey: Random.string() })}/>
            <div className={classes.actionContainer}
                 style={{ height: `calc(${componentHeight})` }}>
                {action}
            </div>
            {loader}
        </div>
    );
}

export default CollectionContainer;
