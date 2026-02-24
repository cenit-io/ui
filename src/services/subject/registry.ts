import ConfigService from "../ConfigService";

export interface SubjectsRegistry {
    [key: string]: any;
    add(subject: any): void;
    syncWith(subjects: any, classes: Record<string, any>): void;
}

const Subjects: SubjectsRegistry = {
    add: function (subject: any) {
        this[subject.key] = subject;
        ConfigService.update({ subjects: this });
    },

    syncWith: function (subjects: any, classes: Record<string, any>) {
        Object.keys(this).forEach(key => {
            if (typeof this[key] !== 'function') {
                delete this[key];
            }
        });

        Object.keys(subjects || {}).forEach(key => {
            const attrs = subjects[key];
            if (attrs?.type === 'DataType' && !attrs?.dataTypeId) {
                return;
            }
            if (attrs?.type === 'Record' && (!attrs?.dataTypeId || !attrs?.id)) {
                return;
            }
            const Class = classes[attrs.type];
            let s;
            if (Class) {
                if (Class.instance) {
                    s = Class.instance();
                } else {
                    s = new Class(attrs);
                }
            }

            if (s) {
                s.key = key;
                this[key] = s;
            }
        });
    }
};

export default Subjects;
