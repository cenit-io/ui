import { Observable, of } from "rxjs";
import { switchMap, map } from "rxjs/operators";
import { BasicSubject } from "./BasicSubject";
import { DataType } from "../DataTypeService";
import { FILE_TYPE } from "../dataType/utils";
import MemberContainer from "../../actions/MemberContainer";
import { Cache } from '../../common/Symbols';
import Random from "../../util/Random";
import { fileIcon, documentIcon } from "./constants";
import Subjects from "./registry";
import { DataTypeSubject } from "./DataTypeSubject";

export class RecordSubject extends BasicSubject {
    static readonly type = 'Record';

    declare public dataTypeId: string;
    declare public id: string;
    public TabComponent: any;
    public type: string;

    static for(dataTypeId: string, id: string): RecordSubject {
        let s = Object.values(Subjects).find(
            (s: any) => (
                s.type === RecordSubject.type &&
                s.dataTypeId === dataTypeId &&
                s.id === id
            )
        ) as RecordSubject | undefined;
        if (!s) {
            s = new RecordSubject({ dataTypeId, id });
            Subjects.add(s);
        }
        return s;
    }

    constructor(attrs: Record<string, any>) {
        super(attrs);
        this.TabComponent = MemberContainer;
        this.type = RecordSubject.type;
        this.key = this.key || Random.string();
    }

    dataType(): Observable<any> {
        return DataType.getById(this.dataTypeId);
    }

    titleObservable(record?: any): Observable<string> {
        return this.dataType().pipe(
            switchMap(dataType => {
                if (dataType) {
                    return (dataType as any).titleFor(record || { id: this.id }) as Observable<string>;
                }

                return of('404');
            })
        ) as Observable<string>;
    }

    navIcon(): Observable<any> {
        return this.dataType().pipe(
            map(dataType => {
                if (dataType?._type === FILE_TYPE) {
                    return fileIcon;
                }

                return documentIcon;
            })
        );
    }

    dataTypeSubject(): DataTypeSubject | undefined {
        return DataTypeSubject.for(this.dataTypeId);
    }

    updateCache(record: any): void {
        (this as any)[Cache] = record;
        if (record) {
            this.computeTitle(record);
        }
    }
}
