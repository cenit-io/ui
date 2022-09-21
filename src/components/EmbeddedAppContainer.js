import React, { useEffect } from 'react';
import Loading from "./Loading";
import EmbeddedAppService from "../services/EnbeddedAppService";
import { useSpreadState } from "../common/hooks";
import Alert from "../actions/Alert";
import EmbeddedApp from "./EmbeddedApp";

export default function EmbeddedAppContainer({ subject, height, width }) {

  const [state, setState] = useSpreadState();

  const { app } = state;

  useEffect(() => {
    const subscription = EmbeddedAppService.getById(subject.id).subscribe(
      app => {
        if (app) {
          subject.computeTitle(app);
          setState({ app });
        } else {
          setState({ app: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [subject]);

  if (app === false) {
    return <Alert title="Not found" message="This app is not available" />;
  }

  if (!app) {
    return <Loading />;
  }

  return (
    <EmbeddedApp url={app.url} height={height} width={width} />
  );
}
