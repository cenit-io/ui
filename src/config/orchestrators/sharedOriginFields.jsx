import readOnlyFields from "./readOnlyFields";

export default function (...fields) {
  return readOnlyFields(
    ({ origin }) => origin && origin !== 'default',
    ...fields
  );
}
