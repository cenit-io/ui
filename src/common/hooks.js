import { useReducer } from 'react';
import spreadReducer from './spreadReducer';

export function useSpreadState(initialState = {}) {
    return useReducer(spreadReducer, initialState);
}
