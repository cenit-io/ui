import React, { useCallback, useEffect, useRef, useState } from 'react';
import BackIcon from '@material-ui/icons/ArrowBack';
import FormView from "./FormView";
import { useMediaQuery, Fab, makeStyles, Tooltip, IconButton } from "@material-ui/core/index";
import clsx from 'clsx';
import LoadingButton from "./LoadingButton";
import SwipeableViews from "react-swipeable-views";
import copy from 'copy-to-clipboard/index';
import CopyIcon from '@material-ui/icons/FileCopy';
import Button from '@material-ui/core/Button/index';
import StorageIcon from '@material-ui/icons/Storage';
import ViewIcon from '@material-ui/icons/OpenInNew';
import WaitingIcon from '@material-ui/icons/HourglassEmpty';
import zzip from "../util/zzip";
import { of, Subject } from "rxjs";
import { FILE_TYPE } from "../services/DataTypeService";
import FileUploader from "./FileUploader";
import { RecordSubject } from "../services/subjects";
import { FormRootValue, isFormValue } from "../services/FormValue";
import JsonViewer from "./JsonViewer";
import FormContext from './FormContext';
import FrezzerLoader from "./FrezzerLoader";
import { switchMap, tap, catchError } from "rxjs/operators";
import useTheme from "@material-ui/core/styles/useTheme";
import SuccessAlert from "../actions/SuccessAlert";
import { Status } from "../common/Symbols";
import InfoAlert from "../actions/InfoAlert";
import Random from "../util/Random";
import { Code } from '@material-ui/icons';
import { useContainerContext } from '../actions/ContainerContext';
import Index from '../actions/Index';
import Show from '../actions/Show';

function withForm(item) {
    item.submitter = new Subject();
    return item;
}

const stackHeaderSpacing = 5;

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        height: props => `calc(${props.height})`,
        backgroundColor: theme.palette.background.default
    },
    stackHeader: {
        height: theme.spacing(stackHeaderSpacing),
        padding: theme.spacing(1),
        boxSizing: 'border-box'
    },
    formContainer: {
        height: props => `calc(${props.height} - ${theme.spacing(stackHeaderSpacing)}px)`,
        overflow: 'auto',
        boxSizing: 'border-box',
        flexGrow: 1
    },
    jsonContainer: {
        height: props => `calc(${props.height} - ${theme.spacing(stackHeaderSpacing)}px)`,
        overflow: 'auto',
        boxSizing: 'border-box',
        background: theme.palette.background.default,
        color: theme.palette.text.secondary,
    },
    jsonBox: {
        width: '50%',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1)
    },
    mdFormContainer: {
        paddingLeft: '25%',
        paddingRight: '25%',
    },
    smFormContainer: {
        paddingLeft: '15%',
        paddingRight: '15%',
    },
    trailing: {
        height: `${theme.spacing(8)}px`
    },
    fabBack: {
        position: 'absolute',
        top: props => `calc(${props.height} - ${theme.spacing(13)}px)`,
        right: theme.spacing(18),
        color: theme.palette.text.secondary
    },
    fabSave: {
        position: 'absolute',
        top: props => `calc(${props.height} - ${theme.spacing(14)}px)`,
        right: theme.spacing(2)
    },
    fabJson: {
        position: 'absolute',
        top: theme.spacing(8),
        right: theme.spacing(5),
        fontWeight: 'bold',
        color: theme.palette.text.secondary
    },
    fabCopy: {
        position: 'absolute',
        top: theme.spacing(15),
        right: theme.spacing(5),
        color: theme.palette.text.secondary
    },
    iconJsonActive: {
        backgroundColor: props=> props.jsonMode ? 'rgb(232 227 229 / 85%) ': ''
    },
    iconJsonWrapper: {
        width: "1.5rem",
        marginLeft: "auto",
        marginRight: '2rem',    
        marginBottom: '8px',
    },
    okBox: {
        width: '100px',
        minHeight: '100px',
        borderRadius: '50%',
        position: 'relative',
        background: theme.palette.primary.light,
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
        justifyContent: 'center'
    },
    okIcon: {
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
    }
}));

const defaultFormProcessor = (viewport, rootId, onFormSubmit, onSubmitDone) => (formDataType, value, formSanitizer) => {
    const submitAction = onFormSubmit
        ? onFormSubmit(formDataType, value, formSanitizer)
        : (viewport || formDataType.titleViewport('_id')).pipe(
            switchMap(viewport => formDataType.post(
                (formSanitizer && formSanitizer(value.get())) || value.get(), {
                    viewport,
                    add_only: rootId,
                    add_new: !rootId,
                    polymorphic: true
                }
            )),
            tap(response => {
                if (response[Status] === 200 || response[Status] === 201) {
                    value.set({ ...value.get(), ...response })
                }
            })
        );

    return submitAction.pipe(
        tap(response => setTimeout(() => onSubmitDone(response, formDataType))),
        catchError(error => {
            setTimeout(() => onSubmitDone());
            throw error
        })
    );
};

const useSuccessStyles = makeStyles(theme => ({
    alignCenter: {
        textAlign: 'center'
    },
    actionButton: {
        margin: theme.spacing(1)
    },
}));

function DefaultSuccessControl({ title, rootId, onSubjectPicked, dataType, id, value }) {

    const classes = useSuccessStyles();

    const success = value[Status] === 200 || value[Status] === 201;

    let actions;
    if (success && !rootId) {
        actions = (
            <div className={classes.alignCenter}>
                <Button variant="outlined"
                        color="primary"
                        startIcon={<ViewIcon/>}
                        className={classes.actionButton}
                        onClick={() => onSubjectPicked(RecordSubject.for(dataType.id, id).key)}>
                    View
                </Button>
            </div>
        );
    }

    let Alert;
    let message;
    if (success) {
        Alert = SuccessAlert;
        message = `Successfully ${rootId ? 'updated' : 'created'}`;
    } else {
        Alert = InfoAlert;
        message = `${rootId ? 'Update' : 'Create'} request received`;
    }

    return (
        <Alert title={title}
               message={message}
               mainIcon={StorageIcon}>
            {actions}
        </Alert>
    );
}

function plainFormValue(value) {
    if (isFormValue(value)) {
        return value.get();
    }

    return value;
}

const FormEditor = ({
                        docked, dataType, rootId, onSubjectPicked, height, value,
                        readOnly,cancelEditor, onUpdate, onFormSubmit, successControl, submitIcon,
                        noSubmitButton, noJSON, jsonProjection
                    }) => {

    const [id, setId] = useState(plainFormValue(value)?.id || null);
    const [submitResponse, setSubmitResponse] = useState(null);
    const initialStack = () => [
        withForm({
            value: new FormRootValue({ ...plainFormValue(value) }),
            dataType,
            title: () => of('')
        }),
        withForm({
            value: isFormValue(value) ? value : new FormRootValue({ ...value }),
            dataType,
            title: value => dataType.titleFor(value),
            viewport: dataType.titleViewport('_id'),
            callback: (value, dataType) => {
                setId(value.id);
                setSubmitResponse({ value, dataType });
                if ((!value[Status] || value[Status] === 200 || value[Status] === 201) && onUpdate && rootId) {
                    onUpdate(value);
                }
            },
            rootId: plainFormValue(value)?.id
        })
    ];
    const ref = useRef(null);
    const stackHeaderRef = useRef(null);
    const [stack, setStack] = useState(initialStack());
    const [stackTitles, setStackTitles] = useState([]);
    const [done, setDone] = useState(false);
    const [saving, setSaving] = useState(false);

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));
    const md = useMediaQuery(theme.breakpoints.up('md'));
    const [jsonMode, setJsonMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stackControls, setStackControls] = useState([]);
    
    const classes = useStyles({ height, jsonMode });
   
    const current = stack[stack.length - 1];

    const updateStack = stack => {
        setStack(stack);
        setTimeout(() => {
            if (stack.length && ref.current) {
                ref.current.scrollTop = (stack[stack.length - 1].scrollTop || 0)
            }
        });
    };

    useEffect(() => {
        const subscription = zzip(
            ...stack.map(
                ({ dataType }) => dataType.config()
            )
        ).subscribe(configs => {
            const controls = configs.map(
                (config, index) => config.formViewComponent || (
                    stack[index].dataType._type === FILE_TYPE
                        ? FileUploader
                        : FormView)
            );
            setStackControls(controls);
        });

        return () => subscription.unsubscribe();
    }, [stack]);

    const handleBack = useCallback(() => {
        const newStack = [...stack];
        newStack.pop();
        updateStack(newStack);
        setDone(false);
    }, [stack]);

    const onSubmitDone = useCallback((response, responseDataType) => {
        if (response) {
            setDone(true);
            setTimeout(() => {
                handleBack();
                if (current.callback) {
                    current.callback(response, responseDataType);
                }
                setSaving(false);
            }, 1000);
        } else {
            current.submitter = new Subject();
            setSaving(false);
        }
    }, [current]);

    useEffect(() => {
        const subscription = zzip(
            ...stack.map(item => item.title(item.value.get()))
        ).subscribe(titles => setStackTitles(titles));
        return () => subscription.unsubscribe();
    }, [stack.length]);

    const handleStack = item => {
        const { value, dataType } = item;
        let dataTypeObserver;
        setLoading(true);
        if (value?.get() && dataType) {
            const { _type } = value.cache;
            dataTypeObserver = (
                ((!_type || _type === dataType.type_name()) && of(dataType)) ||
                dataType.findByName(_type)
            );
        } else {
            dataTypeObserver = of(dataType);
        }
        dataTypeObserver.subscribe(
            dataType => {
                current.scrollTop = ref.current.scrollTop;
                updateStack([...stack, withForm({ ...item, dataType })]);
                setLoading(false);
            }
        );
    };

    const save = () => {
        setSaving(true);
        setDone(false);
        current.submitter.next();
    };

    let controlHeight = 0;
    if (stackHeaderRef.current) {
        controlHeight = stackHeaderRef.current.getBoundingClientRect().height
    }

    controlHeight = `${height} - ${controlHeight}px`;

    const actions = [];

    if (stack.length > 2 && !saving) {
        actions.push(
            <Fab key='back'
                 size='small'
                 aria-label="back"
                 className={classes.fabBack}
                 onClick={handleBack}>
                <BackIcon/>
            </Fab>
        );
    }

    let jsonView;

    const [containerState, setContainerState] = useContainerContext();
    const { landingActionKey } = containerState;

    const handleCancel = () => {
        landingActionKey === Index.key
          ? setContainerState({ actionKey: Index.key,  selectedItems: []  })
          : setContainerState({
              landingActionKey: Show.key,
              actionKey: Show.key,
            });

        console.log(dataType, containerState, landingActionKey === Index.key);
    }

    if (stack.length > 1) {
        if (!noSubmitButton && !readOnly) {
            actions.push(
                <LoadingButton key='save'
                               loading={saving && !done}
                               onClick={save}
                               onClickCancel={cancelEditor ? cancelEditor : handleCancel}
                               className={classes.fabSave}
                               success={done}
                               actionIcon={stack.length === 2 && submitIcon}/>
            );
        }

        if (md && jsonMode) {
            jsonView = (
                <FormContext.Provider value={{ value: current.value }}>
                    <JsonViewer className={clsx(classes.jsonContainer, classes.jsonBox)}
                                projection={jsonProjection}/>
                </FormContext.Provider>
            );

            actions.push(
                <Fab key='copy'
                     size='small'
                     aria-label="JSON"
                     className={classes.fabCopy}
                     onClick={() => copy(JSON.stringify(current.value.get(), null, 2))}>
                    <CopyIcon/>
                </Fab>
            );
        }
    }

    let forms = stackControls.map(
        (Control, index) => {
            if (index) {
                const item = stack[index];
                if (item) {
                    const { controlConfig } = item;
                    return <Control key={`form_${index}`}
                                    dataType={item.dataType}
                                    value={item.value}
                                    _type={item.value && item.value._type}
                                    disabled={saving}
                                    readOnly={readOnly}
                                    onStack={handleStack}
                                    seed={item.seed}
                                    typesFilter={item.typesFilter}
                                    formViewControlConfig={controlConfig}
                                    rootId={item.rootId}
                                    max={item.max}
                                    height={controlHeight}
                                    submitter={item.submitter}
                                    onSubmitDone={onSubmitDone}
                                    onSubjectPicked={onSubjectPicked}
                                    viewport={item.viewport}
                                    onFormSubmit={defaultFormProcessor(
                                        item.viewport,
                                        item.rootId,
                                        index === 1 && onFormSubmit, // TODO Improve this
                                        onSubmitDone
                                    )}/>
                }
            }

            if (submitResponse) {

                const SuccessControl = successControl || DefaultSuccessControl;

                return <SuccessControl key='successAlert'
                                       title={stackTitles[1]}
                                       rootId={rootId}
                                       onSubjectPicked={onSubjectPicked}
                                       dataType={submitResponse.dataType}
                                       id={id}
                                       value={submitResponse.value}/>;
            }

            return <SuccessAlert key={Random.string()} mainIcon={WaitingIcon}/>;
        }
    ).filter(c => c);

    if (forms.length) {
        forms = (
            <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                            disabled={true}
                            index={stackControls.length - 1}>
                {forms}
            </SwipeableViews>
        );
    }

    const breadCrumb = false && ( // TODO Breadcrumb
        <div ref={stackHeaderRef} className={classes.stackHeader}>
            {stack.length > 1 && stackTitles.join(' ')}
        </div>
    );

    const jsonBtn  = (!noJSON && md) && (
        <div className={classes.iconJsonWrapper}>
        <Tooltip title="Json Code" arrow>
            <IconButton aria-label="Json Code"
                color='default'
                onClick={() => setJsonMode(!jsonMode)}
                className={classes.iconJsonActive}
                style={{color: jsonMode && "rgb(68, 119, 151)"}}
                size="small"
            >
                <Code />
            </IconButton>
        </Tooltip>
    </div>
    );

    return (
        <div className={classes.root}>
            {breadCrumb}
            {jsonBtn}
            <div style={{ display: 'flex', position: 'relative' }}>
                <div ref={ref}
                     className={clsx(
                         classes.formContainer,
                         !xs && !jsonView && (docked || !md) && classes.smFormContainer,
                         md && ((jsonMode && classes.jsonBox) || classes.mdFormContainer)
                     )}>
                    {forms}
                    <div className={classes.trailing}/>
                    {actions}
                </div>
                {jsonView}
            </div>
            {loading && <FrezzerLoader />}
        </div>
    );
};

export default FormEditor;
