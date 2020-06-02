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
import reducer from "../common/reducer";
import Subjects, { TabsSubject } from "../services/subjects";
import ConfigService from "../services/ConfigService";

export const tabsHeight = theme => `${theme.spacing(4) + 4}px`;

function ItemTab({ subject, onClick, onClose }) {

    const [title, setTitle] = useState('...');

    useEffect(() => {
        const subscription = subject.navTitle().subscribe(title => setTitle(title));
        return () => subscription.unsubscribe();
    }, [subject]);

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

export default function NavTabs({ docked, width }) {
    const classes = useStyles();
    const theme = useTheme();
    const [state, setState] = useReducer(reducer, {
        tabs: [],
        tabIndex: 0
    });

    const { tabs, tabIndex } = state;

    const setTabIndex = tabIndex => {
        setState({ tabIndex });
        ConfigService.update({ tabIndex });
    };

    useEffect(() => {
        const subscription = ConfigService.tenantIdChanges().subscribe(
            () => {
                const { tabs, tabIndex } = ConfigService.state();
                setState({
                    tabs: tabs || [],
                    tabIndex: Math.max(0, Math.min(tabIndex || 0, (tabs && tabs.length - 1) || 0))
                });
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = TabsSubject.subscribe(
            key => {
                const tabIndex = tabs.indexOf(key);
                let config;
                if (tabIndex !== -1) {
                    config = { tabIndex };
                } else {
                    config = {
                        tabs: [...tabs, key],
                        tabIndex: tabs.length
                    };
                }
                setState(config);
                ConfigService.update(config);
            }
        );
        return () => subscription.unsubscribe();
    }, [tabs]);

    const handleSelect = tabIndex => () => setTabIndex(tabIndex);

    const handleClose = index => () => {
        let newIndex = tabIndex;
        if (index <= newIndex) {
            newIndex = Math.max(0, newIndex - 1);
        }
        tabs.splice(index, 1);
        const config = { tabs, tabIndex: newIndex };
        setState(config);
        ConfigService.update(config)
    };

    const onSubjectPicked = key => TabsSubject.next(key);

    const itemTabs = tabs.map(
        (key, index) => <ItemTab key={`tab_${key}`}
                                 docked={docked}
                                 subject={Subjects[key]}
                                 onClick={handleSelect(index)}
                                 onClose={handleClose(index)}/>
    );

    const containerHeight = `100vh - ${appBarHeight(theme)} - ${tabsHeight(theme)}`;

    const containers = tabs.map(
        key => {
            const { TabComponent } = Subjects[key];
            return (
                <div key={`container_${key}`}
                     style={{ height: `calc(${containerHeight})`, overflow: 'auto' }}>
                    <TabComponent docked={docked}
                                  subject={Subjects[key]}
                                  height={containerHeight}
                                  width={width}
                                  onSubjectPicked={onSubjectPicked}
                                  onClose={handleClose(key)}/>
                </div>
            );
        }
    );

    function handleChange(event, newValue) {
        console.warn('CHANGED', newValue);
    }

    return (
        <div className={classes.root}>
            <AppBar position="sticky" color="default">
                <Tabs value={tabIndex}
                      onChange={handleChange}
                      variant="scrollable"
                      scrollButtons="on"
                      indicatorColor="primary"
                      style={{ minHeight: 'inherit' }}>
                    {itemTabs}
                </Tabs>
            </AppBar>
            <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                            index={tabIndex}
                            onChangeIndex={tabIndex => setTabIndex(tabIndex)}>
                {containers}
            </SwipeableViews>
        </div>
    );
}
