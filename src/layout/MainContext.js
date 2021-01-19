import React, { useContext, useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import FrezzerLoader from "../components/FrezzerLoader";
import AuthorizationService from "../services/AuthorizationService";

const MC = React.createContext({});


export function useMainContext() {
    return useContext(MC);
}

export default function MainContext({ children }) {
    const contextState = useSpreadState({
        docked: localStorage.getItem('docked') !== 'false'
    });

    const [state, setState] = contextState;

    const { idToken } = state;

    useEffect(() => {
        const subscription = AuthorizationService.getIdToken().subscribe(
            idToken => setState({ idToken })
        );
        return () => subscription.unsubscribe();
    }, []);

    return (
        <MC.Provider value={contextState}>
            <div className="flex relative full-v-height full-v-width">
                {idToken ? children : <FrezzerLoader/>}
            </div>
        </MC.Provider>
    );
}
