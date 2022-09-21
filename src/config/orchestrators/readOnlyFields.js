export default function (isReadOnly, ...fields) {
  return function orchestrator(value, state, _, { readOnly, user }) {
    const newState = {};
    fields.forEach(field => {
      const disabled = !readOnly && Boolean(isReadOnly(value, field, user));
      const current = Boolean(state[field]?.disabled);
      if (disabled !== current) {
        newState[field] = { disabled };
      }
    });
    if (Object.keys(newState).length) {
      return newState;
    }
  }
}
