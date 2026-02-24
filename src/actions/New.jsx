import React, { useEffect, useState } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import NewIcon from '@mui/icons-material/Add';
import { DataTypeSubject, RecordSubject, TabsSubject } from "../services/subject";
import Loading from "../components/Loading";
import { FETCHED } from "../common/Symbols";
import { switchMap } from "rxjs/operators";
import { isObservable, of } from "rxjs";
import { useContainerContext } from './ContainerContext';
import { DataType } from "../services/DataTypeService";


const New = ({ docked, dataType, rootId, onSubjectPicked, width, height }) => {

  const [seed, setSeed] = useState(null);
  const [resolvedDataType, setResolvedDataType] = useState(dataType || null);
  const containerContext = useContainerContext();
  const [, setContainerState] = containerContext;

  const handleCancel = () => {
    setContainerState({ actionKey: 'index' });
  };

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "New" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  useEffect(() => {
    const normalizedDataType = dataType && {
      ...dataType,
      id: dataType.id || dataType._id
    };

    if (normalizedDataType?.id) {
      setResolvedDataType(normalizedDataType);
      return;
    }

    if (!normalizedDataType?.namespace || !normalizedDataType?.name) {
      setResolvedDataType(null);
      return;
    }

    // Prevent indefinite loading if lookup cannot resolve quickly.
    const unresolvedFallback = setTimeout(() => {
      setResolvedDataType(normalizedDataType);
    }, 5000);

    const subscription = DataType.find({
      namespace: normalizedDataType.namespace,
      name: normalizedDataType.name
    }).subscribe((dt) => {
      if (dt?.id) {
        clearTimeout(unresolvedFallback);
        setResolvedDataType(dt);
      }
    });

    return () => {
      clearTimeout(unresolvedFallback);
      subscription.unsubscribe();
    };
  }, [dataType]);

  useEffect(() => {
    if (!resolvedDataType?.id) {
      setSeed(null);
      return;
    }

    const dataTypeSubject = DataTypeSubject.for(resolvedDataType.id);
    const configStream = dataTypeSubject ? dataTypeSubject.config() : of({});
    const subscription = configStream.pipe(
      switchMap(config => {
        let seed = config?.actions?.new?.seed;
        if (typeof seed === 'function') {
          seed = seed(resolvedDataType);
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
  }, [resolvedDataType]);

  if (seed && resolvedDataType?.id) {
    return <FormEditor value={seed}
      height={height}
      width={width}
      docked={docked}
      dataType={resolvedDataType}
      rootId={rootId}
      cancelEditor={handleCancel}
      onSubjectPicked={onSubjectPicked}
      formActionKey={New.key} />;
  }

  return <Loading />;
};

export default ActionRegistry.register(New, {
  kind: ActionKind.collection,
  icon: NewIcon,
  title: 'New',
  crud: [CRUD.create],
  key: 'new'
});
