import React, { useRef } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import { FormRootValue } from "../services/FormValue";
import { of } from "rxjs";
import { switchMap } from "rxjs/operators";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ExecutionMonitor } from "./ExecutionMonitor";
import { useTenantContext } from "../layout/TenantContext";
import { Config } from "../common/Symbols";

const PushIcon = () => (
    <SvgIcon style={{ display: 'block', transform: 'rotate(180deg)' }}>
        <path
            d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
    </SvgIcon>
);

const PushCollection = ({ docked, record, onSubjectPicked, height }) => {

    const value = useRef(new FormRootValue({
        collection: {
            id: record.id,
            _reference: true
        }
    }));

    const [tenantState] = useTenantContext();

    const { user } = tenantState;

    const userRoles = user.roles || [];

    const isSuperUser = user.super_admin_enabled && !!userRoles.find(({ name }) => name === 'super_admin');

    const formDataType = useRef(DataType.from({
        name: 'Push',
        schema: {
            type: 'object',
            properties: {
                shared_collection: {
                    referenced: true,
                    $ref: {
                        namespace: 'Setup',
                        name: 'CrossSharedCollection',
                    }
                }
            }
        },
        [Config]: {
            fields: {
                shared_collection: {
                    selector: isSuperUser ? {} : { origin: 'owner' }
                }
            }
        }
    }));

    const handleFormSubmit = (_, value) => {
        const { shared_collection } = value.get();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!shared_collection?.id) {
                    error = { shared_collection: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }
                return API.post('setup', 'collection', record.id, 'digest', 'push', {
                    shared_collection_id: shared_collection.id
                });
            })
        );
    };

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<PushIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={ExecutionMonitor}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(PushCollection, {
    kind: ActionKind.member,
    arity: 1,
    icon: PushIcon,
    title: 'Push',
    onlyFor: [{ namespace: 'Setup', name: 'Collection' }]
});
