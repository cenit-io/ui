import React, { useEffect } from 'react';
import RecordSelector from "./RecordSelector";
import { useSpreadState } from "../common/hooks";
import { useTenantContext } from "../layout/TenantContext";

export const TenantTypeSelector = { namespace: '', name: 'Account' };

export default function TenantSelector({ inputClasses, onSelect, readOnly }) {
    const [state, setState] = useSpreadState({
        tenant: { name: 'Loading...' }
    });

    const [tenant, switchTenant, loading] = useTenantContext();

    const handleSelect = selection => switchTenant(selection.record);

    return <RecordSelector key={tenant.id}
                           dataTypeSelector={TenantTypeSelector}
                           inputClasses={inputClasses}
                           text={tenant.name}
                           onSelect={handleSelect}
                           disabled={loading}
                           readOnly={readOnly}
                           anchor="right"/>;
}
