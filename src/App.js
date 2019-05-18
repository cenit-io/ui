import React from 'react';
import ObjectControl from "./components/ObjectControl";
import {Button} from "@material-ui/core";

function App() {

    const value = {
        name: 'Mac',
        checked: true,
        ref_b: { "id": "5ceca28c6ecd7911b900000f" },
        many_ref_bs: [
            { "id": "5ceca28c6ecd7911b900000f" },
            { "id": "5ceca28c6ecd7911b900000f" }
        ],
        many_embedded_bs: [
            { color: 'red' },
            { color: 'blue' }
        ]
    };

    return (
        <div>
            <ObjectControl dataTypeId='5ce187236ecd791e40000017' value={value}/>
            <Button onClick={() => console.log(JSON.stringify(value, null, 2))}>Submit</Button>
        </div>
    );
}

export default App;