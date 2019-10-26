import React, {useState} from 'react';
import {makeStyles, useMediaQuery} from "@material-ui/core";
import AppBar, {appBarHeight} from './AppBar';
import Navigation, {navigationWidth} from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import AuthorizationService from "../services/AuthorizationService";
import {DataType} from "../services/DataTypeService";
import Drawer from "../components/Drawer";
import clsx from "clsx";
import Tabs from "./Tabs";

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative'
    },
    mainContainer: {
        position: 'relative',
        display: 'flex',
        height: `calc(100vh - ${appBarHeight(theme)})`,
        marginTop: appBarHeight(theme)
    },
    contentMargin: {
        marginLeft: theme.spacing(7) + 1
    }
}));

const Main = () => {
    const [docked, setDocked] = useState(localStorage.getItem('docked') !== 'false'),
        [idToken, setIdToken] = useState(null),
        [config, setConfig] = useState(null),
        [items, setItems] = useState([]),
        [selectedIndex, setSelectedIndex] = useState(0),

        classes = useStyles(),

        theme = useTheme(),
        xs = useMediaQuery(theme.breakpoints.down('xs')),

        navigation = <Navigation docked={docked}
                                 xs={xs}
                                 config={config}
                                 onItemSelected={handleItemSelected}/>,

        switchNavigation = () => {
            localStorage.setItem('docked', String(!docked));
            setDocked(!docked);
        };

    function handleItemSelected(item) {
        if (xs) {
            switchNavigation();
        }
        let index = items.indexOf(item);
        if (index === -1) {
            index = items.length;
            setItems([...items, item]);
        }
        setSelectedIndex(index);
    }

    function removeItem(index) {
        if (selectedIndex === items.length - 1) {
            setSelectedIndex(selectedIndex - 1);
        }
        let newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    }

    function configure(data) {
        if (!config || config.tenant_id !== data.tenant_id) {
            setConfig(null);
        }
        AuthorizationService.config({ tenant_id: data.tenant_id, dataTypesIds: data.dataTypesIds })
            .then(data => {
                let dataTypesIds = data.dataTypesIds || [];
                Promise.all(
                    dataTypesIds.map(id => DataType.getById(id))
                ).then(dataTypes => {
                    dataTypes = dataTypes.filter(dataType => dataType);
                    dataTypesIds = dataTypes.map(dataType => dataType.id);
                    Promise.all(dataTypes.map(dataType => dataType.getTitle()))
                        .then(titles => setConfig({ ...data, dataTypesIds, dataTypes, titles }));
                });
            });
    }

    function handleTenantSelected(tenant) {
        if (!config || tenant.id !== config.tenant_id) {
            configure({ tenant_id: tenant.id })
        }
    }

    function handleDataTypeSelected(dataType) {
        const dataTypesIds = config.dataTypesIds || [],
            dataTypes = config.dataTypes || [],
            titles = config.titles || [],
            dataTypeId = dataType.record.id;

        if (dataTypesIds.indexOf(dataTypeId) === -1) {
            dataTypesIds.push(dataTypeId);
            dataTypes.push(dataType.record);
            titles.push(dataType.title);
            configure({ tenant_id: config.tenant_id, dataTypesIds, dataTypes, titles });
        }
    }

    if (!idToken) {
        AuthorizationService.getIdToken().then(token => setIdToken(token));
    }

    const navWidth = xs ? 0 : (docked ? navigationWidth(theme) : `${theme.spacing(7) + 1}px`),
        tabsWidth = navWidth ? `100vw - ${navWidth}` : '100vw';

    return <div className={classes.root}>
        <div className={classes.mainContainer}>
            <div className={clsx(!(xs || docked) && classes.contentMargin)}
                 style={{
                     flexGrow: 1,
                     order: 1,
                     width: `calc(${tabsWidth})`
                 }}>
                <Tabs docked={docked}
                      items={items}
                      index={selectedIndex}
                      onSelect={setSelectedIndex}
                      onCloseItem={removeItem}
                      width={tabsWidth}/>
            </div>
            {
                xs || navigation
            }
            {
                xs &&
                <Drawer docked={docked}
                        onClose={switchNavigation}
                        idToken={idToken}
                        navigation={navigation}/>
            }
        </div>
        <AppBar onToggle={switchNavigation}
                onTenantSelected={handleTenantSelected}
                onDataTypeSelected={handleDataTypeSelected}
                dataTypeSelectorDisabled={config === null}
                idToken={idToken}/>
    </div>
};

export default Main;
