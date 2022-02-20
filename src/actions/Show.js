import React, { useEffect } from 'react';
import ShowIcon from '@material-ui/icons/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from "@material-ui/core";
import Fab from "@material-ui/core/Fab";
import EditIcon from "@material-ui/icons/Edit";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { useContainerContext } from './ContainerContext';

const useStyles = makeStyles(theme => ({
    editButton: {
        position: 'absolute',
        right: theme.spacing(3),
        bottom: theme.spacing(3)
    }
}));

const Show = ({ docked, dataType, record, onSubjectPicked, onUpdate, height }) => {
    const [state, setState] = useSpreadState({
        readOnly: true
    });

    const containerContext = useContainerContext();
    const [, setContainerState] = containerContext;

    const { readOnly, config } = state;

    const classes = useStyles();

    useEffect(() => {
        setContainerState({ breadcrumbActionName: readOnly ? "Show" : "Edit" });

        return () => {
          setContainerState({ breadcrumbActionName: null });
        };
      }, [readOnly]);

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
                <EditIcon component="svg"/>
            </Fab>
        );
    }

    return (
        <div className="relative">
            <FormEditor rootId={record.id}
                        docked={docked}
                        dataType={dataType}
                        value={{ id: record.id }}
                        onSubjectPicked={onSubjectPicked}
                        height={height}
                        readOnly={readOnly}
                        cancelEditor={() => setState({ readOnly: true })}
                        noSubmitButton={!submitable}
                        onUpdate={onUpdate}/>
            {editButton}
        </div>
    );
};

export default ActionRegistry.register(Show, {
    kind: ActionKind.member,
    icon: ShowIcon,
    title: 'Show',
    arity: 1,
    key: 'show'
});
