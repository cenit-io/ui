import React, {useState} from 'react';
import ObjectControl from "./ObjectControl";

const valueHash = {};

const FormTest = ({ dataType, height, width }) => {

    const [json, setJSON] = useState('{}');

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

    return <div style={{
        display: 'flex',
        height: `calc(${height})`,
        width: `calc(${width})`,
        overflow: 'auto'
    }}>
        {control}
    </div>;
};

export default FormTest;