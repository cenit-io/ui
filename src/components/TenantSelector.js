import React, { useEffect, useState } from 'react';
import API from "../services/ApiService";
import RecordSelector from "./RecordSelector";

const TenantTypeSelector = { namespace: '""', name: 'Account' };

const TenantSelector = ({ inputClasses, onSelect, readOnly }) => {
    const [tenant, setTenant] = useState({ name: 'Loading...', fetchCurrentTenant: true });
    const [selection, setSelection] = useState(null);

    useEffect(() => {
        let subscription;
        if (selection) {
            setTenant({ name: selection.record.name, disabled: true });
            subscription = API.post('setup', 'user', 'me', {
                account: {
                    id: selection.record.id
                }
            }).subscribe(() => selectTenant(selection.record));
        }
        return () => subscription && subscription.unsubscribe();
    }, [selection]);

    useEffect(() => {
        let subscription;
        if (tenant.fetchCurrentTenant) {
            subscription = API.get('setup', 'user', 'me').subscribe(
                user => user && selectTenant(user.account)
            );
        }
        return () => subscription && subscription.unsubscribe();
    }, [tenant]);

    const handleSelect = selection => setSelection(selection);

    const selectTenant = tenant => {
        setTenant(tenant);
        onSelect(tenant);
    };

    return <RecordSelector dataTypeSelector={TenantTypeSelector}
                           inputClasses={inputClasses}
                           text={tenant.name}
                           onSelect={handleSelect}
                           disabled={tenant.disabled}
                           readOnly={readOnly}
                           anchor="right"/>;
};

export default TenantSelector;
