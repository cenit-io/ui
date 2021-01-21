import React, { useRef } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { Config } from "../common/Symbols";
import { FormRootValue } from "../services/FormValue";
import ImportIcon from "@material-ui/icons/CloudUpload";
import DataControl from "../components/DataControl";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";


function SuccessImport() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

function importDataTypeFormFor(targetDataType) {
    const dt = DataType.from({
        name: 'Export',
        schema: {
            type: 'object',
            properties: {
                parser: {
                    referenced: true,
                    $ref: {
                        namespace: 'Setup',
                        name: 'ParserTransformation'
                    }
                },
                data: {
                    type: 'object'
                }
            }
        }
    });

    dt[Config] = {
        fields: {
            parser: {
                selector: {
                    $or: [
                        { target_data_type_id: { $exists: false } },
                        { target_data_type_id: targetDataType.id }
                    ]
                }
            },
            data: {
                control: DataControl
            }
        }
    };

    return dt;
}

const Import = ({ docked, dataType, onSubjectPicked, height }) => {

    const value = useRef(new FormRootValue({
        data_type: {
            id: dataType.id,
            _reference: true
        }
    }));

    const formDataType = useRef(importDataTypeFormFor(dataType));

    const handleFormSubmit = (_, value) => {
        const { data_type, parser, data } = value.get();
        let formData;
        if (data.type === 'file') {
            if ((formData = data.file)) {
                formData = Object.values(formData)[0];
            }
        } else {
            formData = data.plain_data;
        }
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!parser?.id) {
                    error = { parser: ['is required'] };
                }
                if (!formData) {
                    error = { ...error, data: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }

                return API.post('setup', 'parser_transformation', parser.id, 'digest', {
                    headers: {
                        'X-Digest-Options': JSON.stringify({ target_data_type_id: data_type.id })
                    }
                }, formData)
            })
        );
    };

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<ImportIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={SuccessImport}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(Import, {
    kind: ActionKind.collection,
    icon: ImportIcon,
    title: 'Import',
    crud: [CRUD.create, CRUD.update]
});
