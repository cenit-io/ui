import React, { useEffect, useState } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import NewIcon from '@material-ui/icons/Add';
import { DataTypeSubject } from "../services/subjects";
import Loading from "../components/Loading";
import { FETCHED } from "../common/Symbols";

const New = ({ docked, dataType, rootId, onSubjectPicked, width, height }) => {

    const [seed, setSeed] = useState(null);

    useEffect(() => {
        DataTypeSubject.for(dataType.id).config().subscribe(
            config => {
                const seed = (config.actions?.new?.seed) || {};
                seed[FETCHED] = true;
                setSeed(seed);
            }
        )
    }, [dataType]);

    if (seed) {
        return <FormEditor value={seed}
                           height={height}
                           width={width}
                           docked={docked}
                           dataType={dataType}
                           rootId={rootId}
                           onSubjectPicked={onSubjectPicked}/>;
    }

    return <Loading/>;
};

export default ActionRegistry.register(New, {
    kind: ActionKind.collection,
    icon: NewIcon,
    title: 'New',
    crud: [CRUD.create]
});
