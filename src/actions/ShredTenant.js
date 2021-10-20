import React, { useRef, useEffect } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import { Config } from "../common/Symbols";
import ShredIcon from "@material-ui/icons/DeleteSweep";
import WarningAlert from "./WarningAlert";
import { useContainerContext } from "./ContainerContext";
import { map } from "rxjs/operators";
import Show from './Show';
import Random from '../util/Random';

function SuccessShred() {
    return (
        <SuccessAlert mainIcon={ShredIcon}/>
    );
}

function ShredAlert() {
    const { record } = useContainerContext()[0];

    return <WarningAlert title="Warning"
                         message={`All the data in the tenant  ${record.name} will be destroyed`}
                         mainIcon={ShredIcon}/>;
}

const ShredTenant = ({ docked, record, onSubjectPicked, height }) => {

    const containerContext = useContainerContext();
    const [, setContainerState] = containerContext;

    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Shred" });
  
        return () => {
          setContainerState({ breadcrumbActionName: null });
        };
      }, []);

    const handleCancel = () => {
      setContainerState({
        selectedItems: [],
        landingActionKey: Show.key,
        actionKey: Show.key,
        actionComponentKey: Random.string(),
      });
    };

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

    const handleFormSubmit = () => API.delete('setup', 'account', record.id, 'digest', 'shred', {}).pipe(
        map(() => record)
    );

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<ShredIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={SuccessShred}
                        cancelEditor={handleCancel}
                        noJSON={true}/>
        </div>
    );
};

export default ActionRegistry.register(ShredTenant, {
    kind: ActionKind.member,
    arity: 1,
    icon: ShredIcon,
    title: 'Shred',
    onlyFor: [{ namespace: '', name: 'Account' }]
});
