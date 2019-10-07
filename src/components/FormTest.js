import React, {useState} from 'react';
import ObjectControl from "./ObjectControl";
import {makeStyles} from "@material-ui/core";

const useStyles = makeStyles(() => ({
    root: {
        display: 'flex',
        height: ({ height }) => height ? `calc(${height})` : 'unset',
        width: ({ width }) => width ? `calc(${width})` : 'unset',
        overflow: 'auto'
    }
}));

const valueHash = {};

const FormTest = ({ dataType, width }) => {

    const [json, setJSON] = useState('{}'),

        classes = useStyles();

    let control;

    if (dataType) {
        let value = valueHash[dataType.id];
        if (!value) {
            Object.keys(valueHash).forEach(key => delete valueHash[key]);
            valueHash[dataType.id] = value = {};
            handleChange(value);
        }

        control = <ObjectControl dataTypeId={dataType.id}
                                 width={width}
                                 value={value}
                                 onChange={handleChange}/>;
    }

    function handleChange(value) {
        setJSON(JSON.stringify(value, null, 2));
    }

    return <div className={classes.root}>
        {control}
    </div>;
};

export default FormTest;
