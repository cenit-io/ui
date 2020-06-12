import React, { useEffect, useReducer } from 'react'
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
import CodeMirrorControl from "./CodeMirrorControl";
import StringCodeControl from "./StringCodeControl";
import JsonControl from "./JsonControl";

function controlComponentFor(property) {
    switch (property.type) {

        case 'embedsOne': {
            return EmbedsOneControl;
        }

        case 'embedsMany': {
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

        case 'string': {
            if (property.propertySchema.contentMediaType) {
                return StringCodeControl;
            }

            return StringControl;
        }

        default: {
            return JsonControl;
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


function reducer(state, newState) {
    return { ...state, ...newState };
}

function PropertyControl(props) {
    const [state, setState] = useReducer(reducer, {});

    const { errors, property, onChange } = props;
    const { schema, controlErrors } = state;
    const classes = useStyles();

    useEffect(() => {
        const subscription = zzip(property.getSchema(), property.getTitle()).subscribe(
            ([schema, title]) => setState({ schema, title })
        );

        return () => subscription.unsubscribe();
    }, [property]);

    useEffect(() => setState({ controlErrors: null }), [errors]);

    const handleChange = value => {
        if (errors && errors.length && !controlErrors) {
            setErrors([]);
        }
        onChange(value);
    };

    const setErrors = controlErrors => setState({ controlErrors });

    if (schema) {
        const ControlComponent = controlComponentFor(property);

        const currentErrors = ControlComponent.ownErrorMessages ? null : (controlErrors || errors);

        const control = <ControlComponent {...state}
                                          {...props}
                                          errors={currentErrors}
                                          onError={setErrors}
                                          onChange={handleChange}/>;

        return (
            <div className={classes.control}>
                <ErrorMessages errors={currentErrors}>
                    {control}
                </ErrorMessages>
            </div>
        );
    }

    return <LinearProgress/>;
}

export default PropertyControl;
