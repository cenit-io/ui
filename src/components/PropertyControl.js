import React, { useEffect, useState } from 'react'
import StringControl from './StringControl';
import { LinearProgress, makeStyles } from '@material-ui/core';
import EmbedsOneControl from "./EmbedsOneControl";
import EmbedsManyControl from "./EmbedsManyControl";
import BooleanControl from "./BooleanControl";
import RefOneControl from "./RefOneControl";
import RefManyControl from "./RefManyControl";
import ErrorMessages from "./ErrorMessages";
import zzip from "../util/zzip";
import NumericControl from "./NumericControl";
import IntegerControl from "./IntegerControl";

function controlComponentFor(property) {
    switch (property.type) {

        case 'object': {
            return EmbedsOneControl;
        }

        case 'array': {
            return EmbedsManyControl;
        }

        case 'boolean': {
            return BooleanControl;
        }

        case 'refOne': {
            return RefOneControl;
        }

        case 'refMany': {
            return RefManyControl;
        }

        case 'number': {
            return NumericControl;
        }

        case 'integer': {
            return IntegerControl;
        }

        default: {
            return StringControl;
        }
    }
}

const useStyles = makeStyles(theme => ({
    control: {
        padding: theme.spacing(1)
    },
    error: {
        color: theme.palette.error.main
    }
}));

function PropertyControl(props) {
    const { errors, property } = props;
    const [state, setState] = useState({});
    const { schema } = state;
    const classes = useStyles();

    useEffect(() => {
        const subscription = zzip(property.getSchema(), property.getTitle()).subscribe(
            ([schema, title]) => setState({ schema, title })
        );

        return () => subscription.unsubscribe();
    }, [property]);

    if (schema) {
        const ControlComponent = controlComponentFor(property);

        const control = <ControlComponent {...state} {...props}/>;

        return (
            <div className={classes.control}>
                <ErrorMessages errors={ControlComponent.ownErrorMessages ? null : errors}>
                    {control}
                </ErrorMessages>
            </div>
        );
    }

    return <LinearProgress/>;
}

export default PropertyControl;
