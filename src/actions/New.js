import React from 'react';
import NewIcon from '@material-ui/icons/Add';
import ObjectControl from "../components/ObjectControl";
import FormTest from "../components/FormTest";

class New extends React.Component {

    static Icon = NewIcon;

    static title = 'New';

    render() {

        const { dataType, height } = this.props;

        return <FormTest dataType={dataType} height={height}/>;
    }
}

export default New;