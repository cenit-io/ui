import DataTypeControl from "./DataTypeControl";

class ObjectControl extends DataTypeControl {

    isReady() {
        return super.isReady() && (
            !this.props.edit || this.state.valueFetched
        );
    }

    schemaReady() {
        this.getDataType().visibleProps()
            .then(props => {
                Promise.all(
                    props.map(
                        prop => {
                            if (prop)
                                return new Promise(
                                    (resolve, reject) => {
                                        Promise.all([prop.isReferenced(), prop.isMany(), prop.getSchema()])
                                            .then(
                                                fullfill => {
                                                    if (fullfill[0]) { // Referenced
                                                        if (fullfill[1]) { // Many
                                                            prop.type = 'refMany';
                                                        } else { // One
                                                            prop.type = 'refOne';
                                                        }
                                                    } else {
                                                        const schema = fullfill[2];
                                                        prop.type = schema['type'];
                                                    }
                                                    resolve(prop);
                                                }
                                            )
                                            .catch(error => reject(error));
                                    }
                                );
                            return Promise.resolve(prop);
                        }
                    )
                ).then(props => {
                    this.resolveProperties(props);
                    const { rootDataType, jsonPath, edit, value, onChange } = this.props;
                    if (edit) {
                        rootDataType.get(value.id, { jsonPath }).then(
                            v => {
                                onChange(v);
                                this.setState({ valueFetched: true });
                            }
                        );
                    }
                });
            });
    }
}

export default ObjectControl;
