import React, { useEffect, useRef } from 'react';
import AccessTokensIcon from '@mui/icons-material/VpnKey';
import { useSpreadState } from "../common/hooks";
import LinearProgress from "@mui/material/LinearProgress";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import API from "../services/ApiService";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
// import CopyIcon from "@mui/icons-material/ContentCopy";
import CopyIcon from '@mui/icons-material/FileCopyOutlined';
import ExpirationDateTimeViewer from "../viewers/ExpirationDateTimeViewer";
import copy from 'copy-to-clipboard';
import { of } from "rxjs";
import { useContainerContext } from "./ContainerContext";
import { catchError, switchMap, map, tap, take } from "rxjs/operators";
import Random from "../util/Random";
import Button from "@mui/material/Button";
import zzip from "../util/zzip";
import { getAccessToken } from "../services/AuthorizationService";
import Box from "@mui/material/Box";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import { Config } from "../common/Symbols";
import { SuccessAlertWith } from "./SuccessAlert";
import useSubscriptionBag from "../common/rx/useSubscriptionBag";
import { styled } from "@mui/material/styles";

const HeaderHeight = 8;

const StyledTableRow = styled(TableRow)(({ theme }) => ({
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
}));

const tableRowToneSx = {
  current: {
    '& td': {
      color: 'success.main',
      fontWeight: 600
    }
  },
  expired: {
    '& td': {
      color: 'error.main'
    }
  }
};

const AccessTokens = ({ dataType, record, height, width, docked }) => {
  const [state, setState] = useSpreadState();
  const subscriptionBag = useSubscriptionBag();

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
      const key = `AccessTokens.delete.${tokenId}`;
      subscriptionBag.add(
        key,
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
      ).pipe(
        take(1)
      ).subscribe(
        done => {
          subscriptionBag.remove(key);
          done && setContainerState({ actionComponentKey: Random.string() });
        },
        () => subscriptionBag.remove(key)
      )
      );
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
                    sx={{
                      ...(current_token === token ? tableRowToneSx.current : {}),
                      ...(expires_at && expires_at < now ? tableRowToneSx.expired : {})
                    }}>
      <TableCell sx={{ minWidth: theme => theme.spacing(20), width: '80%' }}>
        {note || '<no note>'}
      </TableCell>
      <TableCell>
        <ExpirationDateTimeViewer value={expires_at} emptyMessage="Never expires" />
      </TableCell>
      <TableCell sx={{
        position: 'sticky',
        right: 0,
        '& div': {
          display: 'flex',
          justifyContent: 'flex-end'
        }
      }}>
        <div>
          <IconButton onClick={() => copy(token)} size="large">
            <CopyIcon />
          </IconButton>
          {
            current_token !== token && (
              <IconButton onClick={deleteToken(id)} size="large">
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
    <div>
      <Box
           className="flex align-items-center"
           sx={{
             p: 1,
             boxShadow: '0 4px 8px 0 rgba(55, 71, 79, .3)',
             height: theme => theme.spacing(HeaderHeight),
             boxSizing: 'border-box'
           }}>
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
      </Box>
      <TableContainer component={Paper} sx={{
        height: theme => `calc(${height} - ${theme.spacing(HeaderHeight)})`,
        width: `calc(${width})`
      }}>
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
