import React, { useReducer, useEffect } from 'react';
import Skeleton from "@material-ui/lab/Skeleton";
import Chip from "@material-ui/core/Chip";
import { DataTypeSubject, RecordSubject, TabsSubject } from "../services/subjects";
import { of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import spreadReducer from "../common/spreadReducer";
import zzip from "../util/zzip";

export default function RefOneViewer({ prop, value, className }) {

    const [state, setState] = useReducer(spreadReducer, {});

    const { title, dataType } = state;

    useEffect(() => {
        if (prop && value) {
            const subscription = (
                ((!value._type || value._type === prop.dataType.type_name()) && of(prop.dataType)) ||
                prop.dataType.findByName(value._type)
            ).pipe(
                switchMap(dataType => zzip(of(dataType), dataType.titleFor(value)))
            ).subscribe(
                ([dataType, title]) => setState({ dataType, title })
            );

            return () => subscription.unsubscribe();
        }
    }, [prop, value]);

    const handleClick = () => TabsSubject.next(RecordSubject.for(dataType.id, value.id).key);

    if (value) {
        if (title) {
            return <Chip label={title} onClick={handleClick} className={className}/>;
        }

        return <Skeleton variant="text"/>;
    }

    return <span>-</span>;
}
