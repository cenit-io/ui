import React, { useEffect, useState } from 'react';
import { makeStyles, useMediaQuery } from "@material-ui/core";
import AppBar, { appBarHeight } from './AppBar';
import Navigation, { navigationWidth } from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import AuthorizationService from "../services/AuthorizationService";
import { DataType } from "../services/DataTypeService";
import Drawer from "../components/Drawer";
import clsx from "clsx";
import Tabs from "./Tabs";
import { switchMap } from "rxjs/operators";
import zzip from "../util/zzip";

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
    const [docked, setDocked] = useState(localStorage.getItem('docked') !== 'false');
    const [idToken, setIdToken] = useState(null);
    const [config, setConfig] = useState(null);
    const [currentConfig, setCurrentConfig] = useState(null);
    const [items, setItems] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const classes = useStyles();

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));

    useEffect(() => {
        if (!idToken) {
            const subscription = AuthorizationService.getIdToken().subscribe(
                token => setIdToken(token)
            );

            return () => subscription.unsubscribe();
        }
    }, [idToken]);

    useEffect(() => {
        if (config) {
            if (currentConfig && currentConfig.tenant_id !== config.tenant_id) {
                setCurrentConfig(null);
            }
            let dataTypesIds, dataTypes;
            const subscription = AuthorizationService.config({
                tenant_id: config.tenant_id,
                dataTypesIds: config.dataTypesIds
            })
                .pipe(
                    switchMap(data => {
                            dataTypesIds = data.dataTypesIds || [];
                            return zzip(...dataTypesIds.map(id => DataType.getById(id))).pipe(
                                switchMap(dts => {
                                    dataTypes = dts;
                                    dts = dts.filter(dataType => dataType);
                                    dataTypesIds = dts.map(dataType => dataType.id);
                                    return zzip(...dts.map(dataType => dataType.getTitle()));
                                })
                            );
                        }
                    )
                ).subscribe(
                    titles => setCurrentConfig({ ...config, dataTypesIds, dataTypes, titles })
                );
            return () => subscription.unsubscribe();
        }
    }, [config]);

    const navigation = <Navigation docked={docked}
                                   xs={xs}
                                   config={currentConfig}
                                   onItemSelected={handleItemSelected}/>;

    const switchNavigation = () => {
        localStorage.setItem('docked', String(!docked));
        setDocked(!docked);
    };

    function handleItemSelected(item) {
        if (xs && docked) {
            switchNavigation();
        }
        let index = items.findIndex(
            value => !Object.keys(item).find(
                key => value[key] !== item[key]
            ) && !Object.getOwnPropertySymbols(item).find(
                key => value[key] !== item[key]
            )
        );
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

    function handleTenantSelected(tenant) {
        if (!currentConfig || tenant.id !== currentConfig.tenant_id) {
            setConfig({ tenant_id: tenant.id })
        }
    }

    function handleDataTypeSelected(dataType) {
        const dataTypesIds = currentConfig.dataTypesIds || [],
            dataTypes = currentConfig.dataTypes || [],
            titles = currentConfig.titles || [],
            dataTypeId = dataType.record.id;

        if (dataTypesIds.indexOf(dataTypeId) === -1) {
            dataTypesIds.push(dataTypeId);
            dataTypes.push(dataType.record);
            titles.push(dataType.title);
            setConfig({
                tenant_id: currentConfig.tenant_id,
                dataTypesIds,
                dataTypes,
                titles
            });
        }
    }

    const navWidth = xs ? 0 : (docked ? navigationWidth(theme) : `${theme.spacing(7) + 1}px`);
    const tabsWidth = navWidth ? `100vw - ${navWidth}` : '100vw';

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
                      onItemPickup={handleItemSelected}
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
                dataTypeSelectorDisabled={currentConfig === null}
                idToken={idToken}/>
    </div>
};

export default Main;
