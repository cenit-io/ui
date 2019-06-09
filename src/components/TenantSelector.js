import React, {useState} from 'react';
import API from "../services/ApiService";
import RecordSelector from "./RecordSelector";

const TenantTypeSelector = { namespace: null, name: 'Account' };

const TenantSelector = ({ inputClasses }) => {
    const [tenant, setTenant] = useState({ name: 'Loading...', fetchCurrentTenant: true });

    function handleSelect(selection) {
        setTenant({ name: selection.record.name, disabled: true });
        API.post('setup', 'user', 'me', {
            account: {
                id: selection.record.id
            }
        }).then(() => setTenant(selection.record));
    }

    if (tenant.fetchCurrentTenant) {
        API.get('setup', 'user', 'me').then(user => setTenant(user.account));
    }

    return <RecordSelector dataTypeSelector={TenantTypeSelector}
                           inputClasses={inputClasses}
                           text={tenant.name}
                           onSelect={handleSelect}
                           disabled={tenant.disabled}/>;
};

export default TenantSelector;