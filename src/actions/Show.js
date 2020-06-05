import React, { useEffect, useState } from 'react';
import ShowIcon from '@material-ui/icons/RemoveRedEye';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import Loading from "../components/Loading";


const Show = ({ docked, dataType, record, onSubjectPicked }) => {

    if (record) {
        return <pre>{JSON.stringify(record, null, 2)}</pre>;
    }

    return <Loading/>;
};

export default ActionRegistry.register(Show, {
    kind: ActionKind.member,
    icon: ShowIcon,
    title: 'Show',
    arity: 1
});
