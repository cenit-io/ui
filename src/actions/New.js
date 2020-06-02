import React from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import NewIcon from '@material-ui/icons/Add';

const New = ({ docked, dataType, theme, classes, rootId, onSubjectPicked, width, height }) => {

    return <FormEditor height={height}
                       width={width}
                       docked={docked}
                       dataType={dataType}
                       rootId={rootId}
                       onSubjectPicked={onSubjectPicked}/>;

};

export default ActionRegistry.register(New, {
    kind: ActionKind.collection,
    icon: NewIcon,
    title: 'New'
});
