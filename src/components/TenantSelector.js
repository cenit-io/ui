import React, { useEffect } from 'react';
import RecordSelector from "./RecordSelector";
import { useSpreadState } from "../common/hooks";
import { useTenantContext } from "../layout/TenantContext";
import TenantTypeSelector from "./TenantTypeSelector";

export default function TenantSelector({ inputClasses, onSelect, readOnly }) {
    const [state, setState] = useSpreadState({
        tenant: { name: 'Loading...' }
    });

    const [tenantState, setTenantState] = useTenantContext();

    const { tenant, loading } = tenantState;

    const handleSelect = selection => setTenantState({ switchingTenant: selection.record });

    return <RecordSelector key={tenant.id}
                           dataTypeSelector={TenantTypeSelector}
                           inputClasses={inputClasses}
                           text={tenant.name}
                           onSelect={handleSelect}
                           disabled={loading}
                           readOnly={readOnly}
                           anchor="right"/>;
}
