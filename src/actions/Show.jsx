import React, { useEffect } from 'react';
import ShowIcon from '@mui/icons-material/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import EditIcon from "@mui/icons-material/Edit";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { useContainerContext } from './ContainerContext';
import Edit from "./Edit";

const Show = ({ docked, dataType, record, onSubjectPicked, height }) => {
  const [state, setState] = useSpreadState({
    readOnly: true
  });

  const containerContext = useContainerContext();
  const [, setContainerState] = containerContext;

  const { config } = state;

  const jsonProjection = ({ id }) => dataType.get(id);

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Show" });
  }, []);

  useEffect(() => {
    const subscription = dataType.config().subscribe(
      config => setState({ config })
    );

    return () => subscription.unsubscribe();
  }, [dataType]);

  const submitable = config && (!config.crud || config.crud.indexOf('update') !== -1);

  let editButton;
  if (submitable) {
    editButton = (
      <Fab aria-label="edit"
           color="primary"
           sx={(theme) => ({
             position: 'absolute',
             right: theme.spacing(3),
             bottom: theme.spacing(3),
           })}
           onClick={() => setContainerState({ actionKey: Edit.key })}>
        <EditIcon component="svg" />
      </Fab>
    );
  }

  return (
    <Box className="relative">
      <FormEditor rootId={record.id}
                  docked={docked}
                  dataType={dataType}
                  value={{ id: record.id }}
                  onSubjectPicked={onSubjectPicked}
                  height={height}
                  readOnly={true}
                  noSubmitButton={true}
                  jsonProjection={jsonProjection}
                  formActionKey={Show.key} />
      {editButton}
    </Box>
  );
};

export default ActionRegistry.register(Show, {
  kind: ActionKind.member,
  icon: ShowIcon,
  title: 'Show',
  arity: 1,
  key: 'show'
});
