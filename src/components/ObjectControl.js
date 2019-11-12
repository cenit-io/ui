import DataTypeControl from "./DataTypeControl";

export const FETCHED = Symbol.for('_fetched');

class ObjectControl extends DataTypeControl {

    valueReady() {
        const { rootId, value } = this.props;

        return !rootId || (value && value[FETCHED]);
    };

    isReady() {
        return super.isReady() && this.valueReady();
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
                    const { rootDataType, jsonPath, rootId, onChange, value } = this.props;
                    if (!this.valueReady()) {
                        console.log('Fetching for editing', rootId, jsonPath);
                        rootDataType.shallowGet(rootId, {
                            jsonPath,
                            with_references: true
                        }).then(
                            v => {
                                (v = v || {})[FETCHED] = true;
                                onChange(v);
                            }
                        );
                    }
                });
            });
    }
}

export default ObjectControl;
