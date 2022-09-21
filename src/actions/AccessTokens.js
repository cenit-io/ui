import React, { useEffect, useRef } from 'react';
import AccessTokensIcon from '@material-ui/icons/VpnKey';
import { useSpreadState } from "../common/hooks";
import LinearProgress from "@material-ui/core/LinearProgress";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import API from "../services/ApiService";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import { makeStyles } from "@material-ui/core";
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
import { catchError, switchMap, map, tap } from "rxjs/operators";
import Random from "../util/Random";
import Button from "@material-ui/core/Button";
import zzip from "../util/zzip";
import { getAccessToken } from "../services/AuthorizationService";
import clsx from "clsx";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import { Config } from "../common/Symbols";
import { SuccessAlertWith } from "./SuccessAlert";

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
  note: {
    minWidth: theme.spacing(20),
    width: '80%'
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

const AccessTokens = ({ dataType, record, height, width, docked }) => {
  const [state, setState] = useSpreadState();

  const containerContext = useContainerContext();

  const setContainerState = containerContext[1];

  const tokenFormDataType = useRef(DataType.from({
    name: 'Access Token',
    schema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
        },
        expires_in: {
          type: 'string',
          enum: [
            1, 24, 24 * 7, 24 * 30, 24 * 90, -1, 0
          ].map(s => s.toString()),
          enumNames: [
            '1 hour', '1 day', '7 days', '30 days', '90 days', 'Custom', 'No expiration'
          ]
        },
        expires_at: {
          type: 'string',
          format: 'date-time'
        }
      }
    },
    [Config]: {
      actions: {
        new: {
          seed: {
            expires_in: '1'
          }
        }
      },
      fields: {
        expires_in: {
          controlProps: {
            deleteDisabled: true
          }
        },
        expires_at: {
          controlProps: {
            deleteDisabled: true,
            minDate: new Date()
          }
        }
      },
      dynamicConfig: ({ expires_in }, state) => {
        if (state.expiration !== expires_in) {
          return {
            expiration: expires_in,
            expires_at: {
              hidden: !+expires_in
            }
          }
        }
      },
      orchestrator: ({ expires_in, expires_at }, state, value) => {
        if (state.expiration !== expires_in) {
          state.expiration = expires_in;
          let expiration_date = state.expiration_date = expires_at;
          if (expires_in !== '-1') {
            if (+expires_in > 0) {
              expiration_date = new Date(new Date().getTime() + 3600000 * +expires_in).toISOString();
            }
            state.expiration_date = expiration_date;
            value.propertyValue('expires_at').set(expiration_date, true);
          }
        } else if (state.expiration_date !== expires_at) {
          state.expiration_date = expires_at;
          state.expiration = '-1';
          value.propertyValue('expires_in').set(state.expiration, true);
        }
      }
    }
  }));

  const classes = useStyles({ height, width });

  const { current_token, tokens, tokenForm } = state;

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Tokens" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  useEffect(() => {
    const subscription = zzip(
      getAccessToken(),
      API.get('cenit', 'oauth_access_grant', record.id, 'digest', 'tokens')
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
    return <LinearProgress className="full-width" />;
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

  const newToken = (_, value) => {
    let { note, expires_in, expires_at } = value.get();
    expires_in = +expires_in;
    const token_span = expires_in
      ? (expires_in === -1
        ? (Date.parse(expires_at) - new Date().getTime()) / 1000
        : 3600 * expires_in)
      : 0;
    return API.post(
      'cenit', 'oauth_access_grant', record.id, 'digest', 'token', {
        token_span,// Token span in seconds, null is default 3600, if 0 then never expires
        note
      }
    ).pipe(
      tap(() => setTimeout(
        () => setContainerState({ actionComponentKey: Random.string() }), 2500
      ))
    );
  };

  const now = new Date();

  const tokensRows = tokens.map(({ id, note, token, expires_at }) => (
    <StyledTableRow key={id}
                    tabIndex={-1}
                    className={clsx(
                      current_token === token && classes.current,
                      expires_at && expires_at < now && classes.expired
                    )}>
      <TableCell className={classes.note}>
        {note || '<no note>'}
      </TableCell>
      <TableCell>
        <ExpirationDateTimeViewer value={expires_at} emptyMessage="Never expires" />
      </TableCell>
      <TableCell className={classes.tokenActions}>
        <div>
          <IconButton onClick={() => copy(token)}>
            <CopyIcon />
          </IconButton>
          {
            current_token !== token && (
              <IconButton onClick={deleteToken(id)}>
                <DeleteIcon />
              </IconButton>
            )
          }
        </div>
      </TableCell>
    </StyledTableRow>
  ));

  const showTokenForm = tokenForm => () => setState({ tokenForm });

  if (tokenForm) {
    return (
      <div className="relative">
        <FormEditor docked={docked}
                    dataType={tokenFormDataType.current}
                    height={height}
                    submitIcon={<AccessTokensIcon component="svg" />}
                    onFormSubmit={newToken}
                    successControl={SuccessAlertWith({
                      mainIcon: AccessTokensIcon,
                      message: 'Successfully created'
                    })}
                    noJSON={true}
        />
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h6">
          <Chip label={tokens.length || 'none'} /> Access Tokens
        </Typography>
        <div className="grow-1" />
        <Button variant="outlined"
                color="primary"
                endIcon={<AccessTokensIcon />}
                onClick={showTokenForm(true)}>
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
