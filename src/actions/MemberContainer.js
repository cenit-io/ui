import React, { useEffect, useRef } from 'react';
import Loading from '../components/Loading';
import { Chip, Toolbar, Typography, useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';
import Show from "./Show";
import Random from "../util/Random";
import { switchMap, tap } from "rxjs/operators";
import { isObservable, of } from "rxjs";
import ChevronRight from "@material-ui/icons/ChevronRight";
import ActionPicker from "./ActionPicker";
import Alert from "./Alert";
import { DataTypeSubject } from "../services/subjects";
import Skeleton from "@material-ui/lab/Skeleton";
import { useSpreadState } from "../common/hooks";
import FrezzerLoader from "../components/FrezzerLoader";
import ContainerContext, { useContainerContext } from "./ContainerContext";
import { useTenantContext } from "../layout/TenantContext";


import Records from "./Records";
import DataType from "./DataType";
import DownloadFile from './DownloadFile';

const actionContainerStyles = makeStyles(theme => ({
    toolbar: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
        height: appBarHeight(theme)
    },
    breadcrumb: {
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center'
    },
    spacer: {
        flex: '1 1 100%',
    },
    actionContainer: {
        width: '100%',
        overflow: 'auto',
        position: 'relative',
        height: props => `calc(${props.height} - ${appBarHeight(theme)})`
    }
}));

function MemberContainerLayout({ docked, subject, height, width, onSubjectPicked, onClose, updateItem }) {
    const [state, setState] = useSpreadState({
        actionKey: Show.key,
        actionComponentKey: Random.string()
    });

    const containerContext= useContainerContext();

    const [containerState, setContainerState] = containerContext;

    const tenantContext = useTenantContext();

    const { dataType, record } = containerState;

    const actionSubscription = useRef(null);
    const theme = useTheme();
    const classes = actionContainerStyles();

    const {
        dataTypeTitle, title, loading,
        error, actionComponentKey, actionKey, disabled
    } = state;

    const setError = error => setState({ error });

    useEffect(() => {
        const subscription = subject.dataTypeSubject().dataType().pipe(
            tap(dataType => setContainerState({ dataType, record: null, selectedItems: [] })),
            switchMap(
                dataType => {
                    if (dataType) {
                        return dataType.get(subject.id);
                    }
                    setError(`Data type with ID ${subject.dataTypeId} not found!`);
                    return of(null);
                }
            )
        ).subscribe(record => {
            if (record) {
                setContainerState({ record, selectedItems: [record] });
                subject.updateCache(record);
            } else {
                setError(`Record with ID ${subject.id} not found!`);
            }
        });
        return () => subscription.unsubscribe();
    }, [subject]);

    useEffect(() => {
        const s1 = subject.title().subscribe(
            title => setState({ title })
        );
        const dataTypeSubject = subject.dataTypeSubject();
        const s2 = dataTypeSubject.title().subscribe(
            dataTypeTitle => setState({ dataTypeTitle })
        );
        dataTypeSubject.computeTitle();
        return () => {
            s1.unsubscribe();
            s2.unsubscribe();
        }
    }, [subject]);

    if (error) {
        return <Alert message={error}/>;
    }

    if (!record) {
        return <Loading/>;
    }

    const handleAction = actionKey => {
        if (actionSubscription.current) {
            actionSubscription.current.unsubscribe();
            actionSubscription.current = null;
        }
        const action = ActionRegistry.byKey(actionKey);
        if (action) {
            if (action.executable) {
                const r = action.call(this, {
                    dataType, record, tenantContext, containerContext
                });
                if (isObservable(r)) {
                    setState({ loading: true });
                    actionSubscription.current = r.subscribe(
                        () => setState({
                            loading: false,
                            actionKey: Show.key,
                            actionComponentKey: Random.string()
                        })
                    );
                }
            } else {
                setState({
                    actionKey,
                    actionComponentKey: Random.string()
                });
            }
        }
    };

    const handleUpdateItem = item => {
        subject.updateCache(item);
        updateItem && updateItem(item)
    };

    let dataLink;
    if (dataTypeTitle) {
        dataLink = <Chip label={dataTypeTitle}
                         onClick={() => onSubjectPicked(DataTypeSubject.for(subject.dataTypeId).key)}/>;
    } else {
        dataLink = <Skeleton variant="circle"
                             width={theme.spacing(3)}
                             height={theme.spacing(3)}/>;
    }
    const breadcumb = (
        <div className={classes.breadcrumb}>
            {dataLink}
            <ChevronRight/>
            <Typography variant="h6">
                {title || <Skeleton variant="text" width={theme.spacing(5)}/>}
            </Typography>
        </div>
    );

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent key={actionComponentKey}
                                                       docked={docked}
                                                       subject={subject}
                                                       dataType={dataType}
                                                       record={record}
                                                       updateItem={handleUpdateItem}
                                                       height={componentHeight}
                                                       width={width}
                                                       onSubjectPicked={onSubjectPicked}
                                                       onCancel={() => handleAction(Show.key)}
                                                       onDisable={disabled => setState({ disabled })}
                                                       onClose={onClose}/>;

    return (
        <>
            <Toolbar className={classes.toolbar}>
                {breadcumb}
                <div className={classes.spacer}/>
                <ActionPicker kind={ActionKind.member}
                              arity={1}
                              onAction={handleAction}
                              disabled={disabled}
                              dataType={dataType}/>
            </Toolbar>
            <div className={classes.actionContainer}
                 style={{ height: `calc(${componentHeight})` }}>
                {action}
                {loading && <FrezzerLoader/>}
            </div>
        </>
    );
}

const InitialContextState = {
    selectedItems: []
};

export default function MemberContainer(props) {
    return (
        <ContainerContext initialState={InitialContextState}>
            <MemberContainerLayout {...props}/>
        </ContainerContext>
    );
};
