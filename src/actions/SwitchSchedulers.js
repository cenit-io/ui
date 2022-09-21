import ActionRegistry from "./ActionRegistry";
import API from "../services/ApiService";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";
import { useContainerContext } from "./ContainerContext";
import React from "react";
import ActivateIcon from "@material-ui/icons/PlayCircleFilledOutlined";
import DeactivateIcon from "@material-ui/icons/PowerSettingsNew";
import SwitchIcon from "@material-ui/icons/SettingsBackupRestoreOutlined";

const SwitchActivationTitle = 'Switch Activation';
const ActivateTitle = 'Activate';
const DeactivateTitle = 'Deactivate';

function contextTitle({ selectedItems, data }) { // TODO selector
  let items = selectedItems;
  if (!items.length && data?.total_pages === 1) {
    items = data.items;
  }

  let title;
  if (items.length) {
    let activated = 0;
    let deactivated = 0;
    items.forEach(scheduler => {
      if (scheduler.activated) {
        activated++;
      } else {
        deactivated++;
      }
    });
    if (activated) {
      if (deactivated) {
        title = SwitchActivationTitle;
      } else {
        title = DeactivateTitle;
      }
    } else {
      title = ActivateTitle;
    }
  } else {
    title = SwitchActivationTitle;
  }

  return title;
}

function SwitchSchedulers({ selectedItems, record, dataType, containerContext, selector }) {

  selectedItems = record
    ? [record]
    : selectedItems || [];

  if (selectedItems.length) {
    selector = { _id: { $in: selectedItems.map(({ id }) => id) } };
  }

  const title = contextTitle(containerContext[0]);
  const action = title === ActivateTitle
    ? 'activated'
    : (
      title === DeactivateTitle
        ? 'deactivated'
        : 'switched'
    );

  let message;
  if (record || selectedItems.length === 1) {
    const scheduler = record || selectedItems[0];
    message = `The scheduler ${scheduler.name} will be ${action}.`; // TODO Replace scheduler name by record title
  } else if (selectedItems.length) {
    message = `The ${selectedItems.length} selected schedulers will be ${action}.`;
  } else {
    message = `All found schedulers will be ${action}`;
  }

  return containerContext.confirm({
    title: title === ActivateTitle
      ? 'Activation confirmation'
      : (
        title === DeactivateTitle
          ? 'Deactivation confirmation'
          : 'Activation switching confirmation'
      ),
    message
  }).pipe(
    switchMap(ok => {
      if (ok) {
        return API.get('setup', 'data_type', dataType.id, 'digest', 'switch', {
          headers: {
            'X-Digest-Options': JSON.stringify({ selector })
          }
        });
      }
      return of(false);
    })
  );
}

function SwitchSchedulersIcon() {
  const [containerState] = useContainerContext();

  const title = contextTitle(containerState);

  if (title === ActivateTitle) {
    return <ActivateIcon />;
  }

  if (title === DeactivateTitle) {
    return <DeactivateIcon />;
  }

  return <SwitchIcon />;
}

export default ActionRegistry.register(SwitchSchedulers, {
  bulkable: true,
  icon: SwitchSchedulersIcon,
  title: contextTitle,
  executable: true,
  onlyFor: [{ namespace: 'Setup', name: 'Scheduler' }]
});
