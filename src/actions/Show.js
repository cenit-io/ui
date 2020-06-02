import React, { useEffect, useState } from 'react';
import ShowIcon from '@material-ui/icons/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import Loading from "../components/Loading";


const Show = ({ docked, dataType, record, onSubjectPicked }) => {

    const [value, setValue] = useState(null);
    const itemKey = JSON.stringify(record);

    useEffect(() => {
        const subscription = dataType.get(record.id).subscribe(
            value => setValue(value)
        );
        return () => subscription.unsubscribe();
    }, [dataType, record, itemKey]);

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
