import React, { useRef } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import SvgIcon from "@material-ui/core/SvgIcon";
import SelectorControl from "../components/SelectorControl";
import { FormRootValue } from "../services/FormValue";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import { Config } from "../common/Symbols";
import { useContainerContext } from "./ContainerContext";
import { makeStyles } from "@material-ui/core";
import Fab from "@material-ui/core/Fab";

export const FilterIcon = ({ fontSize }) => (
    <SvgIcon fontSize={fontSize} component="svg">
        <g xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0h24 M24,24H0" fill="none"/>
            <path
                d="M7,6h10l-5.01,6.3L7,6z M4.25,5.61C6.27,8.2,10,13,10,13v6c0,0.55,0.45,1,1,1h2c0.55,0,1-0.45,1-1v-6 c0,0,3.72-4.8,5.74-7.39C20.25,4.95,19.78,4,18.95,4H5.04C4.21,4,3.74,4.95,4.25,5.61z"/>
            <path d="M0,0h24v24H0V0z" fill="none"/>
        </g>
    </SvgIcon>
);

const useStyles = makeStyles(theme => ({
    filterButton: {
        position: 'absolute',
        right: theme.spacing(3),
        bottom: theme.spacing(3)
    }
}));

const Filter = ({ docked, dataType, onSubjectPicked, height }) => {

    const [containerState, setContainerState] = useContainerContext();

    const classes = useStyles();

    const { selector, landingActionKey } = containerState;

    const value = useRef(new FormRootValue({
        selector: selector
    }));

    const selectorDataType = useRef(DataType.from({
        name: 'Selector',
        schema: {
            type: 'object',
            properties: {
                selector: { type: 'object' }
            }
        },
        [Config]: {
            fields: {
                selector: {
                    control: SelectorControl,
                    controlProps: {
                        dataType: dataType
                    }
                }
            }
        }
    }));

    const handleFilter = () => setContainerState({
        actionKey: landingActionKey,
        page: 1,
        selector: value.current.propertyValue('selector').get()
    });

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={selectorDataType.current}
                        height={height}
                        onSubjectPicked={onSubjectPicked}
                        value={value.current}
                        jsonProjection={({ selector }) => selector}
                        noSubmitButton={true}/>
            <Fab aria-label="filter"
                 color="primary"
                 className={classes.filterButton}
                 onClick={handleFilter}>
                <FilterIcon/>
            </Fab>
        </div>
    );
};

export default ActionRegistry.register(Filter, {
    kind: ActionKind.collection,
    icon: FilterIcon,
    title: 'Filter'
});
