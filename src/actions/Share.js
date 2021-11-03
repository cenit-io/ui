import React, { useRef, useEffect } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import { switchMap } from "rxjs/operators";
import ShareIcon from "@material-ui/icons/Share";
import { FormRootValue } from "../services/FormValue";
import { of } from "rxjs";
import { ExecutionMonitor } from "./ExecutionMonitor";
import { useContainerContext } from './ContainerContext';

const Share = ({ docked, record, onSubjectPicked, height }) => {

    const containerContext = useContainerContext();
    const [, setContainerState] = containerContext;

    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Share" });
  
        return () => {
          setContainerState({ breadcrumbActionName: null });
        };
      }, []);

    const value = useRef(new FormRootValue({
        collection: {
            id: record.id,
            _reference: true
        }
    }));

    const formDataType = useRef(DataType.from({
        name: 'Share',
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string'
                },
                title: {
                    type: 'string'
                },
                summary: {
                    type: 'string'
                },
                pull_parameters: {
                    type: 'array',
                    items: {
                        $ref: {
                            name: 'CrossCollectionPullParameter',
                            namespace: 'Setup'
                        }
                    }
                }

            }
        }
    }));
    

    const handleFormSubmit = (_, value) => {
        const { name, summary, collection } = value.get();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!name) {
                    error = { name: ['is required'] };
                }
                if (!summary) {
                    error = {  ...error, summary: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }
                const shareData = { ...value.cache };
                delete shareData.collection;
                return API.post('setup', 'collection', collection.id, 'digest', 'share', shareData);
            })
        );
    };

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<ShareIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={ExecutionMonitor}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(Share, {
    kind: ActionKind.member,
    arity: 1,
    icon: ShareIcon,
    title: 'Share',
    onlyFor: [{
        "namespace": "Setup",
        "name": "Collection"
    }]
});
