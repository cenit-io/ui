import React, {useState} from 'react';
import {IconButton, Tab, Tabs, TextField} from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ClearIcon from '@material-ui/icons/Clear';
import ObjectControl from "./ObjectControl";
import {Property} from "../services/DataTypeService";
import './EmbedsManyControl.css'

function EmbedsManyControl({ title, value, property, onDelete, onChange, schema, width }) {

    const [open, setOpen] = useState(false),

        [selectedIndex, setSelectedIndex] = useState(0),

        addNew = () => {
            if (value) {
                value.push({});
            } else {
                value = [];
            }
            onChange(value);
            setSelectedIndex(value.length - 1);
            if (value.length > 0) {
                setOpen(true);
            }
        },

        deleteSelected = () => {
            value.splice(selectedIndex, 1);
            onChange(value);
            if (value.length === 0) {
                setOpen(false);
            } else if (value.length === selectedIndex) {
                setSelectedIndex(selectedIndex - 1);
            }
        },

        seek = (x) => () => {
            let tmp = value[selectedIndex];
            value[selectedIndex] = value[selectedIndex + x];
            value[selectedIndex + x] = tmp;
            setSelectedIndex(selectedIndex + x);
            onChange(value);
        },

        handleChange = item => {
            value[selectedIndex] = item;
            onChange(value);
        };

    let dropButton, deleteButton, tabs, tabContainer;

    if (value) {
        if (open) {
            dropButton = value.length > 0 && <IconButton onClick={() => setOpen(false)}><ArrowDropUpIcon/></IconButton>;
            if (value.length > 0) {
                tabs = value.map((item, index) => <Tab label={`${index}`} key={index}/>);
                tabs = <Tabs value={selectedIndex}
                             variant='scrollable'
                             scrollButtons='auto'
                             onChange={(_, index) => setSelectedIndex(index)}>
                    {tabs}
                </Tabs>;
                const controlProperty = new Property();
                controlProperty.name = selectedIndex;
                controlProperty.dataType = property.dataType;
                controlProperty.propertySchema = schema;
                tabContainer = (
                    <div className='tab-container' style={{width: `calc(${width})`}}>
                        {tabs}
                        <div className='tab-container-ctrl'>
                            <div className='tab-container-actions'>
                                <IconButton onClick={deleteSelected}><ClearIcon/></IconButton>
                                {selectedIndex > 0 && <IconButton onClick={seek(-1)}><ArrowBackIcon/></IconButton>}
                                {(selectedIndex < value.length - 1) &&
                                <IconButton onClick={seek(1)}><ArrowForwardIcon/></IconButton>}
                            </div>
                            <ObjectControl property={controlProperty}
                                           value={value[selectedIndex]}
                                           onChange={handleChange}/>
                        </div>
                    </div>
                );
            }
        } else {
            dropButton = value.length > 0 &&
                <IconButton onClick={() => setOpen(true)}><ArrowDropDownIcon/></IconButton>;
        }
        deleteButton = <IconButton onClick={onDelete}><ClearIcon/></IconButton>;
    }

    const AddNewIcon = value ? AddIcon : CreateIcon;

    return (
        <div>
            <TextField label={title} disabled={true}/>
            {dropButton}
            <IconButton onClick={addNew}><AddNewIcon/></IconButton>
            {deleteButton}
            {tabContainer}
        </div>
    );
}

export default EmbedsManyControl;