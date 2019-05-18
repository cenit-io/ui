import DataTypeControl from "./DataTypeControl";

class ObjectControl extends DataTypeControl {

    schemaReady() {
        this.getDataType().visibleProps()
            .then(props => {
                Promise.all(
                    props.map(
                        prop => new Promise(
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
                        )
                    )
                ).then(props => this.resolveProperties(props));
            });
    }
}

export default ObjectControl;