import React, { useState } from 'react';
import Loading from '../components/Loading';
import { useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';

import Index from "./Index";
import New from './New';
import Show from "./Show";
import ActionToolbar from "./ActionToolbar";


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

    if (!title) {
        item.getDataType().then(dataType => {
            setDataType(dataType);
            item.getTitle().then(title => setTitle(title));
        });
        return <Loading/>;
    }

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
                       arity={selection.length}
                       onAction={handleAction}
                       selectedKey={actionKey}/>
        <div className={classes.actionContainer}
             style={{ height: `calc(${componentHeight})` }}>
            {action}
        </div>
    </React.Fragment>;
}

export default ActionContainer;
