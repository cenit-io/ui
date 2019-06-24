import React from 'react';
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

class RefPicker extends React.Component {

    static getDerivedStateFromProps(props, state) {
        let text = props.text;
        if (text !== state.text) {
            return { text, key: Random.string() };
        }

        return null;
    }

    state = { query: null, key: Random.string() };

    ref = React.createRef();

    activate = activated => () => {
        if (activated && this.props.text !== null) {
            this.ref.current.value = '';
            this.setQuery('', { index: 0 });
        } else {
            this.setQuery(null, { key: Random.string(), itemsQuery: null, items: [] });
        }
    };

    handleChange = e => this.setQuery(e.target.value);

    setQuery = (query, additionalState = {}) => {
        const { dataType } = this.props;
        if (query !== null) {
            clearTimeout(this.interval);
            this.interval = setTimeout(
                () => {
                    this.setState({ loading: true });
                    dataType
                        .find(query, dataType.titleViewPort())
                        .then(({ items }) => {
                            if (items) {
                                dataType.titlesFor(...items).then(titles => {
                                    items = titles.map((title, index) => ({ record: items[index], title }));
                                    this.setState({ items, loading: false, itemsQuery: query });
                                })
                            } else {
                                this.setState({ items, loading: false, itemsQuery: query });
                            }
                        });
                }, 700);
        }
        this.setState({ ...additionalState, query });
    };

    pick = index => {
        const item = this.state.items[index];
        this.props.onPick(item);
        this.activate(false)();
    };

    handleKeyDown = (e) => {
        let handled = true;
        switch (e.keyCode) {
            case 13:
                this.pick(this.state.index);
                break;
            case 27:
                this.activate(false)();
                break;
            case 38:
                this.setState(prev => ({ index: Math.max(0, prev.index - 1) }));
                break;
            case 40:
                this.setState(prev => ({ index: Math.min(prev.items.length - 1, prev.index + 1) }));
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    handleClickAway = e => {
        if (this.ref.current !== e.target) {
            this.activate(false)();
        }
    };

    render() {

        const { query, items, key, loading, itemsQuery } = this.state,
            { label, text, disabled, inputClasses } = this.props;

        let list;
        if (query !== null && items) {
            if (items.length > 0) {
                list = items.map(
                    (item, index) => (
                        <ListItem key={item.record.id} button onClick={() => this.pick(index)}
                                  selected={index === this.state.index}>
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
                <ClickAwayListener onClickAway={this.handleClickAway}>
                    <Paper style={{ position: 'absolute', background: 'white', border: 'gray', zIndex: 1102 }}>
                        <List component="nav">
                            {list}
                        </List>
                    </Paper>
                </ClickAwayListener>
            );
        }

        const inputProps = {
            key: key,
            inputProps: { ref: this.ref },
            editable: String(query !== null),
            onFocus: () => setTimeout(this.activate(true), 500),
            onChange: this.handleChange,
            label: label,
            placeholder: label,
            defaultValue: query !== null ? query : (text || ''),
            onKeyDown: this.handleKeyDown,
            disabled: disabled
        };

        let input;
        if (inputClasses) {
            input = <InputBase {...inputProps} classes={inputClasses}/>;
        } else {
            input = <TextField {...inputProps}/>;
        }

        return (
            <div style={{ position: "relative" }}>
                {input}
                {(loading || text === null) && <LinearProgress/>}
                {list}
            </div>
        );
    }
}

export default RefPicker;