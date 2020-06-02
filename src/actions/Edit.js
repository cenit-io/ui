import React from 'react';
import EditIcon from '@material-ui/icons/Edit';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";


const Edit = ({ docked, dataType, record, updateItem, onSubjectPicked, height }) => {

    return <FormEditor rootId={record.id}
                       docked={docked}
                       dataType={dataType}
                       value={{ id: record.id }}
                       onUpdate={updateItem}
                       onSubjectPicked={onSubjectPicked}
                       height={height}/>;
};

export default ActionRegistry.register(Edit, {
    kind: ActionKind.member,
    icon: EditIcon,
    title: 'Edit',
    arity: 1
});
