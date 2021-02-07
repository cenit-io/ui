import clsx from "clsx";
import React, { useState, useEffect } from "react";
import { useFormObjectValue } from "./FormContext";

export default function JsonViewer({ className, projection }) {

    let value = useFormObjectValue();

    if (projection) {
        value = projection(value);
    }

    return (
        <div className={className}>
                <pre>
                    {JSON.stringify(value, null, 2)}
                </pre>
        </div>
    );
}
