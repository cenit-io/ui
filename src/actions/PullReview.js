import React, { useEffect, useRef } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import Button from "@material-ui/core/Button";
import { CircularProgress, LinearProgress, makeStyles } from "@material-ui/core";
import ResponsiveContainer from "../components/ResponsiveContainer";
import SvgIcon from "@material-ui/core/SvgIcon";
import { useContainerContext } from "./ContainerContext";
import { of } from "rxjs";
import AuthorizationService from "../services/AuthorizationService";
import { useSpreadState } from "../common/hooks";
import Random from "../util/Random";
import InfoAlert from "./InfoAlert";
import ScheduleIcon from '@material-ui/icons/Schedule';
import Collapsible from "../components/Collapsible";
import { DataType } from "../services/DataTypeService";
import { switchMap, map, tap } from "rxjs/operators";
import zzip from "../util/zzip";
import Skeleton from "@material-ui/lab/Skeleton";
import Chip from "@material-ui/core/Chip";
import * as pluralize from "pluralize";
import SuccessAlert from "./SuccessAlert";
import { RecordSubject, TabsSubject } from "../services/subjects";
import FrezzerLoader from "../components/FrezzerLoader";
import FormEditor from "../components/FormEditor";
import { FormRootValue } from "../services/FormValue";
import API from "../services/ApiService";
import { Config } from "../common/Symbols";
import { underscore } from "../common/strutls";
import Loading from "../components/Loading";

const ReviewIcon = () => (
    <SvgIcon>
        <path xmlns="http://www.w3.org/2000/svg"
              d="M4,7h16v2H4V7z M4,13h16v-2H4V13z M4,17h7v-2H4V17z M4,21h7v-2H4V21z M15.41,18.17L14,16.75l-1.41,1.41L15.41,21L20,16.42 L18.58,15L15.41,18.17z M4,3v2h16V3H4z"/>
    </SvgIcon>
);

const useStyles = makeStyles(theme => ({
    margin: {
        margin: theme.spacing(1)
    }
}));

function SuccessPull() {
    return (
        <SuccessAlert mainIcon={ReviewIcon}/>
    );
}

const MaxRecordsViews = 25;

function RecordsView({ entry, records, collectionDataType }) {
    const [state, setState] = useSpreadState();

    const { dataType, dataTypeTitle, recordsTitles, openingId } = state;

    const classes = useStyles();

    useEffect(() => {
        const subscription = (entry === 'collections'
                ? of(collectionDataType)
                : collectionDataType.getProperty(entry).pipe(
                    map(property => property.dataType)
                )
        ).pipe(
            switchMap(dataType => zzip(
                of(dataType),
                dataType.getTitle(),
                dataType.titlesFor(...records.slice(0, Math.min(MaxRecordsViews, records.length)))
                )
            )
        ).subscribe(
            ([dataType, dataTypeTitle, recordsTitles]) => setState({ dataType, dataTypeTitle, recordsTitles })
        );

        return () => subscription.unsubscribe()
    }, [entry, records]);

    useEffect(() => {
        if (openingId) {
            const subscription = dataType.get(openingId, {
                viewport: '{_type}'
            }).pipe(
                switchMap(({ _type }) => (
                    ((!_type || _type === dataType.type_name()) && of(dataType)) ||
                    dataType.findByName(_type)
                ))
            ).subscribe(recordDataType => {
                    TabsSubject.next(
                        RecordSubject.for(recordDataType.id, openingId).key
                    );
                    setState({ openingId: null });
                }
            );

            return () => subscription.unsubscribe();
        }
    }, [openingId, dataType]);

    if (dataType) {
        const open = record => () => setState({ openingId: record.id });

        const recordsChips = recordsTitles.map((title, index) => {
            const record = records[index];
            if (record.id) {
                return <Chip key={`item_${index}`}
                             className={classes.margin}
                             label={title}
                             variant="outlined"
                             color="primary"
                             onClick={open(record)}/>;
            }

            return <Chip key={`item_${index}`}
                         className={classes.margin}
                         label={title}/>;
        });

        if (recordsTitles.length < records.length) {
            recordsChips.push(
                <Chip key="and_more_items"
                      className={classes.margin}
                      variant="outlined"
                      label={`... and ${records.length - recordsTitles.length} more`}/>
            )
        }

        return (
            <div className="relative">
                <Collapsible title={`${pluralize(dataTypeTitle, records.length)} (${records.length})`}
                             variant="subtitle1">
                    {recordsChips}
                    {openingId && <FrezzerLoader/>}
                </Collapsible>
            </div>
        );
    }

    return <Skeleton variant="rect"/>;
}

function PullCheck(props) {

    const [state, setState] = useSpreadState();

    const { refreshKey, viewport, refreshing } = state;

    const [containerState, setContainerState] = useContainerContext();

    const { pull_data, record, collectionDataType, dataType, dirty } = containerState;

    useEffect(() => {
        if (!collectionDataType) {
            const subscription = DataType.find({
                namespace: 'Setup',
                name: 'Collection'
            }).subscribe(
                collectionDataType => setContainerState({ collectionDataType })
            );

            return () => subscription.unsubscribe();
        }
    }, [collectionDataType]);

    useEffect(() => {
        let viewport = {
            status: true,
            data: true,
            pull_request: true,
            pulled_request: true
        };
        Object.keys(record).forEach(key => viewport[key] = true);
        viewport = Object.keys(viewport).sort();
        viewport = `{${viewport.join(' ')}}`;
        setState({ viewport });
    }, [record]);

    useEffect(() => {
        if (refreshKey || dirty) {
            setState({ refreshing: true });
            const subscription = dataType.get(record.id, { viewport }).subscribe(
                record => {
                    setState({ refreshing: false, dirty: false });
                    setContainerState({ record });
                }
            );

            return () => subscription.unsubscribe();
        }
    }, [dataType, record.id, viewport, refreshKey, dirty]);

    useEffect(() => {
        if (record.pull_request?.url) {
            const subscription = AuthorizationService.request({
                url: record.pull_request.url,
                method: 'GET'
            }).subscribe(
                pull_data => setContainerState({ pull_data })
            );

            return () => subscription.unsubscribe();
        }
    }, [record.pull_request?.url]);

    const refresh = () => setState({ refreshKey: Random.string() });

    if (record.pull_request?.url) {
        if (collectionDataType && pull_data) {
            return <PullForm {...props}/>;
        }

        return <LinearProgress className='full-width'/>;
    }

    let refreshAction;
    if (refreshing) {
        refreshAction = <CircularProgress/>;
    } else {
        refreshAction = (
            <Button onClick={refresh} variant="outlined" color="primary">
                Check
            </Button>
        );
    }

    return (
        <InfoAlert mainIcon={ScheduleIcon}
                   message="Waiting for the pull import to be processed">
            {refreshAction}
        </InfoAlert>
    );
}

function PullState() {

    const [containerState] = useContainerContext();

    const { pull_data, collectionDataType } = containerState;

    let c = 0;
    let newRecords = Object.keys(pull_data.new_records).map(
        entry => {
            c += pull_data.new_records[entry].length;
            return <RecordsView key={`new_${entry}`}
                                collectionDataType={collectionDataType}
                                entry={entry}
                                records={pull_data.new_records[entry]}/>
        }
    );
    if (newRecords.length) {
        newRecords = (
            <Collapsible title={`${c} records will be created`}
                         defaultCollapsed={false}>
                {newRecords}
            </Collapsible>
        )
    } else {
        newRecords = null;
    }
    c = 0;
    let updatedRecords = Object.keys(pull_data.updated_records).map(
        entry => {
            const records = pull_data.updated_records[entry].map(id => ({ id }));
            c += records.length;
            return <RecordsView key={`updated_${entry}`}
                                collectionDataType={collectionDataType}
                                entry={entry}
                                records={records}/>
        }
    );
    if (updatedRecords.length) {
        updatedRecords = (
            <Collapsible title={`${c} records will be updated`}
                         defaultCollapsed={false}>
                {updatedRecords}
            </Collapsible>
        )
    } else {
        updatedRecords = null;
    }

    return (
        <div className="full-width">
            {newRecords}
            {updatedRecords}
        </div>
    );
}

export function pullParametersSchema(pull_parameters) {
    const properties = {};
    const requiredProperties = [];
    const schema = { type: 'object', properties, required: requiredProperties };
    pull_parameters.forEach(({ id, label, type, many, required, description }) => {
        const propertySchema = properties[id] = { label, description };
        if (many) {
            propertySchema.type = 'array';
            if (type) {
                propertySchema.items = { type }
            }
        } else if (type) {
            propertySchema.type = type;
        }
        if (required) {
            requiredProperties.push(id);
        }
    });
    if (!requiredProperties.length) {
        delete schema.required;
    }
    return schema;
}

function PullForm({ docked, dataType, onSubjectPicked, height }) {

    const [state, setState] = useSpreadState();

    const { pull_parameters, formDataType } = state;

    const [containerState, setContainerState] = useContainerContext();

    const { pull_data, record, collectionDataType } = containerState;

    const value = useRef(new FormRootValue({
        ...pull_data.pull_parameters
    }));

    const shared_collection_id = record.shared_collection?.id;

    useEffect(() => {
        const subscription = (
            shared_collection_id
                ? API.get('setup', 'cross_shared_collection', shared_collection_id, { viewport: '{pull_parameters}' })
                : of({ pull_parameters: [] })
        ).subscribe(({ pull_parameters }) => {
            const schema = pullParametersSchema(pull_parameters);
            schema.properties.state = {};
            const formDataType = DataType.from({
                name: 'Pull Review',
                schema,
                [Config]: {
                    fields: {
                        ...pull_parameters.reduce((config, p) => {
                            config[p.id] = { readOnly: true };
                            return config;
                        }, {}),
                        state: {
                            control: PullState
                        }
                    }
                }
            });

            setState({ pull_parameters, formDataType });
        })

    }, [shared_collection_id]);

    const handleFormSubmit = (_, formValue) => {
        const value = formValue.get();
        const pp = {};
        pull_parameters.forEach(({ id }) => pp[id] = value[id]);
        const formData = { pull_parameters: pp };
        const slug = underscore(dataType.name);
        return API.post('setup', slug, record.id, 'digest', 'pull', formData).pipe(
            tap(() => setContainerState({ dirty: true }))
        );
    };

    if (Object.keys(pull_data.new_records).length + Object.keys(pull_data.updated_records).length) {
        if (formDataType) {
            return <FormEditor docked={docked}
                               dataType={formDataType}
                               height={height}
                               submitIcon={<ReviewIcon/>}
                               onFormSubmit={handleFormSubmit}
                               onSubjectPicked={onSubjectPicked}
                               successControl={SuccessPull}
                               value={value.current}/>;
        }
        return <Loading/>;
    }

    return (
        <ResponsiveContainer>
            <SuccessAlert title="Nothing to pull"
                          message="No changes detected in this data pull"
                          mainIcon={ReviewIcon}/>
        </ResponsiveContainer>
    );
}

const PullReview = (props) => {

    const [containerState] = useContainerContext();

    const { record } = containerState;

    if (record.pulled_request?.url) {
        return <SuccessAlert mainIcon={ReviewIcon}
                             title="Completed"
                             message="This pull import is already completed"/>;
        // TODO Retry already completed pull import
    }

    return <PullCheck {...props}/>;
};

export default ActionRegistry.register(PullReview, {
    kind: ActionKind.member,
    icon: ReviewIcon,
    arity: 1,
    title: 'Review',
    onlyFor: [
        { namespace: 'Setup', name: 'PullImport' },
        { namespace: 'Setup', name: 'SharedCollectionPull' }
    ]
});
