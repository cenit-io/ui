import React, { useEffect } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import EditIcon from "@material-ui/icons/Edit";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { useContainerContext } from './ContainerContext';
import Show from "./Show";

const Edit = ({ docked, dataType, record, onSubjectPicked, onUpdate, height }) => {
    const [state, setState] = useSpreadState();

    const containerContext = useContainerContext();
    const [, setContainerState] = containerContext;

    const { config } = state;

    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Edit" });
    }, []);

    useEffect(() => {
        const subscription = dataType.config().subscribe(
            config => setState({ config })
        );

        return () => subscription.unsubscribe();
    }, [dataType]);

    const submitable = config && (!config.crud || config.crud.indexOf('update') !== -1);

    return (
        <div className="relative">
            <FormEditor rootId={record.id}
                        docked={docked}
                        dataType={dataType}
                        value={{ id: record.id }}
                        onSubjectPicked={onSubjectPicked}
                        height={height}
                        cancelEditor={() => setContainerState({ actionKey: Show.key })}
                        noSubmitButton={!submitable}
                        onUpdate={onUpdate}
                        formActionKey={Edit.key}/>
        </div>
    );
};

export default ActionRegistry.register(Edit, {
    kind: ActionKind.member,
    icon: EditIcon,
    title: 'Edit',
    arity: 1,
    key: 'edit'
});
