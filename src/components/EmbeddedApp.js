import React, { useEffect, useRef } from 'react';
import { makeStyles } from "@material-ui/core";
import Random from "../util/Random";
import { fromEvent, Subject } from "rxjs";
import { switchMap, map, filter } from "rxjs/operators";
import AuthorizationService from "../services/AuthorizationService";
import { DataTypeSubject, RecordSubject, TabsSubject } from "../services/subjects";

const useStyles = makeStyles(theme => ({
    iframe: {
        height: ({ height }) => height
            ? `calc(${height} - ${theme.spacing(0.5)}px)`
            : 0,
        width: ({ width }) => width
            ? `calc(${width})`
            : 'inherit',
        border: 'none'
    }
}));

export default function EmbeddedApp({ url, height, width, autoHeight }) {

    const classes = useStyles({ height: autoHeight ? false : height, width });

    const token = useRef(Random.string());

    const accessSubject = useRef(new Subject());

    const iframe = useRef(null);

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

                case 'resize': {
                    if (autoHeight) {
                        if (data.height >= 0) {
                            iframe.current.style.height = `${data.height}px`;
                        }
                    }
                }
                    break;

                case 'openTab': {
                    let subject;
                    if (data.dataTypeId) {
                        if (data.recordId) {
                            subject = RecordSubject.for(data.dataTypeId, data.recordId);
                        } else {
                            subject = DataTypeSubject.for(data.dataTypeId);
                        }
                    }

                    if (subject) {
                        TabsSubject.next({
                            key: subject.key,
                            actionKey: data.actionKey
                        });
                    }
                }
                    break;

                default:
                // Nothing to do here
            }
        });

        return () => subscription.unsubscribe();
    }, [autoHeight]);

    return (
        <iframe ref={iframe}
                className={classes.iframe}
                src={`${url}?token=${token.current}`}/>
    );
}
