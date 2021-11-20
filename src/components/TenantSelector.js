import React  from 'react';
import RecordSelector from "./RecordSelector";
import { useTenantContext } from "../layout/TenantContext";
import TenantTypeSelector from "./TenantTypeSelector";

export default function TenantSelector({ inputClasses, readOnly }) {
    const [tenantState, setTenantState] = useTenantContext();

    const { tenant, loading } = tenantState;

    const handleSelect = selection => setTenantState({ tenant: selection.record });

    return <RecordSelector key={tenant.id}
                           dataTypeSelector={TenantTypeSelector}
                           inputClasses={inputClasses}
                           text={tenant.name}
                           onSelect={handleSelect}
                           disabled={loading}
                           readOnly={readOnly}
                           anchor="right"/>;
}
