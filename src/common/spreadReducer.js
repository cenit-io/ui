
function spreadReducer(state, newState) {
    if (typeof newState === 'function') {
        newState = newState(state);
    }
    return (newState && { ...state, ...newState }) || state;
}

export default spreadReducer;
