import React, { useRef } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { Config } from "../common/Symbols";
import ShredIcon from "@material-ui/icons/DeleteSweep";
import WarningAlert from "./WarningAlert";
import { useContainerContext } from "./ContainerContext";

function SuccessShred() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

function ShredAlert() {
    const { record } = useContainerContext()[0];

    return <WarningAlert title="Warning"
                         message={`Collection ${record.name} and all of it's related data will be destroyed`}
                         mainIcon={ShredIcon}/>;
}

const ShredCollection = ({ docked, record, onSubjectPicked, height }) => {

    const formDataType = useRef(DataType.from({
        name: 'Shred',
        schema: {
            type: 'object',
            properties: {}
        },
        [Config]: {
            formControl: ShredAlert
        }
    }));

    const handleFormSubmit = () => API.delete('setup', 'collection', record.id, 'digest', 'shred', {});

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<ShredIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={SuccessShred}
                        noJSON={true}/>
        </div>
    );
};

export default ActionRegistry.register(ShredCollection, {
    kind: ActionKind.member,
    arity: 1,
    icon: ShredIcon,
    title: 'Shred',
    onlyFor: [{ namespace: 'Setup', name: 'Collection' }]
});
