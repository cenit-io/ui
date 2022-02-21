import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { switchMap, tap } from "rxjs/operators";
import { of } from "rxjs";
import { useContainerContext } from "./ContainerContext";
import React from "react";
import UnlockIcon from "@material-ui/icons/LockOpenOutlined";
import LockIcon from "@material-ui/icons/LockOutlined";
import SwitchIcon from "@material-ui/icons/SettingsBackupRestoreOutlined";
import EmbeddedAppService from "../services/EnbeddedAppService";
import TenantTypeSelector from "../components/TenantTypeSelector";

const SwitchLockTitle = 'Switch Lock';
const UnlockTitle = 'Unlock';
const LockTitle = 'Lock';

function contextTitle({ record, selectedItems, data }) { // TODO selector
    let items = record ? [record] : selectedItems;
    if (!items.length && data?.total_pages === 1) {
        items = data.items;
    }

    let title;
    if (items.length) {
        let unlocked = 0;
        let locked = 0;
        items.forEach(tenant => {
            if (tenant.locked) {
                locked++;
            } else {
                unlocked++;
            }
        });
        if (unlocked) {
            if (locked) {
                title = SwitchLockTitle;
            } else {
                title = LockTitle;
            }
        } else {
            title = UnlockTitle;
        }
    } else {
        title = SwitchLockTitle;
    }

    return title;
}

function SwitchTenantLock({ selectedItems, record, dataType, containerContext, selector }) {

    selectedItems = record
        ? [record]
        : selectedItems || [];

    if (selectedItems.length) {
        selector = { _id: { $in: selectedItems.map(({ id }) => id) } };
    }

    const title = contextTitle({ selectedItems });
    const action = title === UnlockTitle
        ? 'unlocked'
        : (
            title === LockTitle
                ? 'locked'
                : 'lock switched'
        );

    let message;
    if (record || selectedItems.length === 1) {
        const tenant = record || selectedItems[0];
        message = `The tenant ${tenant.name} will be ${action}.`;
    } else if (selectedItems.length) {
        message = `The ${selectedItems.length} selected tenants will be ${action}.`;
    } else {
        message = `All found tenants will be ${action}`;
    }

    return containerContext.confirm({
        title: title === UnlockTitle
            ? 'Unlock confirmation'
            : (
                title === LockTitle
                    ? 'Lock confirmation'
                    : 'Lock switching confirmation'
            ),
        message
    }).pipe(
        switchMap(ok => {
            if (ok) {
                return dataType.post({
                    id: record.id,
                    locked: !record.locked
                }, {
                    add_only: true
                }).pipe(
                    tap(() => EmbeddedAppService.refreshAll())
                );
            }
            return of(false);
        })
    );
}

function SwitchLockIcon() {
    const [containerState] = useContainerContext();

    const title = contextTitle(containerState);

    if (title === UnlockTitle) {
        return <UnlockIcon component="svg"/>;
    }

    if (title === LockTitle) {
        return <LockIcon  component="svg"/>;
    }

    return <SwitchIcon  component="svg"/>;
}

export default ActionRegistry.register(SwitchTenantLock, {
    key: 'switch_tenant_lock',
    kind: ActionKind.member,
    arity: 1,
    icon: SwitchLockIcon,
    title: contextTitle,
    executable: true,
    onlyFor: [TenantTypeSelector],
    group: 5
});
