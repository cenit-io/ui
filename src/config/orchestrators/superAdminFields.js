import readOnlyFields from "./readOnlyFields";
import { isSuperAdmin } from "../../layout/TenantContext";

export default function (...fields) {
  return readOnlyFields(
    (_0, _1, user) => !isSuperAdmin(user),
    ...fields
  );
}
