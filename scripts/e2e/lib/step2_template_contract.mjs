export const buildDataTypeDigestPath = (dataTypeId) => `/api/v3/setup/data_type/${dataTypeId}/digest`;

export const matchesDataTypeDigestPost = ({ method, url }, dataTypeId) =>
    method === 'POST' &&
    typeof url === 'string' &&
    url.includes(buildDataTypeDigestPath(dataTypeId));
