import React, { useEffect, useState } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import NewIcon from '@material-ui/icons/Add';
import { DataTypeSubject } from "../services/subjects";
import Loading from "../components/Loading";
import { FETCHED } from "../common/Symbols";
import { switchMap } from "rxjs/operators";
import { isObservable, of } from "rxjs";

const New = ({ docked, dataType, rootId, onSubjectPicked, width, height }) => {

    const [seed, setSeed] = useState(null);

    useEffect(() => {
        const subscription = DataTypeSubject.for(dataType.id).config().pipe(
            switchMap(config => {
                let seed = config.actions?.new?.seed;
                if (typeof seed === 'function') {
                    seed = seed(dataType);
                }
                if (isObservable(seed)) {
                    return seed;
                }
                return of(seed || {});
            })
        ).subscribe(seed => {
            seed[FETCHED] = true;
            setSeed(seed);
        });

        return () => subscription.unsubscribe();
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
