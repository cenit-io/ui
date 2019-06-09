import React, {useState} from 'react';
import ObjectControl from "./ObjectControl";
import {DataType} from '../services/DataTypeService';
import RefPicker from "./RefPicker";
import RecordSelector from "./RecordSelector";

const SetupDataTypeSelector = { namespace: 'Setup', name: 'DataType' };

const FormTest = () => {

    const [json, setJSON] = useState('{}'),
        [data, setData] = useState({});


    let control;

    if (data.dataType) {
        control = <div style={{
            display: 'flex',
            marginTop: '10px',
            flexDirection: 'column',
            height: '90vh',
            overflow: 'auto'
        }}>
            <h3>{data.title}</h3>
            <ObjectControl dataTypeId={data.dataType.id}
                           value={data.value}
                           onChange={handleChange}/>
        </div>;
    }

    function handleChange(value) {
        setJSON(JSON.stringify(value, null, 2));
    }

    function handleSelect(item) {
        setData({ dataType: item.record, title: item.title, value: {} });
    }

    return <div style={{ display: 'flex', padding: '10px' }}>
        <div style={{ display: 'flex', width: '50%', flexDirection: 'column', height: '90vh', overflow: 'auto' }}>
            <RecordSelector dataTypeSelector={SetupDataTypeSelector} onSelect={handleSelect}/>
            {control}
        </div>
        <pre style={{ width: '50%', overflow: 'auto' }}>{json}</pre>
    </div>;
};

export default FormTest;