import React, { useEffect, useState } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import NewIcon from '@material-ui/icons/Add';
import { DataTypeSubject } from "../services/subjects";
import Loading from "../components/Loading";

const New = ({ docked, dataType, rootId, onSubjectPicked, width, height }) => {

    const [seed, setSeed] = useState(null);

    useEffect(() => {
        DataTypeSubject.for(dataType.id).config().subscribe(
            config => setSeed((config.actions?.new?.seed) || {})
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
    title: 'New'
});
