import React, { useEffect, useReducer, useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles/index';
import AppBar from '@material-ui/core/AppBar/index';
import Tabs from '@material-ui/core/Tabs/index';
import Tab from '@material-ui/core/Tab/index';
import Button from '@material-ui/core/Button/index';
import IconButton from '@material-ui/core/IconButton/index';
import CloseIcon from '@material-ui/icons/Clear';
import SwipeableViews from "react-swipeable-views";
import { appBarHeight } from "./AppBar";
import MemberContainer from "../actions/MemberContainer";
import CollectionContainer from "../actions/CollectionContainer";
import { DataTypeId, TabIndex, TabKey, TitleSubject } from "../common/Symbols";
import { Subject } from "rxjs";

export const tabsHeight = theme => `${theme.spacing(4) + 4}px`;

function ItemTab({ item, onClick, onClose }) {

    const [title, setTitle] = useState('...');
    const titleSubject = item[TitleSubject];

    useEffect(() => {
        const subscription = titleSubject.subscribe(title => setTitle(title));
        return () => subscription.unsubscribe();
    }, [titleSubject]);

    return (
        <Tab component={ClosableComponent}
             label={title}
             onClick={onClick}
             onClose={onClose}/>
    );
}

class ClosableComponent extends React.Component {

    state = {};

    setOver = over => () => this.setState({ over });

    render() {
        const { onClick, children, onClose } = this.props,

            { over } = this.state;

        return <div onMouseEnter={this.setOver(true)} onMouseLeave={this.setOver(false)}>
            <Button onClick={onClick}>{children}</Button>

            <IconButton aria-label="Close" size="small"
                        style={{ visibility: over ? 'visible' : 'hidden' }}
                        onClick={onClose}>
                <CloseIcon fontSize="inherit"/>
            </IconButton>
        </div>;
    }
}

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        position: 'relative'
    },
}));

function reducer(state, action) {
    switch (action.type) {

        case 'selectItem': {
            const { item, updateConfig } = action;
            let { items } = state;

            const itemKey = `${item[DataTypeId]}_${item.id}`;
            const values = Object.values(items);

            let index = values.length;

            const existingItem = values.find(value => value[TabKey] === itemKey);

            if (existingItem) {
                index = existingItem[TabIndex];
            } else {
                index = values.length;
                item[TabIndex] = index;
                item[TabKey] = itemKey;
                items = { ...items, [item[TabKey]]: item };
            }

            updateConfig({
                tabs: {
                    index,
                    items: Object.values(items).sort(
                        (a, b) => a[TabIndex] - b[TabIndex]
                    ).map(
                        item => ({ DataTypeId: item[DataTypeId], id: item.id })
                    )
                }
            });

            return { index, items };
        }

        case 'buildItems': {
            const { config } = action;
            let { items } = state;

            let newItems = {};
            let index = 0;

            if (config) {
                const tabs = config.tabs || {};
                index = tabs.index || 0;
                const tabItems = tabs.items || [];
                tabItems.forEach(
                    (item, index) => {
                        const id = `${item.DataTypeId}_${item.id}`;
                        if (items.hasOwnProperty(id)) {
                            newItems[id] = items[id];
                        } else {
                            newItems[id] = {
                                id: item.id,
                                [DataTypeId]: item.DataTypeId
                            }
                        }
                        newItems[id][TabIndex] = index;
                        newItems[id][TabKey] = id;
                    }
                );
            }

            items = newItems;

            return { index, items };
        }

        case 'closeItem': {
            const { key, updateConfig } = action;
            let { index, items } = state;

            const removedItem = items[key];
            if (removedItem) {
                delete items[key];
                const values = Object.values(items);
                values.forEach(value => {
                    if (value[TabIndex] > removedItem[TabIndex]) {
                        value[TabIndex]--;
                    }
                });
                if (index === values.length) {
                    index--;
                }

                updateConfig({
                    tabs: {
                        index,
                        items: Object.values(items).sort(
                            (a, b) => a[TabIndex] - b[TabIndex]
                        ).map(
                            item => ({ DataTypeId: item[DataTypeId], id: item.id })
                        )
                    }
                });
            }

            return { index, items };
        }
        case 'selectIndex':
            return { ...state, index: action.index };

        default:
            throw new Error(`Action not supported: ${JSON.stringify(action)}`);
    }
}

export default function NavTabs({ docked, config, updateConfig, width, tabItemSubject }) {
    const classes = useStyles();
    const theme = useTheme();
    const [state, dispatch] = useReducer(reducer, { index: 0, items: {} });

    const { items, index } = state;

    useEffect(() => {
        const subscription = tabItemSubject.subscribe(
            item => dispatch({ type: 'selectItem', item, updateConfig })
        );
        return () => subscription.unsubscribe();
    }, [tabItemSubject, updateConfig]);

    useEffect(() => dispatch({ type: 'buildItems', config }), [config]);

    const handleSelect = index => () => dispatch({ type: 'selectIndex', index });

    const handleClose = key => () => dispatch({ type: 'closeItem', key, updateConfig });

    const onItemPickup = item => tabItemSubject.next(item);

    const sortedItems = Object.values(items).sort((a, b) => a[TabIndex] - b[TabIndex]);

    const tabs = sortedItems.map(
        (item, index) => {
            const key = item[TabKey];
            if (!item[TitleSubject]) {
                item[TitleSubject] = new Subject();
            }
            return <ItemTab key={`tab_${key}`}
                            docked={docked}
                            item={item}
                            onClick={handleSelect(index)}
                            onClose={handleClose(key)}/>;
        }
    );

    const containerHeight = `100vh - ${appBarHeight(theme)} - ${tabsHeight(theme)}`;

    const containers = sortedItems.map(
        item => {
            const ContainerComponent = item.id ? MemberContainer : CollectionContainer;
            const key = item[TabKey];
            return <div key={`container_${key}`}
                        style={{ height: `calc(${containerHeight})`, overflow: 'auto' }}>
                <ContainerComponent docked={docked}
                                    item={item}
                                    height={containerHeight}
                                    width={width}
                                    onItemPickup={onItemPickup}
                                    onClose={handleClose(key)}/>
            </div>;
        }
    );

    function handleChange(event, newValue) {
        console.warn('CHANGED', newValue);
    }

    return (
        <div className={classes.root}>
            <AppBar position="sticky" color="default">
                <Tabs value={index}
                      onChange={handleChange}
                      variant="scrollable"
                      scrollButtons="on"
                      indicatorColor="primary"
                      style={{ minHeight: 'inherit' }}>
                    {tabs}
                </Tabs>
            </AppBar>
            <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                            index={index < 0 ? 0 : index}>
                {containers}
            </SwipeableViews>
        </div>
    );
}
