import React, { useEffect, useState } from 'react';
import ObjectControl from "./ObjectControl";
import { makeStyles } from "@material-ui/core";
import { catchError, switchMap } from "rxjs/operators";
import { of } from "rxjs";

const useStyles = makeStyles(() => ({
    root: {
        display: 'flex',
        height: ({ height }) => height ? `calc(${height})` : 'unset',
        width: ({ width }) => width ? `calc(${width})` : 'unset',
        overflow: 'auto'
    }
}));

const FormView = ({ dataType, width, value, onChange, disabled, onStack, rootId, readOnly, submitter, onSubmitDone }) => {

    const [errors, setErrors] = useState(null);
    const classes = useStyles();

    useEffect(() => {
        const subscription = submitter.pipe(
            switchMap(
                ({ value, viewport }) =>
                    dataType.post(value, {
                        viewport,
                        add_only: rootId,
                        add_new: !rootId
                    })
            ),
            catchError(error => {
                setErrors(error.response.data);
                return of(null);
            })
        ).subscribe(value => onSubmitDone(value));

        return () => subscription.unsubscribe();
    }, [submitter, dataType, onSubmitDone, rootId]);

    let control;

    if (dataType) {
        control = <ObjectControl rootDataType={dataType}
                                 jsonPath='$'
                                 dataTypeId={dataType.id}
                                 width={width}
                                 value={value}
                                 errors={errors}
                                 onChange={handleChange}
                                 disabled={disabled}
                                 readOnly={readOnly}
                                 onStack={onStack}
                                 rootId={rootId}/>;
    }

    function handleChange(value) {
        onChange && onChange(value);
    }

    return <div className={classes.root}>
        {control}
    </div>;
};

export default FormView;
