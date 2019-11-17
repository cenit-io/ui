import React, { useEffect, useState } from 'react';
import ShowIcon from '@material-ui/icons/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import Loading from "../components/Loading";
import { switchMap } from "rxjs/operators";
import zzip from "../util/zzip";


const Show = ({ docked, item, onSelectItem }) => {

    const [value, setValue] = useState(null);
    const itemKey = JSON.stringify(item);

    useEffect(() => {
        const subscription = item.getDataType().pipe(
            switchMap(dataType => dataType.get(item.id))
        ).subscribe(value => setValue(value));
        return () => subscription.unsubscribe();
    }, [item, itemKey]);

    if (value) {
        return <pre>
        {JSON.stringify(value, null, 2)}
    </pre>;
    }

    return <Loading/>;
};

export default ActionRegistry.register(Show, {
    kind: ActionKind.member,
    icon: ShowIcon,
    title: 'Show',
    arity: 1
});
