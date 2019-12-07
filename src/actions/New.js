import React from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import NewIcon from '@material-ui/icons/Add';
import { JSON_TYPE } from "../services/DataTypeService";
import FileUploader from "../components/FileUploader";

const New = ({ docked, dataType, theme, classes, rootId, onItemPickup, width, height }) => {

    if (dataType._type === JSON_TYPE) {
        return <FormEditor height={height}
                           docked={docked}
                           dataType={dataType}
                           rootId={rootId}
                           onItemPickup={onItemPickup}/>;
    }

    return <FileUploader width={width}
                         height={height}
                         docked={docked}
                         dataType={dataType}/>
};

export default ActionRegistry.register(New, {
    kind: ActionKind.collection,
    icon: NewIcon,
    title: 'New'
});
