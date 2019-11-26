import React, { useEffect, useState } from 'react';
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
import { switchMap } from "rxjs/operators";
import { DataType } from "../services/DataTypeService";
import { DataTypeId } from "../common/Symbols";

export const tabsHeight = theme => `${theme.spacing(4) + 4}px`;

function ItemTab({ item, index, onSelect, onClose }) {

    const [title, setTitle] = useState('...');

    useEffect(() => {
        const subscription = DataType.getById(item[DataTypeId]).pipe(switchMap(
            dataType => {
                if (item.id) {
                    return dataType.titleFor(item);
                }
                return dataType.getTitle();
            }
        )).subscribe(title => setTitle(title));
        return () => subscription.unsubscribe();
    }, [item]);

    return (
        <Tab component={ClosableComponent}
             onClick={() => onSelect(index)}
             label={title}
             onClose={() => onClose(index)}
        />
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

export default function NavTabs({ docked, items, index, onSelect, onCloseItem, width, onItemPickup }) {
    const classes = useStyles();
    const theme = useTheme();
    const [, setValue] = useState(0);
    const [tabItems, setTabItems] = useState({});

    const updateItem = index => item => {
        Object.getOwnPropertySymbols(items[index]).forEach(symbol => item[symbol] = items[index][symbol]);
        setTabItems({
            ...tabItems,
            [index]: item
        });
    };

    const handleClose = index => () => {
        delete tabItems[index];
        onCloseItem(index);
    };

    const tabs = items.map(
        (item, i) => (
            <ItemTab key={`tab_${item[DataTypeId]}_${item.id}`}
                     docked={docked}
                     item={tabItems[i] || item}
                     index={i}
                     onSelect={onSelect}
                     onClose={onCloseItem}/>
        )
    );

    const containerHeight = `100vh - ${appBarHeight(theme)} - ${tabsHeight(theme)}`;

    const containers = items.map(
        (item, index) => {
            const ContainerComponent = item.id ? MemberContainer : CollectionContainer;
            return <div key={`container_${item[DataTypeId]}_${item.id}`}
                        style={{ height: `calc(${containerHeight})`, overflow: 'auto' }}>
                <ContainerComponent docked={docked}
                                    item={tabItems[index] || item}
                                    updateItem={updateItem(index)}
                                    height={containerHeight}
                                    width={width}
                                    onItemPickup={onItemPickup}
                                    onClose={handleClose(index)}/>
            </div>;
        }
    );

    function handleChange(event, newValue) {
        setValue(newValue);
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
