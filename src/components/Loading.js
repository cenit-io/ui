import React from 'react';
import {CircularProgress} from "@material-ui/core";

export default function ({height}) {
    return <div style={{
        width: '100%',
        height: height || '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }}>
        <CircularProgress/>
    </div>
}