
function spreadReducer(state, newState) {
    if (typeof newState === 'function') {
        newState = newState(state);
    }
    return { ...state, ...newState };
}

export default spreadReducer;
