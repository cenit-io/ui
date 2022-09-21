import React, { useEffect } from 'react';
import Skeleton from "@material-ui/lab/Skeleton";
import Chip from "@material-ui/core/Chip";
import { DataTypeSubject, TabsSubject } from "../services/subjects";
import { of } from "rxjs";
import { switchMap } from "rxjs/operators";
import zzip from "../util/zzip";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";

export default function TypePropertyViewer({ value }) {

  const [state, setState] = useSpreadState();

  const { title, dataType } = state;

  useEffect(() => {
    if (value) {
      const subscription = DataType.byTypeName(value).pipe(
        switchMap(dataType => zzip(
          of(dataType),
          (dataType && dataType.getTitle()) || of('-')
        ))
      ).subscribe(
        ([dataType, title]) => setState({ dataType, title })
      );

      return () => subscription.unsubscribe();
    }
  }, [value]);

  if (dataType) {
    return <Chip label={title}
                 component="div"
                 onClick={() => TabsSubject.next({
                   key: DataTypeSubject.for(dataType.id).key
                 })} />;
  }

  if (title) {
    return <span>-</span>;
  }

  return <Skeleton component="span" variant="text" />;
}
