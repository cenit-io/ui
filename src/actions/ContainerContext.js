import React, { useContext, useRef } from 'react';
import { Subject } from "rxjs";
import { useSpreadState } from "../common/hooks";
import DialogTitle from "@material-ui/core/DialogTitle/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { makeStyles } from '@material-ui/core';
import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined'

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

    const modalStyles = makeStyles((theme) => ({
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
        },
        alertContent: {
            display: 'flex',
            justifyContent: 'center',
            alertContent:'center',
            width: '100%',
            padding:' 16px 0 0 0',
            '& svg': {
                fontSize: '5rem'
            }
        },
    }));

    const classes = modalStyles();

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

    let alertContent = <div className={classes.alertContent} >
                            <ErrorOutlineOutlinedIcon color="action" />
                        </div>

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
                <DialogContentText>{message}</DialogContentText>
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
                    <Button variant="outlined"  onClick={closeDialog(true)} color="primary" autoFocus>
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
                maxWidth="xs"
                fullWidth
                classes={classes}>
                {dialogContent}
            </Dialog>
        </CC.Provider>
    );
}
