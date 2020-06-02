import { DataType } from "./DataTypeService";
import { switchMap } from "rxjs/operators";
import { of, Subject } from "rxjs";
import InboxIcon from '@material-ui/icons/MoveToInbox';
import React from "react";
import Random from "../util/Random";
import ConfigService from "./ConfigService";
import CollectionContainer from "../actions/CollectionContainer";
import MemberContainer from "../actions/MemberContainer";
import zzip from "../util/zzip";

class BasicSubject {
    constructor(attrs) {
        Object.keys(attrs).forEach(
            attr => this[attr] = attrs[attr]
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
        return DataType.getById(this.dataTypeId).pipe(
            switchMap(
                dataType => (dataType && dataType.getTitle()) || of('404')
            )
        );
    }

    navIcon() {
        return <InboxIcon/>;
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

    navTitle() {
        return DataType.getById(this.dataTypeId).pipe(
            switchMap(
                dataType => zzip(
                    of(dataType),
                    dataType.get(this.id)
                )
            ),
            switchMap(
                ([dataType, record]) => (
                    (dataType && record && dataType.titleFor(record)) || of('404')
                )
            )
        );
    }

    navIcon() {
        return <InboxIcon/>;
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
                } if (attrs.type === RecordSubject.type) {
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

export default Subjects;
