import { Subject } from "rxjs";
import { DataTypeSubject } from "./DataTypeSubject";
import { EmbeddedAppSubject } from "./EmbeddedAppSubject";
import { RecordSubject } from "./RecordSubject";
import { MenuSubject } from "./MenuSubject";
import ConfigService from "../ConfigService";
import Subjects from "./registry";

export interface SubjectsRegistry {
    [key: string]: any;
    add(subject: any): void;
    syncWith(subjects: any, classes: Record<string, any>): void;
}

const registry = Subjects as SubjectsRegistry;

const tenantIdSyncSubscription = ConfigService.tenantIdChanges().subscribe(
    () => registry.syncWith(ConfigService.state().subjects, {
        [EmbeddedAppSubject.type]: EmbeddedAppSubject,
        [DataTypeSubject.type]: DataTypeSubject,
        [RecordSubject.type]: RecordSubject,
        [MenuSubject.type]: MenuSubject
    })
);

export const disposeSubjectsSubscription = () => tenantIdSyncSubscription.unsubscribe();

export const TabsSubject = new Subject<any>();

export const NavSubject = new Subject<string>();

export {
    EmbeddedAppSubject,
    DataTypeSubject,
    RecordSubject,
    MenuSubject
};

export default registry;
