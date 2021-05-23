import React, { useContext, useRef } from 'react';
import { Subject } from "rxjs";
import { useSpreadState } from "../common/hooks";
import DialogTitle from "@material-ui/core/DialogTitle/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

const CC = React.createContext({});


export function useContainerContext() {
    return useContext(CC);
}

export default function ContainerContext({ initialState, children }) {
    const value = useSpreadState(initialState);

    const [state, setState] = value;

    const { confirm } = state;

    const confirmationSubject = useRef(new Subject());
    const confirmOptions = useRef({});

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
    if (confirm) {
        let { title, message, abortText, okText, justOk } = confirmOptions.current;
        title = title && <DialogTitle>{title}</DialogTitle>;
        message = message && (
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
        );
        let abort;
        if (!justOk) {
            abort = (
                <Button onClick={closeDialog(false)}>
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
                    <Button onClick={closeDialog(true)} color="primary" autoFocus>
                        {okText || 'Ok'}
                    </Button>
                </DialogActions>
            </>
        )
    }

    return (
        <CC.Provider value={value}>
            {children}
            <Dialog open={Boolean(confirm)}
                    onClose={closeDialog(false)}
                    maxWidth="sm">
                {dialogContent}
            </Dialog>
        </CC.Provider>
    );
}
