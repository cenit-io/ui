import React, { useContext, useState, useEffect, useCallback } from 'react';
import { debounce } from "rxjs/operators";
import { interval } from "rxjs";
import { useSpreadState } from "../common/hooks";

const CC = React.createContext({});


export function useContainerContext() {
    return useContext(CC);
}

export default function ContainerContext({ initialState, children }) {
    const value = useSpreadState(initialState);

    return (
        <CC.Provider value={value}>
            {children}
        </CC.Provider>
    );
}
