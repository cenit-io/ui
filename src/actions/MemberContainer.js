import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';
import MemberActionsToolbar from "./MemberActionsToolbar";
import Show from "./Show";


const actionContainerStyles = makeStyles(theme => ({
    actionContainer: {
        width: '100%',
        overflow: 'auto',
        position: 'relative',
        height: props => `calc(${props.height} - ${appBarHeight(theme)})`
    }
}));

function MemberContainer({ docked, item, height, width, onItemPickup, onClose, updateItem }) {
    const [actionKey, setActionKey] = useState(Show.key);
    const [dataType, setDataType] = useState(null);
    const [disabled, setDisabled] = useState(false);

    const theme = useTheme();
    const classes = actionContainerStyles();

    const itemKey = JSON.stringify(item);

    useEffect(() => {
        const subscription = item.getDataType().subscribe(dataType => setDataType(dataType));
        return () => subscription.unsubscribe();
    }, [item, itemKey]);

    if (!dataType) {
        return <Loading/>;
    }

    const handleAction = actionKey => {
        const action = ActionRegistry.byKey(actionKey);
        if (action) {
            setActionKey(actionKey);
        }
    };

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent docked={docked}
                                                       dataType={dataType}
                                                       item={item}
                                                       updateItem={updateItem}
                                                       height={componentHeight}
                                                       width={width}
                                                       onItemPickup={onItemPickup}
                                                       onCancel={() => handleAction(Show.key)}
                                                       onDisable={disabled => setDisabled(disabled)}
                                                       onClose={onClose}/>;

    return <React.Fragment>
        <MemberActionsToolbar dataType={dataType}
                              item={item}
                              onAction={handleAction}
                              onItemPickup={onItemPickup}
                              disabled={disabled}/>
        <div className={classes.actionContainer}
             style={{ height: `calc(${componentHeight})` }}>
            {action}
        </div>
    </React.Fragment>;
}

export default MemberContainer;
