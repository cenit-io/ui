import React, { useContext } from 'react';
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

    const { confirmationSubject, confirmOptions } = state;

    value.confirm = confirmOptions => {
        const confirmationSubject = new Subject();
        setState({
            confirmationSubject,
            confirmOptions: confirmOptions || {}
        });
        return confirmationSubject;
    };

    const closeDialog = ok => () => {
        confirmationSubject?.next(ok);
        confirmationSubject.complete();
        setState({
            confirmationSubject: null,
            confirmOptions: null
        });
    };

    let dialogContent;
    if (confirmationSubject) {
        let { title, message, cancelText, okText } = confirmOptions;
        title = title && <DialogTitle>{title}</DialogTitle>;
        message = message && (
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
        );
        dialogContent = (
            <>
                {title}
                {message}
                <DialogActions>
                    <Button onClick={closeDialog(false)}>
                        {cancelText || 'Cancel'}
                    </Button>
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
            <Dialog open={Boolean(confirmationSubject)}
                    onClose={closeDialog(false)}
                    maxWidth="sm">
                {dialogContent}
            </Dialog>
        </CC.Provider>
    );
}
