import React, { useEffect } from 'react';
import Skeleton from "@material-ui/lab/Skeleton";
import Chip from "@material-ui/core/Chip";
import { RecordSubject, TabsSubject } from "../services/subjects";
import { of } from "rxjs";
import { switchMap } from "rxjs/operators";
import zzip from "../util/zzip";
import { useSpreadState } from "../common/hooks";

export default function RefOneViewer({ prop, value, className, refDataType, variant, color }) {

  const [state, setState] = useSpreadState();

  const { title, dataType } = state;

  useEffect(() => {
    if ((refDataType || prop) && value) {
      const subscription = (
        (refDataType && of(refDataType)) ||
        ((!value._type || value._type === prop.dataType.type_name()) && of(prop.dataType)) ||
        prop.dataType.findByName(value._type)
      ).pipe(
        switchMap(dataType => zzip(of(dataType), dataType.titleFor(value)))
      ).subscribe(
        ([dataType, title]) => setState({ dataType, title })
      );

      return () => subscription.unsubscribe();
    }
  }, [refDataType, prop, value]);

  const handleClick = () => TabsSubject.next({
    key: RecordSubject.for(dataType.id, value.id).key
  });

  if (value) {
    if (title) {
      return <Chip label={title}
                   onClick={handleClick}
                   className={className}
                   variant={variant}
                   color={color} />;
    }

    return <Skeleton variant="text" />;
  }

  return <span>-</span>;
}
