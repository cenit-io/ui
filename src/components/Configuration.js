import React from 'react';
import FormEditor from "./FormEditor";

export default function Configuration({ dataType, height, width, docked, onSubjectPicked }) {
    return <FormEditor value={{ id: 'this' }}
                       height={height}
                       width={width}
                       docked={docked}
                       dataType={dataType}
                       onSubjectPicked={onSubjectPicked}/>;
}
