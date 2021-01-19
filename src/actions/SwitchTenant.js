import ActionRegistry, { ActionKind } from "./ActionRegistry";
import TenantIcon from "@material-ui/icons/Home";
import { TenantTypeSelector } from "../components/TenantSelector";

function SwitchTenant({ record, tenantContext }) {
    const [tenant, switchTenant] = tenantContext;
    if (tenant.id !== record.id) {
        switchTenant(record);
    }
}

export default ActionRegistry.register(SwitchTenant, {
    kind: ActionKind.member,
    icon: TenantIcon,
    title: 'Switch',
    executable: true,
    arity: 1,
    onlyFor: [TenantTypeSelector]
});
