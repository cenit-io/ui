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
import { switchMap } from "rxjs/operators";
import zzip from "../util/zzip";
import { of } from "rxjs";
import copySymbols from "../util/cpSymbols";
import ChevronRight from "@material-ui/core/SvgIcon/SvgIcon";
import ActionPicker from "./ActionPicker";
import Alert from "./Alert";
import { DataTypeSubject } from "../services/subjects";
import reducer from "../common/reducer";


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
        dataType, record, dataTypeTitle, recordTitle,
        error, actionComponentKey, actionKey, disabled
    } = state;

    const setError = error => setState({ error });

    useEffect(() => {
        const subscription = DataType.getById(subject.dataTypeId).pipe(
            switchMap(
                dataType => {
                    setState({ dataType, record: null });
                    if (dataType) {
                        return dataType.titleViewPort('_id').pipe(
                            switchMap(
                                viewport => {
                                    return zzip(
                                        dataType.getTitle(),
                                        dataType.get(subject.id, { viewport })
                                    )
                                }
                            )
                        );
                    }
                    setError(`Data type with ID ${subject.dataTypeId} not found!`);
                    return of([null, null]);
                }
            )
        ).subscribe(([dataTypeTitle, record]) => {
            setState({ dataTypeTitle });
            if (record) {
                setState({ record });
            } else {
                setError(`${dataTypeTitle} record with ID ${subject.id} not found!`);
            }
        });

        return () => subscription.unsubscribe();
    }, [subject])

    useEffect(() => {
        if (dataType && record) {
            const subscription = dataType.titleFor(record).subscribe(
                recordTitle => setState({ recordTitle })
            );
            return () => subscription.unsubscribe();
        }
    }, [dataType, record]);

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

    const handleUpdateItem = item => updateItem && updateItem(item);

    const breadcumb = (
        <div className={classes.breadcrumb}>
            <Chip label={dataTypeTitle}
                  onClick={() => onSubjectPicked(DataTypeSubject.for(subject.dataTypeId).key)}/>
            <ChevronRight/>
            <Typography variant="h6">
                {recordTitle}
            </Typography>
        </div>
    );

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent key={actionComponentKey}
                                                       docked={docked}
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
