import React, { useEffect, useReducer } from 'react';
import API from "../services/ApiService";
import RecordSelector from "./RecordSelector";
import spreadReducer from "../common/spreadReducer";

const TenantTypeSelector = { namespace: '""', name: 'Account' };

function TenantSelector({ inputClasses, onSelect, readOnly }) {
    const [state, setState] = useReducer(spreadReducer, {
        tenant: { name: 'Loading...' },
        disabled: true
    });

    const { tenant, selection, disabled } = state;

    useEffect(() => {
        const subscription = API.get('setup', 'user', 'me').subscribe(
            user => {
                if (user) {
                    setState({ tenant: user.account, disabled: false });
                    onSelect && onSelect(user.account);
                }
            }
        );
        return () => subscription && subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (selection && selection.record.id !== tenant.id) {
            setState({ tenant: selection.record, disabled: true });

            const subscription = API.post('setup', 'user', 'me', {
                account: {
                    id: selection.record.id
                }
            }).subscribe(() => {
                setState({ disabled: false, selection: null });
                onSelect && onSelect(selection.record);
            });

            return () => subscription && subscription.unsubscribe();
        }
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
