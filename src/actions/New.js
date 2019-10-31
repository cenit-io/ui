import React, { useState } from 'react';
import NewIcon from '@material-ui/icons/Add';
import BackIcon from '@material-ui/icons/ArrowBack';
import FormView from "../components/FormView";
import { useMediaQuery, withStyles, Fab } from "@material-ui/core";
import clsx from "clsx";
import LoadingButton from "../components/LoadingButton";
import SwipeableViews from "react-swipeable-views";
import copy from 'copy-to-clipboard';
import CopyIcon from '@material-ui/icons/FileCopy';
import SuccessIcon from '@material-ui/icons/CheckCircle';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import StorageIcon from '@material-ui/icons/Storage';
import ViewIcon from '@material-ui/icons/OpenInNew';
import EditIcon from '@material-ui/icons/Edit';

const stackHeaderSpacing = 5;

const styles = theme => ({
    root: {
        height: props => `calc(${props.height})`
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
        color: theme.palette.text.secondary
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
        top: props => `calc(${props.height} - ${theme.spacing(2)}px)`,
        left: props => `calc(${props.width} - ${theme.spacing(19)}px)`,
        color: theme.palette.text.secondary
    },
    fabSave: {
        position: 'absolute',
        top: props => `calc(${props.height} - ${theme.spacing(4)}px)`,
        left: props => `calc(${props.width} - ${theme.spacing(12)}px)`
    },
    fabJson: {
        position: 'absolute',
        top: theme.spacing(14),
        left: props => `calc(${props.width} - ${theme.spacing(11)}px)`,
        fontWeight: 'bold',
        color: theme.palette.text.secondary
    },
    fabCopy: {
        position: 'absolute',
        top: theme.spacing(21),
        left: props => `calc(${props.width} - ${theme.spacing(11)}px)`,
        color: theme.palette.text.secondary
    },
    okBox: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        position: 'relative',
        background: theme.palette.primary.light,
        marginBottom: theme.spacing(3)
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
        alignItems: 'center',
        justifyContent: 'center'
    },
    actionButton: {
        margin: theme.spacing(1)
    },
    okContainer: {
        background: theme.palette.background.default
    }
});

const New = ({ docked, dataType, theme, classes, edit }) => {

    const initialStack = () => [{
        value: {},
        dataType,
        title: value => dataType.titleFor(value)
    }];
    const [ref] = useState(React.createRef());
    const [stack, setStack] = useState(initialStack());
    const [stackTitles, setStackTitles] = useState([]);
    const [done, setDone] = useState(false);
    const [saving, setSaving] = useState(false);
    const xs = useMediaQuery(theme.breakpoints.down('xs'));
    const md = useMediaQuery(theme.breakpoints.up('md'));
    const [jsonMode, setJsonMode] = useState(false);

    const current = stack[stack.length - 1];

    const updateCurrent = item => {
        const newStack = [...stack];
        newStack.push({ ...newStack.pop(), ...item });
        setStack(newStack);
        updateStackTitles(newStack);
    };

    const setValue = value => updateCurrent({ value });

    const setErrors = errors => updateCurrent({ errors });

    const updateStack = stack => {
        setStack(stack);
        updateStackTitles(stack);
        setTimeout(() => {
            if (stack.length && ref.current) {
                ref.current.scrollTop = (stack[stack.length - 1].scrollTop || 0)
            }
        });
    };

    const updateStackTitles = (s = stack) => s.length && Promise.all(
        s.map(item => item.title(item.value))
    ).then(titles => setStackTitles(titles));

    const handleChange = value => setValue(value);

    const handleStack = item => {
        current.scrollTop = ref.current.scrollTop;
        updateStack([...stack, item]);
    };

    const save = () => {
        setSaving(true);
        setDone(false);
        setTimeout(() =>
            current.dataType.post(current.value, { viewport: current.viewport || '{_id}' })
                .then(response => {
                    setDone(true);
                    setTimeout(() => {
                        setValue({ ...current.value, ...response });
                        handleBack();
                        current.callback && current.callback(response);
                        setSaving(false);
                    }, 1000);
                })
                .catch(error => {
                    setSaving(false);
                    setErrors(error.response.data);
                }), 1000
        )
    };

    const handleBack = () => {
        const newStack = [...stack];
        newStack.pop();
        updateStack(newStack);
        setDone(false);
    };

    const handleAddAnother = () => {
        updateStack(initialStack());
        setDone(false);
    };

    let content;
    if (stack.length) {
        const actions = [];

        if (!stackTitles.length) {
            updateStackTitles();
        }

        if (stack.length > 1 && !saving) {
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

        actions.push(
            <LoadingButton key='save'
                           loading={saving && !done}
                           onClick={save}
                           className={classes.fabSave}
                           success={done}/>
        );

        if (md) {
            actions.push(
                <Fab key='json'
                     size='small'
                     aria-label="JSON"
                     className={classes.fabJson}
                     onClick={() => setJsonMode(!jsonMode)}>
                    {'{...}'}
                </Fab>
            );
        }

        const forms = stack.map(
            (item, index) => <FormView key={`form_${index}`}
                                       dataType={item.dataType}
                                       value={item.value}
                                       errors={item.errors}
                                       onChange={handleChange}
                                       disabled={saving}
                                       onStack={handleStack}
                                       edit={item.edit}/>
        );

        let jsonView;
        if (md && jsonMode) {
            jsonView = <div className={clsx(classes.jsonContainer, classes.jsonBox)}>
                <pre>
                    {JSON.stringify(current.value, null, 2)}
                </pre>
            </div>;

            actions.push(
                <Fab key='copy'
                     size='small'
                     aria-label="JSON"
                     className={classes.fabCopy}
                     onClick={() => copy(JSON.stringify(current.value, null, 2))}>
                    <CopyIcon/>
                </Fab>
            );
        }

        content = <React.Fragment>
            <div className={classes.stackHeader}>
                {stackTitles.join(' ')}
            </div>
            <div style={{ display: 'flex' }}>
                <div ref={ref}
                     className={
                         clsx(
                             classes.formContainer,
                             !xs && !jsonView && (docked || !md) && classes.smFormContainer,
                             md && ((jsonMode && classes.jsonBox) || classes.mdFormContainer)
                         )}>

                    <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                                    index={stack.length - 1}>
                        {forms}
                    </SwipeableViews>
                    <div className={classes.trailing}/>
                    {actions}
                </div>
                {jsonView}
            </div>
        </React.Fragment>;
    } else {
        const DataTypeIcon = StorageIcon;
        content = <div className={clsx(classes.fullHeight, classes.center, classes.okContainer)}>
            <div className={clsx(classes.okBox, classes.center)}>
                <SuccessIcon className={classes.okIcon} color="primary"/>
                <DataTypeIcon/>
            </div>
            <Typography variant='h5'>
                {stackTitles[0]}
            </Typography>
            <Typography variant='subtitle1'>
                Successfully {edit ? 'updated' : 'created'}
            </Typography>
            <div>
                <Button variant="outlined"
                        color="primary"
                        startIcon={<ViewIcon/>}
                        className={classes.actionButton}>
                    View
                </Button>
                <Button variant="outlined"
                        color="primary"
                        startIcon={<EditIcon/>}
                        className={classes.actionButton}>
                    Edit
                </Button>
            </div>
            <Button variant="contained"
                    color="primary"
                    startIcon={<AddIcon/>}
                    onClick={handleAddAnother}
                    className={classes.actionButton}>
                Add another
            </Button>
            <div className={classes.trailing}></div>
        </div>;
    }


    return <div className={classes.root}>
        {content}
    </div>;
};

New.Icon = NewIcon;

New.title = 'New';

export default withStyles(styles, { withTheme: true })(New);
