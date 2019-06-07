import React, {useState} from 'react';
import ObjectControl from "./ObjectControl";
import {DataType} from '../services/DataTypeService';
import RefPicker from "./RefPicker";

const FormTest = () => {

    const [json, setJSON] = useState('{}'),
        [setupDataType, setSetupDataType] = useState(null),
        [data, setData] = useState({});

    if (!setupDataType) {
        DataType.find({ namespace: 'Setup', name: 'DataType' })
            .then(dataType => setSetupDataType(dataType));
    }

    let picker, control;

    if (setSetupDataType) {
        picker = <RefPicker dataType={setupDataType} onPick={handelPick} text="Pick a Data Type"/>;
    }

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

    function handelPick(item) {
        setData({ dataType: item.record, title: item.title, value: {} });
    }

    return <div style={{ display: 'flex', padding: '10px' }}>
        <div style={{ display: 'flex', width: '50%', flexDirection: 'column', height: '90vh', overflow: 'auto' }}>
            {picker}
            {control}
        </div>
        <pre style={{ width: '50%', overflow: 'auto' }}>{json}</pre>
    </div>;
};

export default FormTest;