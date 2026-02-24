import { Observable, Subject, of, Subscription } from "rxjs";
import { filter, map } from "rxjs/operators";
import pluralize from 'pluralize';
import {
    Subject as subj,
    TitleObservable as TitleObservableSymbol,
    TitlePipe as titlePipe,
    TitleSubscription as TitleSubscriptionSymbol
} from '../../common/Symbols';
import { SubjectAction } from "./types";

export abstract class BasicSubject {
    protected [subj]: Subject<SubjectAction>;
    protected [TitleObservableSymbol]?: Observable<string>;
    protected [TitleSubscriptionSymbol]?: Subscription;
    protected [titlePipe]?: Observable<SubjectAction>;

    public titleCache?: string;
    public key: string = '';

    constructor(attrs: Record<string, any> = {}) {
        Object.keys(attrs).forEach(
            attr => (this as any)[attr] = attrs[attr]
        );
        this[subj] = new Subject<SubjectAction>();
    }

    navTitle(): Observable<SubjectAction> {
        return this.title();
    }

    title(arity: number = 1): Observable<SubjectAction> {
        if (!this[titlePipe]) {
            this[titlePipe] = this.pipe(
                filter(({ type }) => type === 'title'),
                map(({ title }) => ({ type: 'title', title: pluralize(title as string, arity) }))
            );
        }
        return this[titlePipe];
    }

    subscribe(...args: any[]): Subscription {
        return (this[subj].subscribe as any)(...args);
    }

    next(value: SubjectAction): void {
        this[subj].next(value);
    }

    pipe(...args: any[]): Observable<any> {
        return (this[subj].pipe as any)(...args);
    }

    computeTitle(target?: any): void {
        if (target || !this[TitleObservableSymbol]) {
            this[TitleObservableSymbol] = this.titleObservable(target);
        }
        if (this[TitleSubscriptionSymbol]) {
            this[TitleSubscriptionSymbol].unsubscribe();
        }
        this[TitleSubscriptionSymbol] = this[TitleObservableSymbol].subscribe(
            title => {
                this.titleCache = title;
                this.next({ type: 'title', title });
                delete this[TitleObservableSymbol];
            }
        );
    }

    quickNavTitle(): Observable<string> {
        return this.quickTitle();
    }

    quickTitle(arity: number = 1): Observable<string> {
        return (
            (this.titleCache && of(this.titleCache)) ||
            this.titleObservable(this.cache())
        ).pipe(
            map(title => title && pluralize(title, arity))
        );
    }

    abstract titleObservable(target?: any): Observable<string>;

    cache(): any {
        return null;
    }
}
