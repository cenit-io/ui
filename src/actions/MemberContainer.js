import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';
import zzip from "../util/zzip";
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

function MemberContainer({ docked, item, height, width, onItemPickup }) {
    const [actionKey, setActionKey] = useState(Show.key);
    const [title, setTitle] = useState(null);
    const [dataType, setDataType] = useState(null);

    const theme = useTheme();
    const classes = actionContainerStyles();

    const itemKey = JSON.stringify(item);

    useEffect(() => {
        const subscription = zzip(
            item.getDataType(),
            item.getTitle()
        ).subscribe(([dataType, title]) => {
            setDataType(dataType);
            setTitle(title);
        });
        return () => subscription.unsubscribe();
    }, [item, itemKey]);

    if (!title) {
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
                                                       height={componentHeight}
                                                       width={width}
                                                       onItemPickup={onItemPickup}/>;

    return <React.Fragment>
        <MemberActionsToolbar title={title} onAction={handleAction}/>
        <div className={classes.actionContainer}
             style={{ height: `calc(${componentHeight})` }}>
            {action}
        </div>
    </React.Fragment>;
}

export default MemberContainer;
