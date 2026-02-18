import React, { useContext, useRef } from 'react';
import { isObservable, of, Subject } from "rxjs";
import { useSpreadState } from "../common/hooks";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Dialog from "@mui/material/Dialog";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { catchError, switchMap } from "rxjs/operators";
import Random from "../util/Random";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { RecordSubject } from "../services/subjects";
import { useTenantContext } from "../layout/TenantContext";

const CC = React.createContext({});


export function useContainerContext() {
  return useContext(CC);
}

const extractErrorMessageFrom = err => {
  let data = err.response?.data;
  if (data?.$) {
    const msgs = Array.isArray(data.$)
      ? data.$
      : [data.$];
    return msgs.join(' ');
  }

  return err.message;
};

export default function ContainerContext({ kind, initialState, children, homeActionKey }) {

  const actionSubscription = useRef(null);

  const tenantContext = useTenantContext();

  const value = useSpreadState(initialState);

  const [state, setState] = value;

  const { confirm } = state;

  const confirmationSubject = useRef(new Subject());
  const confirmOptions = useRef({});

  const { selector, selectedItems } = state;

  const actionContext = useRef({});

  const handleAction = useRef((dataType, actionKey, onSubjectPicked, items) => {
    const { selectedItems, value, selector, tenantContext } = actionContext.current;
    items = items || selectedItems;
    if (actionSubscription.current) {
      actionSubscription.current.unsubscribe();
      actionSubscription.current = null;
    }
    const action = ActionRegistry.byKey(actionKey);
    if (action) {
      if (!action.kind || action.kind === ActionKind.collection || action.bulkable) {
        if (action.executable) {
          const r = action.call(this, {
            dataType, tenantContext, selectedItems: items, containerContext: value, selector
          });
          if (isObservable(r)) {
            setState({ loading: true });
            actionSubscription.current = r.pipe(
              catchError(e => value.confirm({
                title: 'Error',
                message: `An error occurred: ${extractErrorMessageFrom(e)}`,
                justOk: true
              }))
            ).subscribe(() => {
              setState({
                loading: false,
                actionKey: homeActionKey,
                actionComponentKey: Random.string()
              });
            });
          }
        } else {
          if (items !== selectedItems) {
            setState({ selectedItems: items });
          }
          if (action.drawer) {
            setState({ drawerActionKey: actionKey });
          } else {
            setState({ actionKey, actionComponentKey: Random.string() });
          }
        }
      } else {
        setState({ loading: true });
        const { _type, id } = items[0];
        actionSubscription.current = (
          ((!_type || _type === dataType.type_name()) && of(dataType)) ||
          dataType.findByName(_type)
        ).pipe(
          switchMap(recordDataType => {
              if (recordDataType) {
                if (action.executable) {
                  const r = action.call(this, {
                    dataType: recordDataType,
                    record: items[0],
                    tenantContext,
                    containerContext: value,
                    selector
                  });
                  if (isObservable(r)) {
                    return r.pipe(
                      catchError(e => value.confirm({
                        title: 'Error',
                        message: `An error occurred: ${extractErrorMessageFrom(e)}`,
                        justOk: true
                      }))
                    );
                  }
                } else if (recordDataType.id === dataType.id && kind === ActionKind.member) {
                  setState({ actionKey });
                } else {
                  onSubjectPicked(RecordSubject.for(recordDataType.id, id).key, actionKey);
                }
                return of(true);
              }
            }
          )
        ).subscribe(() => setState({
          selectedItems: [],
          loading: false,
          actionComponentKey: Random.string()
        }));
      }
    }
  });

  value.confirm = options => {
    confirmOptions.current = options || {};
    setState({ confirm: true });
    return confirmationSubject.current;
  };

  const closeDialog = ok => () => {
    confirmationSubject.current.next(ok);
    confirmationSubject.current.complete();
    confirmationSubject.current = new Subject();
    setState({ confirm: false });
  };

  let dialogContent;

  const alertContent = (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      pt: 2,
      '& svg': {
        fontSize: '5rem'
      }
    }}>
      <ErrorOutlineOutlinedIcon color="action" component="svg" />
    </Box>
  );

  if (confirm) {
    let { title, message, abortText, okText, justOk } = confirmOptions.current;
    title = title && (
      <>
        {alertContent}
        <DialogTitle>{title} </DialogTitle>
      </>
    );
    message = message && (
      <DialogContent>
        <DialogContentText component="p">
          {message}
        </DialogContentText>
      </DialogContent>
    );
    let abort;
    if (!justOk) {
      abort = (
        <Button variant="outlined" onClick={closeDialog(false)}>
          {abortText || 'Abort'}
        </Button>
      );
    }
    dialogContent = (
      <>
        {title}
        {message}
        <DialogActions>
          {abort}
          <Button variant="outlined" onClick={closeDialog(true)} color="primary" autoFocus>
            {okText || 'Ok'}
          </Button>
        </DialogActions>
      </>
    )
  }

  actionContext.current = { selectedItems, value, selector, tenantContext };

  return (
    <CC.Provider value={[{ ...state, handleAction: handleAction.current }, setState]}>
      {children}
      <Dialog open={Boolean(confirm)}
              onClose={closeDialog(false)}
              maxWidth="xs"
              fullWidth
              sx={{
                backdropFilter: 'blur(6px) saturate(120%)',
                '& .MuiBackdrop-root': {
                  backgroundColor: "rgba(0, 0, 0, 0.05)"
                },
                '& .MuiTypography-h6': {
                  textAlign: 'center'
                },
                '& p': {
                  textAlign: 'center'
                },
                '& .MuiDialogActions-root': {
                  justifyContent: 'center',
                  mb: '1rem'
                }
              }}>
        {dialogContent}
      </Dialog>
    </CC.Provider>
  );
}
