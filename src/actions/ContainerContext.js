import React, { useContext, useRef } from 'react';
import { isObservable, of, Subject } from "rxjs";
import { useSpreadState } from "../common/hooks";
import DialogTitle from "@material-ui/core/DialogTitle/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { makeStyles } from '@material-ui/core';
import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined'
import { catchError, switchMap } from "rxjs/operators";
import Random from "../util/Random";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { RecordSubject } from "../services/subjects";
import { useTenantContext } from "../layout/TenantContext";

const CC = React.createContext({});


export function useContainerContext() {
    return useContext(CC);
}

const useModalStyles = makeStyles(() => ({
    root: {
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
            marginBottom: '1rem'
        }
    }
}));


const useAlertContentStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        padding: theme.spacing(2, 0, 0, 0),
        '& svg': {
            fontSize: '5rem'
        }
    },
}));

export default function ContainerContext({ kind, initialState, children, homeActionKey }) {

    const actionSubscription = useRef(null);

    const tenantContext = useTenantContext();

    const value = useSpreadState(initialState);

    const [state, setState] = value;

    const { confirm } = state;

    const confirmationSubject = useRef(new Subject());
    const confirmOptions = useRef({});

    const modalClasses = useModalStyles();
    const alertContentClasses = useAlertContentStyles();

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
                                message: `An error occurred: ${e.message}`,
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
                                                message: `An error occurred: ${e.message}`,
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
        <div className={alertContentClasses.root}>
            <ErrorOutlineOutlinedIcon color="action" component="svg"/>
        </div>
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
                    classes={modalClasses}>
                {dialogContent}
            </Dialog>
        </CC.Provider>
    );
}
