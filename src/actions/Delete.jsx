import React, { useEffect } from 'react';
import ActionRegistry, { CRUD } from "./ActionRegistry";
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Info';
import CheckIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import clsx from "clsx";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { CircularProgress } from "@mui/material";
import ResponsiveContainer from "../components/ResponsiveContainer";
import { useContainerContext } from "./ContainerContext";
import { map } from "rxjs/operators";
import pluralize from "pluralize";
import Show from "./Show";
import zzip from "../util/zzip";
import { useSpreadState } from "../common/hooks";
import TextField from "@mui/material/TextField";

const Status = Object.freeze({
  loading: 1,
  ready: 2,
  destroying: 3,
  destroyed: 4,
  failed: 5
});

const CONFIRMATION_PHRASE = 'permanently delete';

const Delete = ({ dataType, onCancel, onClose }) => {
  const [state, setState] = useSpreadState({
    status: Status.loading,
    title: null,
  });

  const [containerState, setContainerState] = useContainerContext();

  const { selectedItems, landingActionKey, selector } = containerState;

  const { status, title, config, confirmed } = state;

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Delete" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  useEffect(() => {
    let theTitle;
    if (selectedItems.length === 1) {
      theTitle = dataType.titleFor(selectedItems[0]).pipe(
        map(title => `${title} will be destroyed!`)
      );
    } else {
      theTitle = dataType.getTitle().pipe(
        map(dtTitle => {
          dtTitle = pluralize(dtTitle);
          if (selectedItems.length > 1) {
            return `${selectedItems.length} ${dtTitle} will be destroyed!`;
          }
          return `All the found ${dtTitle} will be destroyed`;
        })
      );
    }
    const subscription = zzip(dataType.config(), theTitle).subscribe(
      ([config, title]) => {
        setState({
          status: Status.ready,
          title,
          config,
          confirmed: !config.actions?.delete?.confirmation
        });
      }
    );
    return () => subscription.unsubscribe();
  }, [dataType, selectedItems]);

  useEffect(() => {
    switch (status) {
      case Status.destroying: {
        const selection = selectedItems.length
          ? { _id: { $in: selectedItems.map(({ id }) => id) } }
          : selector || {};
        const subscription = dataType.bulkDelete(selection).subscribe(
          () => setState({ status: Status.destroyed }),
          () => setState({ status: Status.failed })
        );
        return () => subscription.unsubscribe();
      }
      case Status.destroyed:
        setTimeout(() => {
          if (landingActionKey === Show.key) {
            onClose();
          } else {
            setContainerState({ actionKey: landingActionKey })
          }
        }, 1000);
    }
  }, [status, selector]);

  const handleDestroy = () => setState({ status: Status.destroying });

  let statusUI, actions, text;
  switch (status) {
    case Status.ready:
      statusUI = <WarningIcon sx={{
        position: 'absolute',
        top: '8px',
        right: 0,
        background: theme => theme.palette.background.paper,
        borderRadius: '50%'
      }} color="secondary" component="svg" />;
      text = title;
      const confirmation = config.actions?.delete?.confirmation && (
        <>
          <Typography component="div"
                      variant="subtitle1"
                      sx={{ color: theme => theme.palette.text.secondary, textAlign: 'center' }}>
            This is a high risk operation and the associated data may be lost forever.
          </Typography>
          <Typography component="div"
                      variant="subtitle2"
                      sx={{ color: theme => theme.palette.text.secondary, textAlign: 'center' }}>
            To confirm deletion, type <em>{CONFIRMATION_PHRASE}</em> in the text input below.
          </Typography>
          <TextField variant="outlined"
                     sx={{ my: 1, px: 1 }}
                     placeholder={CONFIRMATION_PHRASE}
                     onChange={e => setState({ confirmed: e.target.value === CONFIRMATION_PHRASE })} />
        </>
      );
      actions = (
        <>
          {confirmation || (
            <Typography variant='subtitle1'
                        className={clsx(classes.successLabel, classes.alignCenter)}
                        component="div">
              Are you sure you want to proceed?
            </Typography>
          )}
          <Box sx={{ textAlign: 'center' }}>
            <Button variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon component="svg" />}
                    sx={{ m: 1 }}
                    onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="contained"
                    color="secondary"
                    startIcon={<CheckIcon component="svg" />}
                    sx={{ m: 1 }}
                    onClick={handleDestroy}
                    disabled={!confirmed}>
              {confirmation ? 'Delete' : "Yes, I'm sure!"}
            </Button>
          </Box>
        </>
      );
      break;
    case Status.destroyed:
      statusUI = <CheckIcon sx={{
        position: 'absolute',
        top: '8px',
        right: 0,
        background: theme => theme.palette.background.paper,
        borderRadius: '50%'
      }} color="secondary" component="svg" />;
      text = `Done!`;
      break;
    case Status.failed:
      statusUI = <WarningIcon sx={{
        position: 'absolute',
        top: '8px',
        right: 0,
        background: theme => theme.palette.background.paper,
        borderRadius: '50%'
      }} color="secondary" component="svg" />;
      text = 'Operation failed';
      break;
    default:
      statusUI = <CircularProgress size={110} sx={{
        color: theme => theme.palette.secondary.main,
        position: 'absolute',
        top: -4,
        left: -4,
        zIndex: 1101,
      }} />;
      if (status === Status.destroying) {
        text = 'Destroying...';
      }
  }

  return <ResponsiveContainer>
    <Box sx={{
      p: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: theme => theme.palette.background.default
    }}>
      <Box className={clsx('flex column align-items-center')} sx={{
        width: '100px',
        minHeight: '100px',
        borderRadius: '50%',
        position: 'relative',
        background: theme => theme.palette.secondary.light,
        mt: 3,
        mb: 3,
        justifyContent: 'center'
      }}>
        {statusUI}
        <DeleteIcon fontSize='large' component="svg" />
      </Box>
      <Typography variant='h5' sx={{ textAlign: 'center' }} component="div">
        {text}
      </Typography>
      {actions}
    </Box>
  </ResponsiveContainer>;
};

export default ActionRegistry.register(Delete, {
  icon: DeleteIcon,
  title: 'Delete',
  bulkable: true,
  bulkableExceptions: [
    { namespace: '', name: 'Account' },
    { namespace: '', name: 'User' }
  ],
  activeColor: 'secondary',
  crud: [CRUD.delete],
  group: 4,
  key: 'delete'
});
