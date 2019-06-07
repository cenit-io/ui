import React from 'react';
import FormTest from "../components/FormTest";
import {Drawer, Hidden, useMediaQuery} from "@material-ui/core";
import Navigation from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";

const Main = ({ docked, onDrawerClose }) => {
    const navigation = <Navigation docked={docked}/>,
        theme = useTheme(),
        xs = useMediaQuery(theme.breakpoints.down('xs'));

    return <div style={{ position: 'relative', display: 'flex', border: 'solid 2px red' }}>
        <div style={{
            flexGrow: 1,
            marginLeft: (xs || docked) ? 'unset' : '95px',
            order: 1,
            border: 'solid 2px blue'
        }}>
            <FormTest/>
        </div>
        <Hidden xsDown implementation='css'>
            {navigation}
        </Hidden>
        {
            xs &&
            <Drawer open={docked} onClose={onDrawerClose}>
                {navigation}
            </Drawer>
        }
    </div>
};

export default Main;