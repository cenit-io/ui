import React, { useEffect, useState } from 'react';
import { Config } from "../common/Symbols";
import AutocompleteControl from "./AutocompleteControl";
import * as Diff from 'diff';
import Collapsible from "./Collapsible";
import { makeStyles } from "@material-ui/core";

function toStr(value) {
    const type = typeof value;
    if (type === 'undefined' || type === 'object') {
        if (value) {
            return JSON.stringify(value, null, 2);
        }
        return '';
    }

    return String(value);
}

const useStyles = makeStyles(theme => ({
    changes: {
        listStyleType: 'none',
        padding: 0,
        border: `solid 1px ${theme.palette.text.disabled}`,
        '& li': {
            padding: theme.spacing(1, 0),
            '& span': {
                whiteSpace: 'pre-wrap',
                fontFamily: 'courier',
                display: 'inline-block',
                fontWeight: 400,
                fontSize: 14
            },
            '&:hover': {
                background: '#ffc',
            }
        }
    },
    added: {
        background: '#dfd',
        color: '#080;',
        '& span::before': {
            content: '" +"',
            paddingRight: theme.spacing(1)
        }
    },
    removed: {
        background: '#fee',
        color: '#b00',
        '& span::before': {
            content: '" -"',
            paddingRight: theme.spacing(1)
        }
    },
    unchanged: {
        background: theme.palette.background.paper,
        color: theme.palette.getContrastText(theme.palette.background.paper),
        '& span::before': {
            content: '"  "',
            paddingRight: theme.spacing(1)
        }
    }
}));

export default function ChangesSetControl({
                                              title,
                                              value,
                                              disabled,
                                              readOnly,
                                              error,
                                              onChange,
                                              property
                                          }) {
    const [diffs, setDiffs] = useState({});

    const classes = useStyles();

    useEffect(() => {
        const subscription = value.changed().subscribe(
            changesSet => {
                const diffs = {};
                Object.keys(changesSet || {}).forEach(field => {
                    diffs[field] = Diff.diffLines(
                        toStr(changesSet[field][0]),
                        toStr(changesSet[field][1]), {
                            newlineIsToken: true
                        }
                    );
                });
                setDiffs(diffs);
            }
        );

        value.changed().next(value.get());

        return () => subscription.unsubscribe();
    }, [value]);

    const fields = Object.keys(diffs).map(field => {
        const lines = [];
        diffs[field].forEach((part) => {
            const klass = (part.added && 'added') || (part.removed && 'removed') || 'unchanged';
            part.value.match(/[^\r\n]+/g).forEach(l => lines.push(
                <li className={classes[klass]}>
                    <span>
                    {l}
                    </span>
                </li>
            ));
        });
        return (
            <Collapsible title={field}
                         variant="subtitle1"
            >
                <ul className={classes.changes}>
                    {lines}
                </ul>
            </Collapsible>
        )
    });

    return (
        <>
            {fields}
        </>
    );
}
