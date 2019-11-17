import DataTypeControl from "./DataTypeControl";
import { map, switchMap } from "rxjs/operators";
import { of } from "rxjs";
import zzip from "../util/zzip";

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
        this.getDataType().visibleProps().pipe(
            switchMap(props =>
                zzip(...props.map(
                    prop => (prop && zzip(prop.isReferenced(), prop.isMany(), prop.getSchema()).pipe(
                            map(
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
                                    return prop;
                                }
                            ))
                    ) || of(prop))
                )
            )
        ).subscribe( //TODO sanitize with unsubscribe
            props => {
                this.resolveProperties(props);
                const { rootDataType, jsonPath, rootId, onChange, value } = this.props;
                if (!this.valueReady()) {
                    this.getDataType().shallowViewPort().pipe(
                        switchMap(viewport => {
                            console.log('Fetching for editing', rootId, jsonPath, viewport);
                            return rootDataType.get(rootId, {
                                viewport,
                                jsonPath,
                                with_references: true
                            });
                        })
                    ).subscribe( //TODO sanitize with unsubscribe
                        v => {
                            (v = v || {})[FETCHED] = true;
                            Object.getOwnPropertySymbols(value).forEach(symbol => v[symbol] = value[symbol]);
                            onChange(v);
                        }
                    );
                }
            });
    }
}

export default ObjectControl;
