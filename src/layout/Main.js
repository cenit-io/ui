import React, {useState} from 'react';
import FormTest from "../components/FormTest";
import {Drawer, useMediaQuery} from "@material-ui/core";
import AppBar from './AppBar';
import Navigation from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import AuthorizationService from "../services/AuthorizationService";

const Main = () => {
    const [docked, setDocked] = useState(false),
        [config, setConfig] = useState(null),

        navigation = <Navigation docked={docked} config={config}/>,

        theme = useTheme(),
        xs = useMediaQuery(theme.breakpoints.down('xs')),

        switchNavigation = () => setDocked(!docked);

    function configure(data) {
        setConfig(null);
        AuthorizationService.config(data)
            .then(data => setConfig(data));
    }

    function handleTenantSelected(tenant) {
        if (!config || tenant.id !== config.tenant_id) {
            configure({ tenant_id: tenant.id })
        }
    }

    function handleDataTypeSelected(dataType) {
        const dataTypesIds = config.dataTypesIds || [], dataTypeId = dataType.record.id;

        if (dataTypesIds.indexOf(dataTypeId) === -1) {
            dataTypesIds.push(dataTypeId);
            configure({ tenant_id: config.tenant_id, dataTypesIds })
        }
    }

    return <div>
        <AppBar onToggle={switchNavigation}
                onTenantSelected={handleTenantSelected}
                onDataTypeSelected={handleDataTypeSelected}
                dataTypeSelectorDisabled={config === null}/>
        <div style={{ position: 'relative', display: 'flex', border: 'solid 2px red' }}>
            <div style={{
                flexGrow: 1,
                marginLeft: (xs || docked) ? 'unset' : '95px',
                order: 1,
                border: 'solid 2px blue'
            }}>
                <FormTest/>
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