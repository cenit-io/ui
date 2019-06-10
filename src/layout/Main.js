import React, {useState} from 'react';
import FormTest from "../components/FormTest";
import {Drawer, useMediaQuery} from "@material-ui/core";
import AppBar from './AppBar';
import Navigation from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";

const Main = () => {
    const [docked, setDocked] = useState(false),
        navigation = <Navigation docked={docked}/>,
        theme = useTheme(),
        xs = useMediaQuery(theme.breakpoints.down('xs')),

        switchNavigation = () => setDocked(!docked);

    return <div>
        <AppBar onToggle={switchNavigation}/>
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