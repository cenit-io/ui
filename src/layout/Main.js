import React, {useState} from 'react';
import FormTest from "../components/FormTest";
import {Drawer, useMediaQuery} from "@material-ui/core";
import AppBar from './AppBar';
import Navigation from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import AuthorizationService from "../services/AuthorizationService";
import {DataType} from "../services/DataTypeService";

const Main = () => {
    const [docked, setDocked] = useState(localStorage.getItem('docked') !== 'false'),
        [config, setConfig] = useState(null),
        [selectedItem, setSelectedItem] = useState(null),

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
        setSelectedItem(item);
    }

    function configure(data) {
        if (!config || config.tenant_id !== data.tenant_id) {
            setConfig(null);
        }
        AuthorizationService.config({ tenant_id: data.tenant_id, dataTypesIds: data.dataTypesIds })
            .then(data => {
                const dataTypesIds = data.dataTypesIds || [];
                Promise.all(
                    dataTypesIds.map(id => DataType.getById(id))
                ).then(dataTypes => {
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

    return <div>
        <AppBar onToggle={switchNavigation}
                onTenantSelected={handleTenantSelected}
                onDataTypeSelected={handleDataTypeSelected}
                dataTypeSelectorDisabled={config === null}/>
        <div style={{ position: 'relative', display: 'flex' }}>
            <div style={{
                flexGrow: 1,
                marginLeft: (xs || docked) ? 'unset' : '95px',
                order: 1
            }}>
                <FormTest {...selectedItem}/>
            </div>
            {
                xs || navigation
            }
            {
                xs &&
                <Drawer open={docked} onClose={switchNavigation}>
                    {navigation}
                </Drawer>
            }
        </div>
    </div>
};

export default Main;