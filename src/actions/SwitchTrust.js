import ActionRegistry, { ActionKind } from "./ActionRegistry";
import API from "../services/ApiService";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";
import { useContainerContext } from "./ContainerContext";
import React from "react";
import TrustIcon from "@material-ui/icons/Security";
import UntrustIcon from "@material-ui/icons/NotInterested";

const TrustTitle = 'Trust';
const UntrustTitle = 'Untrust';

function contextTitle({ selectedItems }) {
  if (selectedItems[0]?.trusted) {
    return UntrustTitle;
  }

  return TrustTitle;
}

function SwitchTrust({ record, containerContext }) {

  const title = contextTitle(containerContext[0]);

  let message = title === TrustTitle
    ? `The application ${record.name} will become TRUSTED`
    : `The application ${record.name} will no longer trusted`;

  return containerContext.confirm({
    title: `${title} confirmation`,
    message
  }).pipe(
    switchMap(ok => {
      if (ok) {
        return API.get('cenit', 'application_id', record.id, 'digest', 'switch_trust');
      }
      return of(false);
    })
  );
}

function SwitchTrustIcon() {
  const [containerState] = useContainerContext();

  const title = contextTitle(containerState);

  if (title === TrustTitle) {
    return <TrustIcon />;
  }

  return <UntrustIcon />;
}

export default ActionRegistry.register(SwitchTrust, {
  kind: ActionKind.member,
  arity: 1,
  icon: SwitchTrustIcon,
  title: contextTitle,
  executable: true,
  onlyFor: [{ namespace: 'Cenit', name: 'ApplicationId' }]
});
