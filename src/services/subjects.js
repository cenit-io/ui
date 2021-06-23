import { DataType, FILE_TYPE } from "./DataTypeService";
import { filter, switchMap, map, catchError, tap } from "rxjs/operators";
import { of, Subject, from } from "rxjs";
import React from "react";
import Random from "../util/Random";
import ConfigService from "./ConfigService";
import CollectionContainer from "../actions/CollectionContainer";
import MemberContainer from "../actions/MemberContainer";
import {
    Cache,
    Config,
    Subject as subj,
    TitleObservable,
    TitlePipe as titlePipe,
    TitleSubscription
} from '../common/Symbols';
import zzip from "../util/zzip";
import pluralize from 'pluralize';
import Menu from "../components/Menu";
import DocumentTypeRecordsFilledIcon from "../icons/DocumentTypeRecordsFilledIcon";
import FileTypeFilledIcon from "../icons/FileTypeFilledIcon";
import FileFilledIcon from "../icons/FileFilledIcon";
import DocumentTypeFilledIcon from "../icons/DocumentTypeFilledIcon";
import QuickAccessFilledIcon from "../icons/QuickAccessFilledIcon";
import EmbeddedAppContainer from "../components/EmbeddedAppContainer";
import EmbeddedAppService from "./EnbeddedAppService";

const menuIcon = <QuickAccessFilledIcon/>;
const fileIcon = <FileFilledIcon/>;
const documentIcon = <DocumentTypeRecordsFilledIcon/>;
const documentTypeIcon = <DocumentTypeFilledIcon/>;
const fileTypeIcon = <FileTypeFilledIcon/>;

function preprocess(config) {
    let configFields = config.fields;
    if (!configFields) {
        config.fields = configFields = {};
    }
    Object.keys(config.groups || {}).forEach(
        group => {
            const groupConfig = config.groups[group];
            (groupConfig.fields || []).forEach(
                fieldName => {
                    let fieldConfig = configFields[fieldName];
                    if (!fieldConfig) {
                        configFields[fieldName] = fieldConfig = {};
                    }
                    fieldConfig.group = group;
                }
            );
        }
    );
    return config;
}

class BasicSubject {
    constructor(attrs = {}) {
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
        if (target || !this[TitleObservable]) {
            this[TitleObservable] = this.titleObservable(target);
        }
        if (this[TitleSubscription]) {
            this[TitleSubscription].unsubscribe();
        }
        this[TitleSubscription] = this[TitleObservable].subscribe(
            title => {
                this.titleCache = title;
                this.next({ type: 'title', title });
                delete this[TitleObservable];
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
            map(title => title && pluralize(title, arity))
        );
    }

    cache() {
        return null;
    }
}

export class EmbeddedAppSubject extends BasicSubject {

    static type = 'EmbeddedApp';

    static for(id) {
        if (id) {
            let s = Object.values(Subjects).find(
                s => s.type === EmbeddedAppSubject.type && s.id === id
            );
            if (!s) {
                s = new EmbeddedAppSubject({ id });
                Subjects.add(s);
            }
            return s;
        }
    }

    constructor(attrs) {
        super(attrs);
        this.TabComponent = EmbeddedAppContainer;
        this.type = EmbeddedAppSubject.type;
        this.key = this.key || Random.string();
    }

    titleObservable(record) {
        return of(record?.title || '');
    }

    navIcon() {
        return EmbeddedAppService.getById(this.id).pipe(
            map(app => app && <img src={`${app.url}/icon.svg`}/>)
        );
    }

    quickTitle() {
        return EmbeddedAppService.getById(this.id).pipe(
            map(app => app?.title || '')
        );
    }
}

export class DataTypeSubject extends BasicSubject {

    static type = 'DataType';

    static for(dataTypeId) {
        if (dataTypeId) {
            let s = Object.values(Subjects).find(
                s => s.type === DataTypeSubject.type && s.dataTypeId === dataTypeId
            );
            if (!s) {
                s = new DataTypeSubject({ dataTypeId });
                Subjects.add(s);
            }
            return s;
        }
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
                ([dataType, config]) => config?.icon || (dataType && (
                    dataType._type === FILE_TYPE ? fileTypeIcon : documentTypeIcon
                )))
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
                    return dt.config();
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
                if (dataType?._type === FILE_TYPE) {
                    return fileIcon;
                }

                return documentIcon;
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

export class MenuSubject extends BasicSubject {

    static key = 'Menu';

    static type = MenuSubject.key;

    static instance() {
        let s = Object.values(Subjects).find(
            s => s.type === MenuSubject.type
        );
        if (!s) {
            s = new MenuSubject();
            Subjects.add(s);
        }
        return s;
    }

    constructor(attrs) {
        super(attrs);
        this.TabComponent = Menu;
        this.type = MenuSubject.type;
        this.key = MenuSubject.key;
    }

    titleObservable() {
        return of('Quick Access');
    }

    navIcon() {
        return of(menuIcon);
    }


    config() {
        if (MenuSubject[Config]) {
            return of(MenuSubject[Config]);
        }

        return from(
            import(`../config/Menu.js`)
        ).pipe(
            map(mod => mod.default),
            catchError(e => of({})),
            tap(config => MenuSubject[Config] = config)
        );
    }
}

const Subjects = {

    add: function (subject) {
        this[subject.key] = subject;
        ConfigService.update({ subjects: this });
    },

    syncWith: function (subjects) {
        Object.keys(this).forEach(key => {
            if (typeof this[key] !== 'function') {
                delete this.key;
            }
        });
        Object.keys(subjects || {}).forEach(
            key => {
                const attrs = subjects[key];
                let s;
                if (attrs.type === EmbeddedAppSubject.type) {
                    s = new EmbeddedAppSubject(attrs);
                }
                if (attrs.type === DataTypeSubject.type) {
                    s = new DataTypeSubject(attrs);
                }
                if (attrs.type === RecordSubject.type) {
                    s = new RecordSubject(attrs);
                }
                if (attrs.type === MenuSubject.type) {
                    s = MenuSubject.instance();
                }
                if (s) {
                    s.key = key;
                    this[key] = s;
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
