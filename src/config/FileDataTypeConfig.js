import React from "react";
import FileFilledIcon from "../icons/FileFilledIcon";
import FileSizeViewer from "../viewers/FileSizeViewer";

export default {
    icon: <FileFilledIcon/>,
    actions: {
        index: {
            fields: ['filename', 'contentType', 'length', 'uploadDate', 'md5']
        }
    },
    fields: {
        filename: {
            title: 'File name'
        },
        contentType: {
            title: 'Content type'
        },
        length: {
            title: 'Size',
            viewer: FileSizeViewer
        },
        md5: {
            title: 'MD5'
        }
    }
}
