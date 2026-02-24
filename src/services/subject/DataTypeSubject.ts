import { Observable, of } from "rxjs";
import { switchMap, map } from "rxjs/operators";
import { BasicSubject } from "./BasicSubject";
import { DataType } from "../DataTypeService";
import { FILE_TYPE } from "../dataType/utils";
import CollectionContainer from "../../actions/CollectionContainer";
import zzip from "../../util/zzip";
import { Cache } from '../../common/Symbols';
import Random from "../../util/Random";
import { preprocess } from "./utils";
import { documentTypeIcon, fileTypeIcon } from "./constants";
import Subjects from "./registry";

export class DataTypeSubject extends BasicSubject {
    static readonly type = 'DataType';

    declare public dataTypeId: string;
    public TabComponent: any;
    public type: string;

    static for(dataTypeId: string): DataTypeSubject | undefined {
        if (dataTypeId) {
            let s = Object.values(Subjects).find(
                (s: any) => s.type === DataTypeSubject.type && s.dataTypeId === dataTypeId
            ) as DataTypeSubject | undefined;
            if (!s) {
                s = new DataTypeSubject({ dataTypeId });
                Subjects.add(s);
            }
            return s;
        }
        return undefined;
    }

    constructor(attrs: Record<string, any>) {
        super(attrs);
        this.TabComponent = CollectionContainer;
        this.type = DataTypeSubject.type;
        this.key = this.key || Random.string();
        if (!this.dataTypeId) {
            console.warn('DEBUG: DataTypeSubject created without dataTypeId', attrs, new Error().stack);
        }
    }

    navTitle(): Observable<any> {
        return this.title(2);
    }

    quickNavTitle(): Observable<string> {
        return this.quickTitle(2);
    }

    titleObservable(): Observable<string> {
        return this.config().pipe(
            switchMap(config => {
                if (config.title) {
                    return of(config.title);
                }

                return this.dataType().pipe(
                    switchMap(
                        dataType => (dataType && (dataType as any).getTitle()) || of('404')
                    )
                );
            })
        );
    }

    navIcon(): Observable<any> {
        return zzip(
            this.dataType(),
            this.config()
        ).pipe(
            map(
                ([dataType, config]: [any, any]) => config?.icon || (dataType && (
                    dataType._type === FILE_TYPE ? fileTypeIcon : documentTypeIcon
                )))
        );
    }

    dataType(): Observable<any> {
        return DataType.getById(this.dataTypeId);
    }

    cache(): any {
        return (this as any)[Cache];
    }

    config(): Observable<any> {
        return this.dataType().pipe(
            switchMap(dt => {
                if (dt) {
                    return dt.config();
                }
                return of({});
            }),
            map(config => preprocess(config))
        );
    }
}
