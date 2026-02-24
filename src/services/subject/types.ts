import { Observable, Subject } from "rxjs";

export interface SubjectAction {
    type: string;
    [key: string]: any;
}

export interface SubjectConfig {
    title?: string;
    icon?: any;
    fields?: Record<string, any>;
    groups?: any;
    itemLabel?: (item: any) => string;
}

export interface NavIconObservable extends Observable<any> { }
export interface TitleObservable extends Observable<string> { }
export interface TitlePipe extends Observable<SubjectAction> { }
