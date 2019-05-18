import React from 'react';
import {FormControl, IconButton, Input, InputAdornment, InputLabel} from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import Random from "../util/Random";

class StringControl extends React.Component {

    static getDerivedStateFromProps(props, state) {
        const { value } = props;
        if (value !== state.value) {
            return { value, key: Random.string() };
        }
        return null;
    }

    state = {};

    handleChange = e => {
        this.state.value = e.target.value;
        this.props.onChange(e.target.value);
    };

    handleClear = () => {
        this.setState({ key: Random.string() });
        this.props.onDelete();
    };

    setOver = over => () => this.setState({ over });

    render() {
        const { title, value } = this.props,
            { key, over } = this.state;

        return (
            <FormControl>
                <InputLabel>{title}</InputLabel>
                <Input key={key}
                       defaultValue={value}
                       onChange={this.handleChange}
                       onMouseEnter={this.setOver(true)}
                       onMouseLeave={this.setOver(false)}
                       endAdornment={
                           over && value !== undefined &&
                           <InputAdornment position="end">
                               <IconButton onClick={this.handleClear}>
                                   <ClearIcon/>
                               </IconButton>
                           </InputAdornment>
                       }
                />
            </FormControl>
        );
    }
}

export default StringControl;