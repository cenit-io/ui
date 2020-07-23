import { DataType, FILE_TYPE } from "./DataTypeService";
import { filter, switchMap, map, catchError, tap } from "rxjs/operators";
import { of, Subject, from } from "rxjs";
import ItemIcon from '@material-ui/icons/FiberManualRecord';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import DataTypeIcon from '@material-ui/icons/Dns';
import React from "react";
import Random from "../util/Random";
import ConfigService from "./ConfigService";
import CollectionContainer from "../actions/CollectionContainer";
import MemberContainer from "../actions/MemberContainer";
import { Cache, Config, Subject as subj, TitlePipe as titlePipe } from '../common/Symbols';
import { preprocess } from "../config/config";
import zzip from "../util/zzip";
import SvgIcon from "@material-ui/core/SvgIcon";
import pluralize from 'pluralize';

const fileIcon = <FileIcon/>;
const itemIcon = <ItemIcon/>;
const dataTypeIcon = <DataTypeIcon/>;
const fileDataTypeIcon = (
    <SvgIcon>
        <path
            d="M15.88,10.5l1.62,1.62v3.38l-3,0v-5H15.88z M22,8v10c0,1.1-0.9,2-2,2H4c-1.1,0-2-0.9-2-2L2.01,6C2.01,4.9,2.9,4,4,4h6l2,2 h8C21.1,6,22,6.9,22,8z M19,11.5L16.5,9H13v8l6,0V11.5z"/>
    </SvgIcon>
);

class BasicSubject {
    constructor(attrs) {
        Object.keys(attrs).forEach(
            attr => this[attr] = attrs[attr]
        );
        this[subj] = new Subject();
    }

    navTitle() {
        return this.title();
    }

    title(arity = 1) {
        if (!this[titlePipe]) {
            this[titlePipe] = this.pipe(
                filter(({ type }) => type === 'title'),
                map(({ title }) => pluralize(title, arity))
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

    quickNavTitle() {
        return this.quickTitle();
    }

    quickTitle(arity = 1) {
        return (
            (this.titleCache && of(this.titleCache)) ||
            this.titleObservable(this.cache())
        ).pipe(
            map(title => pluralize(title, arity))
        );
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

    navTitle() {
        return this.title(2);
    }

    quickNavTitle() {
        return this.quickTitle(2);
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
        return zzip(
            this.dataType(),
            this.config()
        ).pipe(
            map(
                ([dataType, config]) => config.icon || (
                    dataType._type === FILE_TYPE ? fileDataTypeIcon : dataTypeIcon
                ))
        );
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

    dataType() {
        return DataType.getById(this.dataTypeId);
    }

    titleObservable(record) {
        return this.dataType().pipe(
            switchMap(
                dataType => dataType.titleFor(record || { id: this.id })
            )
        );
    }

    navIcon() {
        return this.dataType().pipe(
            map(dataType => {
                if (dataType._type === FILE_TYPE) {
                    return fileIcon;
                }

                return itemIcon;
            })
        );
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
