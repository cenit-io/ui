import React, { useState } from 'react';
import NewIcon from '@material-ui/icons/Add';
import BackIcon from '@material-ui/icons/ArrowBack';
import FormView from "../components/FormView";
import { useMediaQuery, withStyles, Fab } from "@material-ui/core";
import clsx from "clsx";
import LoadingButton from "../components/LoadingButton";
import SwipeableViews from "react-swipeable-views";

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
        boxSizing: 'border-box'
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
        left: props => `calc(${props.width} - ${theme.spacing(19)}px)`
    },
    fabSave: {
        position: 'absolute',
        top: props => `calc(${props.height} - ${theme.spacing(4)}px)`,
        left: props => `calc(${props.width} - ${theme.spacing(12)}px)`
    },
});

const New = ({ docked, dataType, theme, classes }) => {

    const [ref] = useState(React.createRef());
    const [stack, setStack] = useState([{
        value: {},
        dataType,
        title: value => dataType.titleFor(value)
    }]);
    const [stackTitles, setStackTitles] = useState([]);
    const [done, setDone] = useState(false);
    const [saving, setSaving] = useState(false);
    const [changed, setChanged] = useState(false);
    const xs = useMediaQuery(theme.breakpoints.down('xs'));
    const md = useMediaQuery(theme.breakpoints.up('md'));

    const current = stack[stack.length - 1];

    const updateCurrent = item => {
        const newStack = [...stack];
        newStack.push({ ...newStack.pop(), ...item });
        setStack(newStack);
        updateStackTitles();
    };

    const setValue = value => updateCurrent({ value });

    const setErrors = errors => updateCurrent({ errors });

    const updateStack = stack => {
        setStack(stack);
        updateStackTitles(stack);
        setTimeout(() => ref.current.scrollTop = (stack[stack.length - 1].scrollTop || 0));
    }

    const updateStackTitles = (s = stack) => Promise.all(
        s.map(item => item.title(item.value))
    ).then(titles => setStackTitles(titles));

    if (!stackTitles.length) {
        updateStackTitles();
    }

    const handleChange = value => {
        setValue(value);
        setChanged(true);
    };

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
                        handleBack();
                        current.callback && current.callback(response);
                        setSaving(false);
                    }, 300);
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

    const actions = [];

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
                       loading={saving}
                       onClick={save}
                       className={classes.fabSave}
                       success={done}/>
    );

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

    return <div className={classes.root}>
        <div className={classes.stackHeader}>
            {stackTitles.join(' ')}
        </div>
        <div ref={ref}
             className={
                 clsx(
                     classes.formContainer,
                     !xs && (docked || !md) && classes.smFormContainer,
                     md && classes.mdFormContainer
                 )}>

            <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                            index={stack.length - 1}>
                {forms}
            </SwipeableViews>
            <div className={classes.trailing}/>
            {actions}
        </div>
    </div>;
};

New.Icon = NewIcon;

New.title = 'New';

export default withStyles(styles, { withTheme: true })(New);
