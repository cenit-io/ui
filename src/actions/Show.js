import React, { useState } from 'react';
import ShowIcon from '@material-ui/icons/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from "@material-ui/core";
import Fab from "@material-ui/core/Fab";
import EditIcon from "@material-ui/icons/Edit";
import FormEditor from "../components/FormEditor";

const useStyles = makeStyles(theme => ({
    editButton: {
        position: 'absolute',
        right: theme.spacing(3),
        bottom: theme.spacing(3)
    }
}));

const Show = ({ docked, dataType, record, onSubjectPicked, updateItem, height }) => {
    const [readOnly, setReadOnly] = useState(true);

    const classes = useStyles();

    let editButton;
    if (readOnly) {
        editButton = (
            <Fab aria-label="edit"
                 color="primary"
                 className={classes.editButton}
                 onClick={() => setReadOnly(false)}>
                <EditIcon/>
            </Fab>
        );
    }

    return (
        <div className="relative">
            <FormEditor rootId={record.id}
                        docked={docked}
                        dataType={dataType}
                        value={{ id: record.id }}
                        onUpdate={updateItem}
                        onSubjectPicked={onSubjectPicked}
                        height={height}
                        readOnly={readOnly}/>
            {editButton}
        </div>
    );
};

export default ActionRegistry.register(Show, {
    kind: ActionKind.member,
    icon: ShowIcon,
    title: 'Show',
    arity: 1
});
