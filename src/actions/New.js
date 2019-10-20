import React, {useState} from 'react';
import NewIcon from '@material-ui/icons/Add';
import FormView from "../components/FormView";
import {useMediaQuery, withStyles} from "@material-ui/core";
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/Save';
import clsx from "clsx";

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
        top: props => `calc(${props.height})`,
        left: props => `calc(${props.width} - ${theme.spacing(10)}px)`
    },
});

const New = ({ docked, dataType, theme, classes }) => {

    const [state, setState] = useState({ changed: true, value: {} });
    const xs = useMediaQuery(theme.breakpoints.down('xs'));
    const md = useMediaQuery(theme.breakpoints.up('md'));

    const handleChange = value => {
        setState({ changed: true, value })
    };

    const { changed, value, errors } = state;

    const save = () => {
        dataType.post(value)
            .then(response => console.log(response))
            .catch(error => setState({ ...state, errors: error.response.data }));
    };

    const actions = [];

    if (changed) {
        actions.push(
            <Fab color="primary"
                 key='save'
                 aria-label="add"
                 className={classes.fab}
                 onClick={save}>
                <SaveIcon/>
            </Fab>
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
                  onChange={handleChange}/>
        <div className={classes.trailing}/>
        {actions}
    </div>;
};

New.Icon = NewIcon;

New.title = 'New';

export default withStyles(styles, { withTheme: true })(New);
