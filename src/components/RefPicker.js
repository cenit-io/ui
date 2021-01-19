import React, { useRef, useEffect } from 'react';
import {
    ClickAwayListener,
    InputBase,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField
} from "@material-ui/core";
import Random from "../util/Random";
import '../common/FlexBox.css';
import { switchMap, delay } from "rxjs/operators";
import { of, zip } from "rxjs";
import Pagination from "@material-ui/lab/Pagination";
import Skeleton from "@material-ui/lab/Skeleton";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { useSpreadState } from "../common/hooks";

const useStyles = makeStyles(theme => ({
    list: {
        minWidth: theme.spacing(20),
        position: 'absolute',
        top: theme.spacing(6),
        background: 'white',
        border: 'gray',
        zIndex: 5
    },
    pagination: {
        padding: theme.spacing(1),
        background: theme.palette.background.default
    },
    left: {
        left: 0
    },
    right: {
        right: 0
    }
}));

function RefPicker({
                       text, label, disabled, inputClasses, readOnly, placeholder, dataType,
                       onPick, anchor, baseSelector, additionalViewportProps
                   }) {

    const [state, setState] = useSpreadState({
        query: null,
        page: 1,
        total_pages: 0,
        queryOpts: {},
        key: Random.string()
    });

    const ref = useRef(null);

    const classes = useStyles();

    const stateText = state.text;

    const { query, items, key, loading, itemsQuery, index, page, total_pages } = state;

    useEffect(() => {
        if (text !== state.text) {
            setState({ text, key: Random.string() });
        }
    }, [text, stateText]);

    useEffect(() => setState({ page: 1 }), [query]);

    useEffect(() => {
        if (query !== null) {
            setState({ loading: true });
            const subscription = dataType.titleViewPort(...(additionalViewportProps || [])).pipe(
                delay(700),
                switchMap(viewport => dataType.find(query, {
                    viewport, page, selector: baseSelector
                })),
                switchMap(
                    ({ items, total_pages }) => {
                        if (items) {
                            setState({ total_pages });
                            return zip(of(items), dataType.titlesFor(...items));
                        } else {
                            setState({ items, loading: false, itemsQuery: query, total_pages: 0 });
                            return of([null, null]);
                        }
                    }
                )
            ).subscribe(([items, titles]) => {
                    if (items && titles) {
                        items = titles.map((title, itemIndex) => ({
                            record: items[itemIndex],
                            title
                        }));
                        setState({ items, loading: false, itemsQuery: query });
                    }
                }
            );

            return () => subscription.unsubscribe();
        }
    }, [dataType, query, page]);

    const activate = activated => () => {
        if (activated && text !== null) {
            ref.current.value = '';
            setState({ query: '', index: 0 });
        } else {
            setState({ query: null, key: Random.string(), itemsQuery: null, items: [], total_pages: 1 });
        }
    };

    const handleChange = e => setState({ query: e.target.value });

    const pick = itemIndex => {
        const item = items[itemIndex];
        onPick(item);
        activate(false)();
    };

    const handleKeyDown = (e) => {
        let handled = true;
        switch (e.keyCode) {
            case 13:
                pick(index);
                break;
            case 27:
                activate(false)();
                break;
            case 38:
                setState(prev => ({ index: Math.max(0, prev.index - 1) }));
                break;
            case 40:
                setState(prev => ({ index: Math.min(prev.items.length - 1, prev.index + 1) }));
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleClickAway = e => {
        if (ref.current !== e.target) {
            activate(false)();
        }
    };

    const handleFocus = () => !readOnly && setTimeout(activate(true), 500);

    const handlePageChange = (_, page) => setState({ page });

    let list;
    if (query !== null && items) {
        if (items.length > 0) {
            const skeleton = (loading && <Skeleton variant="text"/>) || null;
            list = items.map(
                (item, itemIndex) => (
                    <ListItem key={item.record.id} button onClick={() => pick(itemIndex)}
                              selected={itemIndex === index}>
                        <ListItemText primary={(!loading && item.title) || null}>
                            {skeleton}
                        </ListItemText>
                    </ListItem>
                )
            );
        } else if (itemsQuery && !loading) {
            list = (
                <ListItem>
                    <ListItemText primary={`No results for '${itemsQuery}'`}/>
                </ListItem>
            );
        }
        let pagination;
        if (total_pages > 1) {
            pagination = (
                <div className={clsx('flex justify-content-center', classes.pagination)}>
                    <Pagination count={total_pages}
                                page={page}
                                disabled={loading}
                                onChange={handlePageChange}
                                size="small"
                                color="primary"/>
                </div>
            );
        }
        list = (
            <ClickAwayListener onClickAway={handleClickAway}>
                <Paper className={clsx(classes.list, classes[anchor] || classes.left)}>
                    <List component="nav">
                        {list}
                    </List>
                    {pagination}
                </Paper>
            </ClickAwayListener>
        );
    }

    const inputProps = {
        key: key,
        inputProps: { ref, readOnly: Boolean(readOnly) },
        editable: String(query !== null),
        onFocus: handleFocus,
        onChange: handleChange,
        label: label,
        placeholder: placeholder || label,
        defaultValue: query !== null ? query : (text || ''),
        onKeyDown: handleKeyDown,
        disabled: disabled
    };

    let input;
    if (inputClasses) {
        input = <InputBase {...inputProps} classes={inputClasses} style={{ flexGrow: 1 }}/>;
    } else {
        input = <TextField {...inputProps} style={{ flexGrow: 1 }}/>;
    }

    return (
        <div className={clsx('flex relative grow-1 column')}>
            {input}
            {(loading || text === null) && <LinearProgress/>}
            {list}
        </div>
    );
}

export default RefPicker;
