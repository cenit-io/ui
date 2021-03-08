import React, { useEffect, useState } from 'react';
import AutocompleteControl from "./AutocompleteControl";

export default function EnumControl({
                                        title,
                                        value,
                                        disabled,
                                        readOnly,
                                        error,
                                        onChange,
                                        property,
                                        deleteDisabled
                                    }) {
    const [options, setOptions] = useState({});

    useEffect(() => {
        const enumOptions = property.propertySchema.enum;
        const options = {};
        const { enumNames } = property.propertySchema;
        enumOptions.forEach(
            (option, index) => options[option] = (enumNames && enumNames[index]) || `${option}`
        );
        setOptions(options);
    }, [property]);

    return <AutocompleteControl options={options}
                                title={title}
                                value={value}
                                disabled={disabled}
                                readOnly={readOnly}
                                error={error}
                                onChange={onChange}
                                deleteDisabled={deleteDisabled}/>;
}
