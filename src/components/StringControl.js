import React from 'react';
import {FormControl, IconButton, Input, InputAdornment, InputLabel} from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import Random from "../util/Random";
import FilledInput from "@material-ui/core/FilledInput";

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
        const { title, value, errors } = this.props;
        const { key, over } = this.state;

        const error = Boolean(errors && errors.length);

        return (
            <FormControl variant="filled">
                <InputLabel>{title}</InputLabel>
                <FilledInput key={key}
                       error={error}
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
                       variant='filled'
                />
            </FormControl>
        );
    }
}

export default StringControl;
