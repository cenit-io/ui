import React, { useEffect, useReducer, useState } from 'react';
import Loading from '../components/Loading';
import { Chip, Toolbar, Typography, useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';
import Show from "./Show";
import Random from "../util/Random";
import { DataType } from "../services/DataTypeService";
import { DataTypeId, TitleSubject } from "../common/Symbols";
import { switchMap, tap } from "rxjs/operators";
import zzip from "../util/zzip";
import { of } from "rxjs";
import copySymbols from "../util/cpSymbols";
import ChevronRight from "@material-ui/icons/ChevronRight";
import ActionPicker from "./ActionPicker";
import Alert from "./Alert";
import { DataTypeSubject } from "../services/subjects";
import reducer from "../common/reducer";
import Skeleton from "@material-ui/lab/Skeleton";


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

function MemberContainer({ docked, subject, height, width, onSubjectPicked, onClose, updateItem }) {
    const [state, setState] = useReducer(reducer, {
        actionKey: Show.key,
        actionComponentKey: Random.string()
    });

    const theme = useTheme();
    const classes = actionContainerStyles();

    const {
        dataType, record, dataTypeTitle, title,
        error, actionComponentKey, actionKey, disabled
    } = state;

    const setError = error => setState({ error });

    useEffect(() => {
        const subscription = subject.dataTypeSubject().dataType().pipe(
            tap(dataType => setState({ dataType, record: null })),
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
                setState({ record });
                subject.updateCache(record);
            } else {
                setError(`Record with ID ${subject.id} not found!`);
            }
        });
        return () => subscription.unsubscribe();
    }, [subject])

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
        const action = ActionRegistry.byKey(actionKey);
        if (action) {
            setState({
                actionKey,
                actionComponentKey: Random.string()
            });
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

    return <React.Fragment>
        <Toolbar className={classes.toolbar}>
            {breadcumb}
            <div className={classes.spacer}/>
            <ActionPicker kind={ActionKind.member}
                          arity={1}
                          onAction={handleAction}
                          disabled={disabled}/>
        </Toolbar>
        <div className={classes.actionContainer}
             style={{ height: `calc(${componentHeight})` }}>
            {action}
        </div>
    </React.Fragment>;
}

export default MemberContainer;
