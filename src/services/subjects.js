import { DataType } from "./DataTypeService";
import { filter, switchMap, map, catchError, tap } from "rxjs/operators";
import { of, Subject, from } from "rxjs";
import InboxIcon from '@material-ui/icons/MoveToInbox';
import React from "react";
import Random from "../util/Random";
import ConfigService from "./ConfigService";
import CollectionContainer from "../actions/CollectionContainer";
import MemberContainer from "../actions/MemberContainer";
import { Cache, Config, Subject as subj, TitlePipe as titlePipe } from '../common/Symbols';
import { preprocess } from "../config/config";

class BasicSubject {
    constructor(attrs) {
        Object.keys(attrs).forEach(
            attr => this[attr] = attrs[attr]
        );
        this[subj] = new Subject();
    }

    title() {
        if (!this[titlePipe]) {
            this[titlePipe] = this.pipe(
                filter(({ type }) => type === 'title'),
                map(({ title }) => title)
            );
        }
        return this[titlePipe];
    }

    subscribe(...args) {
        return this[subj].subscribe(...args);
    }

    next(...args) {
        return this[subj].next(...args);
    }

    pipe(...args) {
        return this[subj].pipe(...args);
    }

    computeTitle(target) {
        if (target || !this.titleObs) {
            this.titleObs = this.titleObservable(target);
        }
        this.titleObs.subscribe(
            title => {
                this.titleCache = title;
                this.next({ type: 'title', title });
                delete this.titleObs;
            }
        )
    }

    quickTitle() {
        if (this.titleCache) {
            return of(this.titleCache);
        }
        return this.titleObservable(this.cache());
    }
}

export class DataTypeSubject extends BasicSubject {

    static type = 'DataType';

    static for(dataTypeId) {
        let s = Object.values(Subjects).find(
            s => s.type === DataTypeSubject.type && s.dataTypeId === dataTypeId
        );
        if (!s) {
            s = new DataTypeSubject({ dataTypeId });
            Subjects.add(s);
        }
        return s;
    }

    constructor(attrs) {
        super(attrs);
        this.TabComponent = CollectionContainer;
        this.type = DataTypeSubject.type;
        this.key = Random.string();
        this.key = this.key || Random.string();
    }

    titleObservable() {
        return this.config().pipe(
            switchMap(config => {
                if (config.title) {
                    return of(config.title);
                }

                return this.dataType().pipe(
                    switchMap(
                        dataType => (dataType && dataType.getTitle()) || of('404')
                    )
                );
            })
        );
    }

    navIcon() {
        return <InboxIcon/>;
    }

    dataType() {
        return DataType.getById(this.dataTypeId);
    }

    cache() {
        return this[Cache];
    }

    config() {
        return this.dataType().pipe(
            switchMap(dt => {
                if (dt) {
                    let config = dt[Config];
                    if (config) {
                        config = of(config);
                    } else {
                        config = this[Config];
                        if (!config) {
                            this[Config] = config = from(
                                import(`../config/dataTypes/${dt.namespace}/${dt.name}.js`)
                            ).pipe(
                                map(mod => mod.default),
                                catchError(e => of({})),
                                tap(config => {
                                    dt[Config] = config;
                                    delete this[Config];
                                })
                            );
                        }
                    }
                    return config;
                }
                return of({});
            }),
            map(config => preprocess(config))
        );
    }
}

export class RecordSubject extends BasicSubject {

    static type = 'Record';

    static for(dataTypeId, id) {
        let s = Object.values(Subjects).find(
            s => (
                s.type === RecordSubject.type &&
                s.dataTypeId === dataTypeId &&
                s.id === id
            )
        );
        if (!s) {
            s = new RecordSubject({ dataTypeId, id });
            Subjects.add(s);
        }
        return s;
    }

    constructor(attrs) {
        super(attrs);
        this.TabComponent = MemberContainer;
        this.type = RecordSubject.type;
        this.key = this.key || Random.string();
    }

    titleObservable(record) {
        return DataType.getById(this.dataTypeId).pipe(
            switchMap(
                dataType => dataType.titleFor(record || { id: this.id })
            )
        );
    }

    navIcon() {
        return <InboxIcon/>;
    }

    dataTypeSubject() {
        return DataTypeSubject.for(this.dataTypeId);
    }

    updateCache(record) {
        this[Cache] = record;
        if (record) {
            this.computeTitle(record);
        }
    }
}

const Subjects = {

    add: function (subject) {
        this[subject.key] = subject;
        ConfigService.update({ subjects: this });
    },

    syncWith: function (subjects) {
        Object.keys(subjects || {}).forEach(
            key => {
                const attrs = subjects[key];
                let s;
                if (attrs.type === DataTypeSubject.type) {
                    s = new DataTypeSubject(attrs);
                }
                if (attrs.type === RecordSubject.type) {
                    s = new RecordSubject(attrs);
                }
                s.key = key;
                if (s) {
                    this[key] = s;
                } else {
                    delete this[key];
                }
            }
        );
    }
};

ConfigService.tenantIdChanges().subscribe(
    () => Subjects.syncWith(ConfigService.state().subjects)
);


export const TabsSubject = new Subject();

export const NavSubject = new Subject();

export default Subjects;
