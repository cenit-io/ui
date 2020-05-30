import React, { useEffect, useReducer, useState } from 'react';
import API from "../services/ApiService";
import RecordSelector from "./RecordSelector";
import reducer from "../common/reducer";

const TenantTypeSelector = { namespace: '""', name: 'Account' };

function TenantSelector({ inputClasses, onSelect, readOnly }) {
    const [state, setState] = useReducer(reducer, {
        tenant: { name: 'Loading...' }
    });

    const { tenant, selection, disabled } = state;

    const selectTenant = tenant => {
        setState({ tenant });
        onSelect(tenant);
    };

    useEffect(() => {
        const subscription = API.get('setup', 'user', 'me').subscribe(
            user => user && selectTenant(user.account)
        );
        return () => subscription && subscription.unsubscribe();
    }, [tenant]);

    useEffect(() => {
        let subscription;
        if (selection) {
            setState({ tenant: selection.record, disabled: true });
            subscription = API.post('setup', 'user', 'me', {
                account: {
                    id: selection.record.id
                }
            }).subscribe(() => setState({ disabled: false }));
        }
        return () => subscription && subscription.unsubscribe();
    }, [selection]);

    const handleSelect = selection => setState({ selection });

    return <RecordSelector dataTypeSelector={TenantTypeSelector}
                           inputClasses={inputClasses}
                           text={tenant.name}
                           onSelect={handleSelect}
                           disabled={disabled}
                           readOnly={readOnly}
                           anchor="right"/>;
}

export default TenantSelector;
