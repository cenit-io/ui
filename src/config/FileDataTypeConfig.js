import React from "react";
import FileFilledIcon from "../icons/FileFilledIcon";

export default {
    icon: <FileFilledIcon/>,
    actions: {
        index: {
            fields: ['filename', 'contentType', 'length', 'uploadDate', 'md5']
        }
    }
}
