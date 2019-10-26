import React, { useState } from 'react';
import NewIcon from '@material-ui/icons/Add';
import FormView from "../components/FormView";
import { useMediaQuery, withStyles } from "@material-ui/core";
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/Save';
import clsx from "clsx";
import LoadingButton from "../components/LoadingButton";

const styles = theme => ({
    root: {
        width: '100%',
        overflow: 'auto',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1)
    },
    formContainer: {
        height: props => `calc(${props.height})`,
        overflow: 'auto'
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
    fab: {
        position: 'absolute',
        top: props => `calc(${props.height} - ${theme.spacing(3)}px)`,
        left: props => `calc(${props.width} - ${theme.spacing(12)}px)`
    },
});

const New = ({ docked, dataType, theme, classes }) => {

    const [done, setDone] = useState(false);
    const [saving, setSaving] = useState(false);
    const [value, setValue] = useState({});
    const [changed, setChanged] = useState(false);
    const [errors, setErrors] = useState(null);
    const xs = useMediaQuery(theme.breakpoints.down('xs'));
    const md = useMediaQuery(theme.breakpoints.up('md'));

    const handleChange = value => {
        setValue(value);
        setChanged(true);
    };

    const save = () => {
        setSaving(true);
        setDone(false);
        setTimeout(() =>
            dataType.post(value)
                .then(response => {
                    setSaving(false);
                    setDone(true);
                })
                .catch(error => {
                    setSaving(false);
                    setErrors(error.response.data);
                }), 5000
        )
    };

    const actions = [];

    if (changed) {
        actions.push(
            <LoadingButton key='save'
                           loading={saving}
                           onClick={save}
                           className={classes.fab}
                           success={done}/>
        );
    }

    return <div className={
        clsx(
            classes.formContainer,
            !xs && (docked || !md) && classes.smFormContainer,
            md && classes.mdFormContainer
        )}>
        <FormView dataType={dataType}
                  value={value}
                  errors={errors}
                  onChange={handleChange}
                  disabled={saving}/>
        <div className={classes.trailing}/>
        {actions}
    </div>;
};

New.Icon = NewIcon;

New.title = 'New';

export default withStyles(styles, { withTheme: true })(New);
