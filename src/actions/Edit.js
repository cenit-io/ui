import React from 'react';
import EditIcon from '@material-ui/icons/Edit';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";


const Edit = ({ docked, dataType, item, onItemPickup, height }) => {

    return <FormEditor rootId={item.id}
                       docked={docked}
                       dataType={dataType}
                       value={{ id: item.id }}
                       onItemPickup={onItemPickup}
                       height={height}/>;
};

export default ActionRegistry.register(Edit, {
    kind: ActionKind.member,
    icon: EditIcon,
    title: 'Edit',
    arity: 1
});
