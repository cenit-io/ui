export function preprocess(config: any): any {
    let configFields = config.fields;
    if (!configFields) {
        config.fields = configFields = {};
    }
    Object.keys(config.groups || {}).forEach(
        group => {
            const groupConfig = config.groups[group];
            (groupConfig.fields || []).forEach(
                (fieldName: string) => {
                    let fieldConfig = configFields[fieldName];
                    if (!fieldConfig) {
                        configFields[fieldName] = fieldConfig = {};
                    }
                    fieldConfig.group = group;
                }
            );
        }
    );
    return config;
}
