import React, { useReducer, useRef, useEffect } from 'react';
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
import reducer from "../common/reducer";
import { switchMap, delay } from "rxjs/operators";
import { of } from "rxjs";

function RefPicker({ text, label, disabled, inputClasses, readOnly, placeholder, dataType, onPick }) {

    const [state, setState] = useReducer(reducer, {
        query: null,
        key: Random.string()
    });

    const ref = useRef(null);

    const stateText = state.text;

    const { query, items, key, loading, itemsQuery, index } = state;

    useEffect(() => {
        if (text !== state.text) {
            setState({ text, key: Random.string() });
        }
    }, [text, stateText]);

    useEffect(() => {
        if (query !== null) {
            setState({ loading: true });
            const subscription = of(true).pipe(
                delay(700),
                switchMap(() => dataType.find(query, dataType.titleViewPort()))
            ).subscribe(
                ({ items }) => {
                    if (items) {
                        dataType.titlesFor(...items).subscribe(
                            titles => {
                                items = titles.map((title, itemIndex) => ({
                                    record: items[itemIndex],
                                    title
                                }));
                                setState({ items, loading: false, itemsQuery: query });
                            })
                    } else {
                        setState({ items, loading: false, itemsQuery: query });
                    }
                });

            return () => subscription.unsubscribe();
        }
    }, [query]);

    const activate = activated => () => {
        if (activated && text !== null) {
            ref.current.value = '';
            setState({ query: '', index: 0 });
        } else {
            setState({ query: null, key: Random.string(), itemsQuery: null, items: [] });
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

    let list;
    if (query !== null && items) {
        if (items.length > 0) {
            list = items.map(
                (item, itemIndex) => (
                    <ListItem key={item.record.id} button onClick={() => pick(itemIndex)}
                              selected={itemIndex === index}>
                        <ListItemText primary={item.title}/>
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
        list = (
            <ClickAwayListener onClickAway={handleClickAway}>
                <Paper style={{
                    position: 'absolute',
                    top: `${48}px`,
                    background: 'white',
                    border: 'gray',
                    zIndex: 2
                }}>
                    <List component="nav">
                        {list}
                    </List>
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
        <div className='flex relative grow-1 column'>
            {input}
            {(loading || text === null) && <LinearProgress/>}
            {list}
        </div>
    );
}

export default RefPicker;
