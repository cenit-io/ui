import React, { useEffect, useState } from 'react';
import { DataType } from "../services/DataTypeService";
import { InputBase, LinearProgress } from "@material-ui/core";
import RefPicker from "./RefPicker";

const RecordSelector = ({ dataTypeId, dataTypeSelector, onSelect, text, inputClasses, disabled, readOnly }) => {
    const [dataType, setDataType] = useState(null);

    useEffect(() => {
        let fetchDataType;
        if (dataTypeId) {
            fetchDataType = DataType.getById(dataTypeId);
        } else {
            fetchDataType = DataType.find(dataTypeSelector);
        }
        const subscription = fetchDataType.subscribe(dt => setDataType(dt));
        return () => subscription.unsubscribe();
    }, [dataTypeId, dataTypeSelector]);

    if (dataType) {
        return <RefPicker dataType={dataType}
                          onPick={onSelect}
                          text={text}
                          inputClasses={inputClasses}
                          disabled={disabled}
                          readOnly={readOnly}/>;
    }

    return <div>
        <InputBase disabled/>
        <LinearProgress/>
    </div>;
};

export default RecordSelector;
