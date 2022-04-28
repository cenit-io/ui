import React, { useEffect, useState, useRef } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles/index';
import AppBar from '@material-ui/core/AppBar/index';
import Tabs from '@material-ui/core/Tabs/index';
import Tab from '@material-ui/core/Tab/index';
import Button from '@material-ui/core/Button/index';
import IconButton from '@material-ui/core/IconButton/index';
import CloseIcon from '@material-ui/icons/Clear';
import SwipeableViews from "react-swipeable-views";
import { appBarHeight } from "./AppBar";
import Subjects, { NavSubject, TabsSubject } from "../services/subjects";
import ConfigService from "../services/ConfigService";
import { useSpreadState } from "../common/hooks";
import useResizeObserver from "@react-hook/resize-observer";
import { from } from "rxjs";
import { AppGateway } from "../services/AuthorizationService";
import EmbeddedApp from "../components/EmbeddedApp";
import { useMediaQuery} from '@material-ui/core';
import Dialog from "@material-ui/core/Dialog";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

export const tabsHeight = theme => `${theme.spacing(4) + 4}px`;

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    position: "relative",
  },
  banner: {
    display: "flex",
    height: "min-content",
    width: "100%",
  },
  closeAllTabs: {
    position: "absolute",
    right: ".5rem",
    bottom: "-10px",
  },
  modal: {
    backdropFilter: "blur(6px) saturate(120%)",
  },
}));

function ItemTab({ subject, onClick, onClose, onCloseAllTabs, onCloseAllKeepMe, isDisabledKeepMe }) {

    const [title, setTitle] = useState(subject?.titleCache || '...');

    useEffect(() => {
        const subscription = subject.navTitle().subscribe(
            title => setTitle(title || '...')
        );
        return () => subscription.unsubscribe();
    }, [subject]);

    return (
        <Tab component={ClosableComponent}
             label={title}
             onClick={onClick}
             onClose={onClose}
             onCloseAllTabs={onCloseAllTabs}
             onCloseAllKeepMe={onCloseAllKeepMe}
             isDisabledKeepMe={isDisabledKeepMe}/>
    );
}

const CloseTabsDialog = ({
  closeAllKeepMe,
  isDisabledKeepMe,
  handleCloseAllTabs,
  handleCloseBox,
  showCLose,
}) => {
  const classes = useStyles();

  return (
    <Dialog className={classes.modal} onClose={handleCloseBox} open={showCLose} >
      <List>
        <ListItem button onClick={handleCloseAllTabs} pt={0}>
          <ListItemText primary="Close All Tabs" />
        </ListItem>
        <ListItem button onClick={closeAllKeepMe} disabled={isDisabledKeepMe}>
          <ListItemText primary="Close All Other Tabs" />
        </ListItem>
      </List>
    </Dialog>
  );
};

const ClosableComponent = ({
  onClick,
  children,
  onClose,
  onCloseAllTabs,
  onCloseAllKeepMe,
  isDisabledKeepMe
}) => {
  const [over, setOver] = useState(false);
  const [showCLose, setShowCLose] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCLose(true);
  };

  const handleCloseAllTabs = () => {
    setShowCLose(false);
    onCloseAllTabs();
  };

  const closeAllKeepMe = () => {
    setShowCLose(false);
    onCloseAllKeepMe();
  };

  const handleCloseBox = () => setShowCLose(false);

  return (
    <div onMouseMove={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <Button onClick={onClick} onContextMenu={handleContextMenu}>
        {children}
      </Button>

      <IconButton
        aria-label="Close"
        size="small"
        style={{ visibility: over ? "visible" : "hidden" }}
        onClick={onClose}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>

      <CloseTabsDialog
        handleCloseBox={handleCloseBox}
        handleCloseAllTabs={handleCloseAllTabs}
        closeAllKeepMe={closeAllKeepMe}
        showCLose={showCLose}
        isDisabledKeepMe={isDisabledKeepMe}
      />
    </div>
  );
};


const onSubjectPicked = (key, actionKey) => TabsSubject.next({ key, actionKey });

const initialTabs = {
    tabs: [],
    tabIndex: 0,
    alertBannerHeight: 1
}

export default function NavTabs({ docked, width }) {
    const classes = useStyles();
    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'));
    const [state, setState] = useSpreadState(initialTabs);
    const [actionsKeys, setActionKeys] = useSpreadState();

    const { tabs, tabIndex, alertBannerHeight, bannerURL } = state;

    const setTabIndex = tabIndex => {
        setState({ tabIndex });
        NavSubject.next(tabs[tabIndex]);
        ConfigService.update({ tabIndex });
    };

    const alertBanner = useRef(null);

    useResizeObserver(alertBanner, entry => setState({
        alertBannerHeight: Math.ceil(entry.contentRect.height) || 1
    }));

    useEffect(() => {
        const subscription = from(AppGateway().get('/meta_config')).subscribe(
            ({ data: { banner_url: bannerURL } }) => setState({ bannerURL })
        );

        return () => subscription.unsubscribe();
    }, []);

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
            ({ key, actionKey }) => {
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
                setActionKeys({ [key]: actionKey });
                ConfigService.update(config);
                NavSubject.next(key); // TODO Notify Nav only if the subject is resolved
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
        const [key] = tabs.splice(index, 1);
        const config = { tabs, tabIndex: newIndex };
        setState(config);
        setActionKeys({ [key]: undefined });
        ConfigService.update(config)
    };

    const handleCloseAllTabs = () => {
      setState(initialTabs);
      ConfigService.update(initialTabs);
    };

    const handleCloseAllKeepMe = (index) => () => {
      const keepTap = {
        tabs: [tabs[index]],
        tabIndex: 0,
      };

      setState(keepTap);
      handleSelect(0);
    };

    const itemTabs = tabs.map(
        (key, index) => <ItemTab key={`tab_${key}`}
                                 docked={docked}
                                 subject={Subjects[key]}
                                 onClick={handleSelect(index)}
                                 onClose={handleClose(index)}
                                 onCloseAllTabs={handleCloseAllTabs}
                                 onCloseAllKeepMe={handleCloseAllKeepMe(index)}
                                 isDisabledKeepMe={tabs.length === 1}
                                 />
    );

    const containerHeight = `100vh - ${appBarHeight(theme)} - ${tabsHeight(theme)} - ${alertBannerHeight}px`;

    const containers = tabs.map(
        (key, index) => {
            const TabComponent = Subjects[key]?.TabComponent;
            return (
                <div key={`container_${key}`}
                     style={{ height: `calc(${containerHeight})`, overflow: 'auto' }}>
                    <TabComponent docked={docked}
                                  subject={Subjects[key]}
                                  height={containerHeight}
                                  width={width}
                                  onSubjectPicked={onSubjectPicked}
                                  onClose={handleClose(index)}
                                  activeActionKey={actionsKeys[key]}/>
                </div>
            );
        }
    ).filter(c => c);

    function handleChange(event, newValue) {
        console.warn('CHANGED', newValue);
    }

    let banner;
    if (bannerURL) {
        banner = <EmbeddedApp url={bannerURL} autoHeight={true}/>;
    }

    return (
        <div className={classes.root}>
            <div className={classes.banner} ref={alertBanner}>
                {banner}
            </div>
            <AppBar position="sticky" color="default">
                <Tabs value={tabIndex}
                      component="div"
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
                            disabled={!smUp}
                            onChangeIndex={tabIndex => setTabIndex(tabIndex)}>
                {containers}
            </SwipeableViews>
        </div>
    );
}
