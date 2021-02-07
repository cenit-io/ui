import React, { useRef } from 'react';
import ActionRegistry, { CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { Config } from "../common/Symbols";
import { FormRootValue } from "../services/FormValue";
import { useContainerContext } from "./ContainerContext";
import ConverterIcon from "../icons/ConverterIcon";
import { of } from "rxjs";
import { switchMap } from "rxjs/operators";

function ConvertUpdate() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

function convertDataTypeFormFor(sourceDataType) {
    const dt = DataType.from({
        name: 'Update',
        schema: {
            type: 'object',
            properties: {
                converter: {
                    referenced: true,
                    $ref: {
                        namespace: 'Setup',
                        name: 'ConverterTransformation'
                    }
                }
            }
        }
    });

    dt[Config] = {
        fields: {
            converter: {
                selector: {
                    $or: [
                        { source_data_type_id: { $exists: false } },
                        { source_data_type_id: sourceDataType.id }
                    ]
                }
            }
        }
    };

    return dt;
}

const Convert = ({ docked, dataType, onSubjectPicked, height }) => {

    const [containerState] = useContainerContext();

    const { selectedItems, selector } = containerState;

    const value = useRef(new FormRootValue({
        data_type: {
            id: dataType.id,
            _reference: true
        },
        selector: selectedItems.length
            ? { _id: { $in: selectedItems.map(({ id }) => id) } }
            : selector || {}
    }));

    const formDataType = useRef(convertDataTypeFormFor(dataType));

    const handleFormSubmit = (_, value) => {
        const { data_type, selector, converter } = value.get();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!converter?.id) {
                    error = { converter: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }
                return API.post('setup', 'converter_transformation', converter.id, 'digest', {
                    target_data_type_id: data_type.id,
                    selector
                });
            })
        );
    };

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<ConverterIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={ConvertUpdate}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(Convert, {
    bulkable: true,
    icon: ConverterIcon,
    title: 'Convert',
    crud: [CRUD.create, CRUD.update]
});
