import React, { useEffect, useRef } from 'react';
import ActionRegistry from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { switchMap } from "rxjs/operators";
import { useContainerContext } from "./ContainerContext";
import SharedCollectionIcon from "../icons/SharedCollectionIcon";
import { Config } from "../common/Symbols";
import ToggleEnumControl from "../components/ToggleEnumControl";
import { FormRootValue } from "../services/FormValue";
import { eq } from "../services/BLoC";
import { of } from "rxjs";


function SuccessExport() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

function exportDataTypeFormFor(sourceDataType, formats, selectedItems) {
    const properties = {};
    if (formats.length > 1) {
        properties.format = {
            type: 'string',
            enum: formats
        };
    }
    properties.template = {
        referenced: true,
        $ref: {
            namespace: 'Setup',
            name: 'Template'
        }
    };
    const dt = DataType.from({
        name: 'Export',
        schema: {
            type: 'object',
            properties
        }
    });

    const defaultSelector = {
        $or: [
            { source_data_type_id: { $exists: false } },
            { source_data_type_id: sourceDataType.id }
        ]
    };

    const config = dt[Config] = {
        fields: {
            template: {
                controlProps: {
                    additionalViewportProps: ['file_extension'],
                },
                selector: defaultSelector
            }
        }
    };

    if (selectedItems.length !== 1) {
        defaultSelector.bulk_source = true;
    }

    if (formats.length > 1) {
        config.fields.format = {
            control: ToggleEnumControl,
            controlProps: {
                title: 'Available formats'
            }
        };
        config.dynamicConfig = ({ format }, state) => {
            const selector = defaultSelector;
            if (format) {
                if (format !== state.template?.selector?.file_extension) {
                    selector.file_extension = format;

                    return {
                        template: { selector }
                    }
                }
            } else if (!eq(state.template?.selector, selector)) {
                return {
                    template: { selector }
                };
            }
        };
    }

    return dt;
}

const Export = ({ docked, dataType, onSubjectPicked, height }) => {
    const [state, setState] = useSpreadState();

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

    const { formDataType } = state;

    useEffect(() => {
        const subscription = value.current.changed().subscribe(
            ({ format, template }) => {
                if (template && format && template.file_extension !== format) {
                    setTimeout(
                        () => value.current.propertyValue('template').delete(true)
                    );
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = DataType.find({
            namespace: 'Setup',
            name: 'Template'
        }).pipe(
            switchMap(
                templateDataType => {
                    const selector = {};
                    if (selectedItems.length !== 1) {
                        selector.bulk_source = true;
                    }
                    return templateDataType.distinct('file_extension', { selector });
                }
            )
        ).subscribe(
            formats => {
                formats = formats.filter(f => f);
                setState({ formDataType: exportDataTypeFormFor(dataType, formats, selectedItems) })
            }
        );

        return () => subscription.unsubscribe();
    }, [dataType, selectedItems]);

    const handleFormSubmit = (_, value) => {
        const { data_type, selector, template } = value.get();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!template?.id) {
                    error = { template: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }
                return API.post('setup', 'template', template.id, 'digest', {
                    source_data_type_id: data_type.id,
                    selector
                });
            })
        );
    };

    if (formDataType) {
        return (
            <div className="relative">
                <FormEditor docked={docked}
                            dataType={formDataType}
                            height={height}
                            submitIcon={<SharedCollectionIcon/>}
                            onFormSubmit={handleFormSubmit}
                            onSubjectPicked={onSubjectPicked}
                            successControl={SuccessExport}
                            value={value.current}/>
            </div>
        );
    }

    return <Loading/>;
};

export default ActionRegistry.register(Export, {
    bulkable: true,
    icon: SharedCollectionIcon,
    title: 'Export'
});
