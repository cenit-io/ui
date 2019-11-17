import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';

import Index from "./Index";
import New from './New';
import Show from "./Show";
import Edit from './Edit';
import ActionToolbar from "./ActionToolbar";
import zzip from "../util/zzip";


const actionContainerStyles = makeStyles(theme => ({
    actionContainer: {
        width: '100%',
        overflow: 'auto',
        position: 'relative',
        height: props => `calc(${props.height} - ${appBarHeight(theme)})`
    }
}));

function ActionContainer({ docked, item, height, width, onSelectItem, kind }) {
    const [actionKey, setActionKey] = useState((kind === ActionKind.member ? Show : Index).key);
    const [selection, setSelection] = useState([]);
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

    const handleSelect = selection => setSelection(selection);

    const handleAction = actionKey => {
        const action = ActionRegistry.byKey(actionKey);
        if (action) {
            if (action.kind === kind) {
                setActionKey(actionKey);
            } else {
                onSelectItem({ dataTypeId: dataType.id, id: selection[0] })
            }
        }
    };

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent docked={docked}
                                                       dataType={dataType}
                                                       item={item}
                                                       selection={selection}
                                                       height={componentHeight}
                                                       width={width}
                                                       onSelect={handleSelect}
                                                       onSelectItem={onSelectItem}/>;

    return <React.Fragment>
        <ActionToolbar title={title}
                       kind={kind}
                       arity={kind === ActionKind.member ? 1 : selection.length}
                       onAction={handleAction}
                       selectedKey={actionKey}/>
        <div className={classes.actionContainer}
             style={{ height: `calc(${componentHeight})` }}>
            {action}
        </div>
    </React.Fragment>;
}

export default ActionContainer;
