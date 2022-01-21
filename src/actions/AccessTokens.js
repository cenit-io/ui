import React, { useEffect, useState } from 'react';
import AccessTokensIcon from '@material-ui/icons/VpnKey';
import { useSpreadState } from "../common/hooks";
import LinearProgress from "@material-ui/core/LinearProgress";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import API from "../services/ApiService";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import { Box, FormControl, makeStyles, MenuItem, TextField } from "@material-ui/core";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import withStyles from "@material-ui/core/styles/withStyles";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import CopyIcon from "@material-ui/icons/ContentCopy";
import ExpirationDateTimeViewer from "../viewers/ExpirationDateTimeViewer";
import copy from 'copy-to-clipboard/index';
import { of } from "rxjs";
import { useContainerContext } from "./ContainerContext";
import { catchError, switchMap, map } from "rxjs/operators";
import Random from "../util/Random";
import Button from "@material-ui/core/Button";
import zzip from "../util/zzip";
import AuthorizationService from "../services/AuthorizationService";
import clsx from "clsx";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import { DateTimePicker } from '@material-ui/pickers';

const HeaderHeight = 8;

const useStyles = makeStyles(theme => ({
    root: {},
    header: {
        padding: theme.spacing(1, 1),
        boxShadow: '0 4px 8px 0 rgba(55, 71, 79, .3)',
        height: theme.spacing(HeaderHeight),
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center'
    },
    tokens: {
        height: ({ height }) => `calc(${height} - ${theme.spacing(HeaderHeight)}px)`,
        width: ({ width }) => `calc(${width})`
    },
    token: {
        padding: theme.spacing(2),
        '& + &': {
            borderTop: `solid 1px ${theme.palette.background.default}`
        }
    },
    tokenActions: {
        position: 'sticky',
        right: 0,
        '& div': {
            display: 'flex',
            justifyContent: 'flex-end'
        }
    },
    current: {
        '& td': {
            color: theme.palette.success.main,
            fontWeight: 600
        }
    },
    expired: {
        '& td': {
            color: theme.palette.error.main
        }
    }
}));

const StyledTableRow = withStyles((theme) => ({
    root: {
        '& td:last-child button': {
            visibility: 'hidden'
        },
        '&:hover td:last-child': {
            background: theme.palette.background.paper,
            '& button': {
                visibility: 'visible'
            }
        },
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
            '&:hover td:last-child': {
                background: theme.palette.background.default
            }
        }
    }
}))(TableRow);

const dialogStyles = makeStyles((theme) => ({
  root: {
    backdropFilter: "blur(6px) saturate(120%)",
    "& .MuiBackdrop-root": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    "& .MuiTypography-h6": {
      textAlign: "center",
    },
    "& p": {
      textAlign: "center",
    },
    "& .MuiDialogActions-root": {
      justifyContent: "center",
      marginBottom: "1rem",
    },
    "& .MuiDialogContent-root": {
        [theme.breakpoints.down('sm')]: {
            width: 'initial'
        },
    }
  },
  box: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    minWidth: 2,
    [theme.breakpoints.up('sm')]: {
        minWidth: '80%',
    },
  },
  select: {
    m: 1,
    minWidth: "70% ",
    [theme.breakpoints.up('sm')]: {
        minWidth: '80%',
    },
  },
  expirationText: {
    color: theme.palette.text.secondary,
  },
  expirationTextWrapper:{
      width:'100%'
  },
  picker:{
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const CustomValueDatePicker = ({ value, onChange }) => {
  return (
    <DateTimePicker
      inputVariant="filled"
      renderInput={(params) => <TextField {...params} />}
      label="Pick a date"
      value={value}
      onChange={onChange}
      minDate={Date.now()}
    />
  );
};

const NewTokenDialog = ({ handleClose, createToken, open }) => {
  const [span, setSpan] = useState(1);
  const [tokenSpan, setTokenSpan] = useState(0);
  const [tokenNote, setTokenNote] = useState("My note");
  const [expireTime, setExpireTime] = useState("");
  const [openPiker, setOpenPiker] = useState(false);
  const [customValue, setCustomValue] = useState(Date.now());
  const [customExpireTimeMsg, setCustomExpireTimeMsg] = useState("");

  const classes = dialogStyles();

  const setInitialTime = () => {
    setTokenSpan(1);
    setSpan(1);
    setOpenPiker(false);
    setTokenNote("My note");
    setTokenSpan(null);
  };

  const handleChange = (event) => {
    //One day = 86400 seg
    let value = Number(event.target.value),
      span;
    setSpan(value);

    if (value === 2) {
      setOpenPiker(true);
      setCustomValue(Date.now());
      setCustomExpireTimeMsg(customTranslateTime());
      setExpireTime(translateCustomTime());
    } else {
      span = value === 1 ? null : value * 86400;
      setTokenSpan(span);
      setExpireTime(translateTime(span));
    }
  };

  const handleChangeDatePicker = (value) => {
    setCustomValue(value);
    setTokenSpan(calculateCustomExpireTime(value));
    setExpireTime(translateCustomTime(value));
    setCustomExpireTimeMsg(translateCustomTime(value));
  };

  const translateTime = (time) => {
    let milliseconds = (time ? time : 3600) * 1000,
      dateTimestamp = Date.now() + milliseconds,
      date = new Date(dateTimestamp),
      transformedTimeText = date.toDateString();

    return transformedTimeText;
  };

  const calculateCustomExpireTime = (value) =>
    (Date.now() - value.getTime()) / 1000;

  const translateCustomTime = (custom) => {
    let dateTimestamp = custom ? custom.getTime() : Date.now(),
      date = new Date(dateTimestamp),
      transformedTimeText = date.toDateString();

    return transformedTimeText;
  };

  const customTranslateTime = () => {
    if (customValue) {
      let date = new Date(Date.now()),
        transformedTimeText = date.toDateString();
      return transformedTimeText;
    }
  };

  const expirationTextMsg = () => {
    let msg = "";

    switch (span) {
      case 0:
        msg = `The token will not expire`;
        break;
      case 2:
        msg = `The token will expire on ${customExpireTimeMsg}`;
        break;

      default:
        msg = `The token will expire on ${expireTime}`;
    }

    return msg;
  };

  const handleOk = () => {
    handleClose();
    createToken({ token_span: tokenSpan, note: tokenNote });
  };

  const handleInput = (e) => setTokenNote(e.target.value);

  useEffect(() => {
    open && setInitialTime();
  }, [open]);

  useEffect(() => {
    setExpireTime(translateTime(tokenSpan));
  }, [tokenSpan]);

  return (
    <div>
      <Dialog
        disableEscapeKeyDown
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        className={classes.root}
      >
        <DialogTitle>Create new token</DialogTitle>
        <DialogContent>
          <Box component="form" className={classes.box}>
            {openPiker ? (
              <div className={classes.picker}>
                <CustomValueDatePicker
                  value={customValue}
                  onChange={handleChangeDatePicker}
                />
                <IconButton onClick={setInitialTime}>
                  <DeleteIcon />
                </IconButton>
              </div>
            ) : (
              <FormControl variant="filled" className={classes.select}>
                <InputLabel id="select-span-input-label">Expiration</InputLabel>
                <Select
                  labelId="select-span-input-label"
                  value={span}
                  onChange={handleChange}
                >
                  <MenuItem value={1}> 1 hour </MenuItem>
                  <MenuItem value={7}> 7 days </MenuItem>
                  <MenuItem value={30}> 30 days </MenuItem>
                  <MenuItem value={60}> 60 days </MenuItem>
                  <MenuItem value={90}> 90 days </MenuItem>
                  <MenuItem value={2}> Custom </MenuItem>
                  <MenuItem value={0}> Never expires </MenuItem>
                </Select>
              </FormControl>
            )}
            <div className={classes.expirationTextWrapper}>
              <p className={classes.expirationText}> {expirationTextMsg()} </p>
            </div>
            <FormControl variant="filled" className={classes.select}>
              <TextField
                id="token-note"
                label="Add Note"
                defaultValue={tokenNote}
                variant="filled"
                onInput={handleInput}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={handleOk}
            color="primary"
            autoFocus
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const AccessTokens = ({ dataType, record, height, width }) => {
    const [state, setState] = useSpreadState();

    const containerContext = useContainerContext();

    const setContainerState = containerContext[1];

    const classes = useStyles({ height, width });

    const { current_token, tokens, addToken } = state;

    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Tokens" });

        return () => {
            setContainerState({ breadcrumbActionName: null });
        };
    }, []);

    useEffect(() => {
        const subscription = zzip(
            AuthorizationService.getAccessToken(),
            API.get(
                'cenit', 'oauth_access_grant', record.id, 'digest', 'tokens'
            )
        ).subscribe(
            ([current_token, tokens]) => {
                tokens.forEach(token => token.expires_at = token.expires_at && Date.parse(token.expires_at));
                tokens.sort((a, b) => {
                    if (b.expires_at) {
                        if (a.expires_at) {
                            return b.expires_at - a.expires_at;
                        }

                        return -1;
                    }

                    return 0;
                });
                setState({ current_token, tokens });
            }
        );

        return () => subscription.unsubscribe();
    }, [dataType, record]);

    if (!tokens) {
        return <LinearProgress className="full-width"/>;
    }

    const deleteToken = tokenId => () => {
        const token = tokens.find(({ id }) => id === tokenId);
        if (token) {
            (
                (token.expires_at && token.expires_at < new Date())
                    ? of(true)
                    : containerContext.confirm({
                        title: `DELETE confirmation`,
                        message: 'The token is still alive and it will be destroyed!'
                    })
            ).pipe(
                switchMap(ok => {
                    if (ok) {
                        return API.delete(
                            'cenit', 'oauth_access_grant', record.id, 'digest', 'token', token
                        ).pipe(
                            map(() => true),
                            catchError(() => of(false))
                        );
                    }

                    return of(false);
                })
            ).subscribe(
                done => done && setContainerState({ actionComponentKey: Random.string() })
            ); // TODO Unsubscribe subscription
        }
    };

    const newToken = ({ token_span, note }) => {
        setContainerState({ loading: true });
        API.post(
            'cenit', 'oauth_access_grant', record.id, 'digest', 'token', {
            token_span,// Token span in seconds, null is default 3600, if 0 then never expires
            note
        }
        ).subscribe(
            () => setContainerState({
                loading: false,
                actionComponentKey: Random.string()
            })
        );
    };

    const handleOpenDialog = () => setState({ ...state, addToken: true });

    const handleCloseDialog = (event, reason) => {
        if (reason !== "backdropClick") {
            setState({ ...state, addToken: false });
        }
    };

    const now = new Date();

    const tokensRows = tokens.map(({ id, token, expires_at }) => (
        <StyledTableRow key={id}
                        tabIndex={-1}
                        className={clsx(
                            current_token === token && classes.current,
                            expires_at && expires_at < now && classes.expired
                        )}>
            <TableCell>
                {token}
            </TableCell>
            <TableCell>
                <ExpirationDateTimeViewer value={expires_at} emptyMessage="Never expires"/>
            </TableCell>
            <TableCell className={classes.tokenActions}>
                <div>
                    <IconButton onClick={() => copy(token)}>
                        <CopyIcon/>
                    </IconButton>
                    {
                        current_token !== token && (
                            <IconButton onClick={deleteToken(id)}>
                                <DeleteIcon/>
                            </IconButton>
                        )
                    }
                </div>
            </TableCell>
        </StyledTableRow>
    ));

    return (
        <div className={classes.root}>
            <div className={classes.header}>
                <Typography variant="h6">
                    <Chip label={tokens.length || 'none'}/> Access Tokens
                </Typography>
                <div className="grow-1"/>
                <Button variant="outlined"
                        color="primary"
                    endIcon={<AccessTokensIcon />}
                    onClick={handleOpenDialog}
                >
                    Create
                </Button>
            </div>
            <TableContainer component={Paper} className={classes.tokens}>
                <Table>
                    <TableBody>
                        {tokensRows}
                    </TableBody>
                </Table>
            </TableContainer>
            <NewTokenDialog open={addToken} handleClose={handleCloseDialog} createToken={newToken} />
        </div>
    );
};

export default ActionRegistry.register(AccessTokens, {
    kind: ActionKind.member,
    icon: AccessTokensIcon,
    title: 'Tokens',
    arity: 1,
    onlyFor: [
        { namespace: 'Cenit', name: 'OauthAccessGrant' }
    ]
});
