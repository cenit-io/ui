import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import React from "react";
import { BasicSubject } from "./BasicSubject";
import EmbeddedAppContainer from "../../components/EmbeddedAppContainer";
import EmbeddedAppService from "../EnbeddedAppService";
import Random from "../../util/Random";

export class EmbeddedAppSubject extends BasicSubject {
    static readonly type = 'EmbeddedApp';

    declare public id?: string;
    public TabComponent: any;
    public type: string;

    constructor(attrs: Record<string, any>) {
        super(attrs);
        this.TabComponent = EmbeddedAppContainer;
        this.type = EmbeddedAppSubject.type;
        this.key = this.key || Random.string();
    }

    titleObservable(record?: any): Observable<string> {
        return of(record?.title || '');
    }

    navIcon(): Observable<any> {
        return EmbeddedAppService.getById(this.id!).pipe(
            map((app: any) => app && React.createElement('img', { src: `${app.url}/icon.svg` }))
        );
    }

    quickTitle(): Observable<string> {
        return EmbeddedAppService.getById(this.id!).pipe(
            map((app: any) => app?.title || '')
        );
    }
}
