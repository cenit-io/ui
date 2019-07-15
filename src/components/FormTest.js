import React, {useState} from 'react';
import ObjectControl from "./ObjectControl";

const valueHash = {};

const FormTest = ({ dataType, height }) => {

    const [json, setJSON] = useState('{}');

    let control;

    if (dataType) {
        let value = valueHash[dataType.id];
        if (!value) {
            Object.keys(valueHash).forEach(key => delete valueHash[key]);
            valueHash[dataType.id] = value = {};
            handleChange(value);
        }

        control = <div style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
        }}>
            <ObjectControl dataTypeId={dataType.id}
                           value={value}
                           onChange={handleChange}/>
        </div>;
    }

    function handleChange(value) {
        setJSON(JSON.stringify(value, null, 2));
    }

    return <div style={{ display: 'flex', height: `calc(${height})`, overflow: 'auto' }}>
        <div style={{ width: '50%' }}>
            {control}
        </div>
        <pre style={{ width: '50%' }}>{json}</pre>
    </div>;
};

export default FormTest;