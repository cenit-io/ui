import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles/index';
import AppBar from '@material-ui/core/AppBar/index';
import Tabs from '@material-ui/core/Tabs/index';
import Tab from '@material-ui/core/Tab/index';
import Button from '@material-ui/core/Button/index';
import IconButton from '@material-ui/core/IconButton/index';
import CloseIcon from '@material-ui/icons/Clear';
import SwipeableViews from "react-swipeable-views";
import { appBarHeight } from "./AppBar";
import ActionContainer from "../actions/ActionContainer";
import { DataType } from "../services/DataTypeService";
import { ActionKind } from "../actions/ActionRegistry";

export const tabsHeight = theme => `${theme.spacing(4) + 4}px`;

function ItemTab({ item, index, onSelect, onClose }) {

    const [data, setData] = useState({});

    if (data.item !== item) {
        item.getTitle().subscribe(title => setData({ item, title }));
    }
    return (
        <Tab
            component={ClosableComponent}
            onClick={() => onSelect(index)}
            label={data.title || '...'}
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

export default function NavTabs({ docked, items, index, onSelect, onCloseItem, width, onSelectItem }) {
    const classes = useStyles();
    const theme = useTheme();
    const [, setValue] = React.useState(0);
    const tabs = items.map((item, i) => <ItemTab key={`tab_${item.dataTypeId}_${item.id}`}
                                                 docked={docked}
                                                 item={item}
                                                 index={i}
                                                 onSelect={onSelect}
                                                 onClose={onCloseItem}/>);
    const containerHeight = `100vh - ${appBarHeight(theme)} - ${tabsHeight(theme)}`;
    const containers = items.map(
        item => {
            const kind = item.id ? ActionKind.member : ActionKind.collection;
            return <div key={`container_${item.dataTypeId}_${item.id}`}
                        style={{ height: `calc(${containerHeight})`, overflow: 'auto' }}>
                <ActionContainer kind={kind}
                                 docked={docked}
                                 item={item}
                                 height={containerHeight}
                                 width={width}
                                 onSelectItem={onSelectItem}/>
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
                            index={index}>
                {containers}
            </SwipeableViews>
        </div>
    );
}
