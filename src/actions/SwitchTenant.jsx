import ActionRegistry, { ActionKind } from "./ActionRegistry";
import TenantIcon from "@mui/icons-material/Home";
import TenantTypeSelector from "../components/TenantTypeSelector";

function SwitchTenant({ record, tenantContext }) {
  const [tenantState, setTenantState] = tenantContext;

  const { tenant } = tenantState;
  if (tenant.id !== record.id) {
    setTenantState({ tenant: record });
  }
}

export default ActionRegistry.register(SwitchTenant, {
  kind: ActionKind.member,
  icon: TenantIcon,
  title: 'Switch',
  executable: true,
  arity: 1,
  onlyFor: [TenantTypeSelector],
  group: 5
});
