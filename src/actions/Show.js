import React, { useState } from 'react';
import ShowIcon from '@material-ui/icons/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import Loading from "../components/Loading";


const Show = ({ docked, item, onSelectItem }) => {

    const [value, setValue] = useState(null);

    if (!value) {
        item.getDataType().then(
            dataType => dataType.get(item.id).then(value => setValue(value))
        )
        return <Loading/>;
    }

    return <pre>
        {JSON.stringify(value, null, 2)}
    </pre>;
};

export default ActionRegistry.register(Show, {
    kind: ActionKind.member,
    icon: ShowIcon,
    title: 'Show'
});
