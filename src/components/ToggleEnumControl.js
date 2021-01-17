import React, { useEffect } from 'react';
import Button from "@material-ui/core/Button";
import { useSpreadState } from "../common/hooks";
import { makeStyles } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles(theme => ({
    option: {
        margin: theme.spacing(1)
    }
}));

export default function EnumControl({
                                        title,
                                        value,
                                        disabled,
                                        readOnly,
                                        error,
                                        onChange,
                                        property
                                    }) {
    const [state, setState] = useSpreadState({
        options: {}
    });

    const classes = useStyles();

    const { options } = state;

    useEffect(() => {
        const subscription = value.changed().subscribe(() => setState({}));
        return () => subscription.unsubscribe();
    }, [value]);

    useEffect(() => {
        const enumOptions = property.propertySchema.enum;
        const options = {};
        const { enumNames } = property.propertySchema;
        enumOptions.forEach(
            (option, index) => options[option] = (enumNames && enumNames[index]) || `${option}`
        );
        setState({ options });
    }, [property]);

    const selectOption = option => () => {
        if (value.get() === option) {
            value.delete();
        } else {
            value.set(option);
        }
        setState({}); //to refresh
    }

    value.get();

    const optionsControls = Object.keys(options).map(
        option => (
            <Button key={option}
                    variant={option === value.cache ? 'contained' : 'outlined'}
                    className={classes.option}
                    color={option === value.cache ? 'primary' : 'default'}
                    onClick={selectOption(option)}>
                {options[option]}
            </Button>
        )
    );

    return (
        <div>
            <Typography variant="subtitle2">
                {title}
            </Typography>
            <div className="flex justify-content-center align-items-center wrap">
                {optionsControls}
            </div>
        </div>
    );
}
