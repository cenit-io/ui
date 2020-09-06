
function spreadReducer(state, newState) {
    return { ...state, ...newState };
}

export default spreadReducer;
