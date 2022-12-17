import React, { useEffect } from "react";
import { useFormObjectValue } from "./FormContext";
import { useSpreadState } from "../common/hooks";
import Loading from "./Loading";

export default function JsonViewer({ className, projection }) {

  const value = useFormObjectValue();
  const [state, setState] = useSpreadState({ record: {}, loaded: false });
  const { record, loaded } = state;

  useEffect(() => {
    if (projection) {
      const subscription = projection(value).subscribe((record) => setState({ record, loaded: true }));
      return () => subscription.unsubscribe();
    } else {
      setState({ record: value, loaded: true });
    }
  }, [value]);

  return (
    <div className={className}>
      {loaded ? <pre>{JSON.stringify(record, null, 2)}</pre> : <Loading/>}
    </div>
  );
}
