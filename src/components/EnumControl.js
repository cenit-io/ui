import React, { useEffect } from 'react';
import { Config } from "../common/Symbols";
import AutocompleteControl from "./AutocompleteControl";

export default function EnumControl({
                                        title,
                                        value,
                                        disabled,
                                        readOnly,
                                        error,
                                        onChange,
                                        property
                                    }) {
    useEffect(() => {
        const enumOptions = property.propertySchema.enum;
        if (!enumOptions[Config]) {
            const config = enumOptions[Config] = {};
            const { enumNames } = property.propertySchema;
            enumOptions.forEach(
                (option, index) => config[option] = (enumNames && enumNames[index]) || `${option}`
            );
        }
    }, [property]);

    return <AutocompleteControl options={property.propertySchema.enum[Config]}
                                title={title}
                                value={value}
                                disabled={disabled}
                                readOnly={readOnly}
                                error={error}
                                onChange={onChange}/>;
}
