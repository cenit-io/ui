import React, { useEffect } from 'react';
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
import { catchError, switchMap, map } from "rxjs/operators";
import Random from "../util/Random";
import Button from "@material-ui/core/Button";
import zzip from "../util/zzip";
import AuthorizationService from "../services/AuthorizationService";
import clsx from "clsx";

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

const AccessTokens = ({ dataType, record, height, width }) => {
    const [state, setState] = useSpreadState();

    const containerContext = useContainerContext();

    const setContainerState = containerContext[1];

    const classes = useStyles({ height, width });

    const { current_token, tokens } = state;

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
                tokens.forEach(token => token.expires_at = Date.parse(token.expires_at));
                tokens.sort((a, b) => b.expires_at - a.expires_at);
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
                token.expires_at < new Date()
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

    const newToken = () => {
        setContainerState({ loading: true });
        API.get(
            'cenit', 'oauth_access_grant', record.id, 'digest', 'token'
        ).subscribe(
            () => setContainerState({
                loading: false,
                actionComponentKey: Random.string()
            })
        );
    };

    const now = new Date();

    const tokensRows = tokens.map(({ id, token, expires_at }) => (
        <StyledTableRow key={id}
                        tabIndex={-1}
                        className={clsx(
                            current_token === token && classes.current,
                            expires_at < now && classes.expired
                        )}>
            <TableCell>
                {token}
            </TableCell>
            <TableCell>
                <ExpirationDateTimeViewer value={expires_at}/>
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
                        endIcon={<AccessTokensIcon/>}
                        onClick={newToken}>
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
