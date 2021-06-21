import React, { useEffect, useRef } from 'react';
import Loading from "./Loading";
import EmbeddedAppService from "../services/EnbeddedAppService";
import { makeStyles } from "@material-ui/core";
import { useSpreadState } from "../common/hooks";
import Random from "../util/Random";
import { fromEvent, Subject } from "rxjs";
import { switchMap, map, filter } from "rxjs/operators";
import AuthorizationService from "../services/AuthorizationService";
import Alert from "../actions/Alert";

const useStyles = makeStyles(theme => ({
    iframe: {
        height: ({ height }) => `calc(${height} - ${theme.spacing(0.5)}px)`,
        width: ({ width }) => `calc(${width})`,
        border: 'none'
    }
}));

export default function EmbeddedApp({ subject, height, width }) {

    const [state, setState] = useSpreadState();

    const classes = useStyles({ height, width });

    const token = useRef(Random.string());

    const accessSubject = useRef(new Subject());

    const { app } = state;

    useEffect(() => {
        const subscription = accessSubject.current.pipe(
            switchMap(window => AuthorizationService.getAccess().pipe(
                map(access => ([window, access]))
            ))
        ).subscribe(
            ([window, access]) => window.postMessage({ access }, '*')
        );

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = EmbeddedAppService.getById(subject.id).subscribe(
            app => {
                if (app) {
                    subject.computeTitle(app);
                    setState({ app });
                } else {
                    setState({ app: false });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [subject]);

    useEffect(() => {
        const subscription = fromEvent(window, 'message').pipe(
            filter(({ data }) => data.token === token.current)
        ).subscribe(({ data, source: { window: appWindow } }) => {
            const { cmd } = data || {};
            switch (cmd) {
                case 'getAccess': {
                    accessSubject.current.next(appWindow);
                }
                    break;

                case 'reload': {
                    window.location.reload();
                }
                    break;

                default:
                // Nothing to do here
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (app === false) {
        return <Alert title="Not found" message="This app is not available"/>;
    }

    if (!app) {
        return <Loading/>;
    }

    return (
        <iframe className={classes.iframe} src={`${app.url}?token=${token.current}`}/>
    );
}
