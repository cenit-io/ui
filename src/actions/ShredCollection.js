import React, { useRef, useEffect } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import { Config } from "../common/Symbols";
import ShredIcon from "@material-ui/icons/DeleteSweep";
import WarningAlert from "./WarningAlert";
import { useContainerContext } from "./ContainerContext";
import { tap } from "rxjs/operators";

function ShredAlert() {
    const { record } = useContainerContext()[0];

    return <WarningAlert title="Warning"
                         message={`Collection ${record.name} and all of it's related data will be destroyed`}
                         mainIcon={ShredIcon}/>;
}

const ShredCollection = ({ docked, record, onSubjectPicked, height, onClose }) => {
    const containerContext = useContainerContext();
    const [, setContainerState] = containerContext;

    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Shred" });
  
        return () => {
          setContainerState({ breadcrumbActionName: null });
        };
      }, []);
    
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

    const handleFormSubmit = () => API.delete('setup', 'collection', record.id, 'digest', 'shred', {}).pipe(
        tap(() => setTimeout(onClose, 1000))
    );

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<ShredIcon component="svg"/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
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
