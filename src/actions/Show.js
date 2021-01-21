import React, { useEffect, useState } from 'react';
import ShowIcon from '@material-ui/icons/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from "@material-ui/core";
import Fab from "@material-ui/core/Fab";
import EditIcon from "@material-ui/icons/Edit";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";

const useStyles = makeStyles(theme => ({
    editButton: {
        position: 'absolute',
        right: theme.spacing(3),
        bottom: theme.spacing(3)
    }
}));

const Show = ({ docked, dataType, record, onSubjectPicked, updateItem, height }) => {
    const [state, setState] = useSpreadState({
        readOnly: true
    });

    const { readOnly, config } = state;

    const classes = useStyles();

    useEffect(() => {
        const subscription = dataType.config().subscribe(
            config => setState({ config })
        );

        return () => subscription.unsubscribe();
    }, [dataType]);

    const submitable = config && (!config.crud || config.crud.indexOf('update') !== -1);

    let editButton;
    if (readOnly && submitable) {
        editButton = (
            <Fab aria-label="edit"
                 color="primary"
                 className={classes.editButton}
                 onClick={() => setState({ readOnly: false })}>
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
                        readOnly={readOnly}
                        noSubmitButton={!submitable}/>
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
