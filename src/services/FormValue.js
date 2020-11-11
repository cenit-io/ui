import BLoC from "./BLoC";

class FormValue {

    bloc() {
        return this._bloc || this.parent.bloc();
    }

    propertyValue(prop) {
        const key = `_property_${prop}`;
        return this[key] || (
            this[key] = new FormPropertyValue(this, prop)
        )
    }

    indexValue(index) {
        const key = `_index_${index}`;
        return this[key] || (
            this[key] = new FormIndexValue(this, index)
        );
    }

    jsonPath() {
        let accessPath = this.accessPath();

        if (this.parent) {
            accessPath = this.parent.jsonPath() + accessPath;
        }

        return accessPath;
    }

    valueFrom(value) {
        if (this.parent) {
            value = this.parent.valueFrom(value);
            return value && value[this.accessKey()];
        }
        return value;
    }

    changed() {
        return this._changed || (
            this._changed = this.bloc().on(this.valueFrom.bind(this), this.jsonPath())
        );
    }

    get() {
        return this.cache = this.valueFrom(this.bloc().state);
    }

    set(value, notifyAllObservers = false) {
        if (typeof value === 'function') {
            value = value(this.get());
        }
        this.assign(this.cache = value);
        if (notifyAllObservers) {
            this.bloc().checkPids();
        } else {
            this.checkTreeChanges();
        }
    }

    assign(value) {
        if (this.parent) {
            let parentValue = this.assignOn(this.parent.get(), value);
            this.parent.assign(parentValue);
        } else {
            this.bloc().set(value, false);
        }
    }

    delete() {
        if (this.parent) {
            this.parent.set(this.deleteOn(this.parent.get()), false);
        } else {
            this.bloc().set({}, false);
        }
        this.checkTreeChanges();
    }

    checkTreeChanges(inclusive = false) {
        const paths = this.treePaths();
        if (!inclusive) {
            paths.pop();
        }
        this.bloc().checkPids(...paths);
    }

    treePaths() {
        if (this.parent) {
            const paths = this.parent.treePaths();
            paths.push(paths[paths.length - 1] + this.accessPath());
            return paths;
        }

        return [this.accessPath()];
    }

    setOn(target, value) {
        if (this.parent) {
            target = this.parent.valueFrom(target);
            if (target) {
                value = this.assignOn(target, value);
            }
        }
        if (value && target) {
            Object.keys(value).forEach(
                key => target[key] = value[key]
            );
        }
    }

    checkPid() {
        this.bloc().checkPids(this.jsonPath());
    }
}

export class FormRootValue extends FormValue {

    constructor(value) {
        super();
        this._bloc = new BLoC(value);
    }

    accessPath() {
        return `$`;
    }
}

class FormPropertyValue extends FormValue {

    constructor(parent, property) {
        super();
        this.parent = parent;
        this.property = property;
    }

    accessKey() {
        return this.property;
    }

    accessPath() {
        return `.${this.property}`;
    }

    assignOn(parentValue, value) {
        return { ...parentValue, [this.property]: value };
    }

    deleteOn(parentValue) {
        parentValue = { ...parentValue };
        delete parentValue[this.property];
        return parentValue;
    }
}

class FormIndexValue extends FormValue {

    constructor(parent, index) {
        super();
        this.parent = parent;
        this.index = index;
    }

    accessKey() {
        return this.index;
    }

    accessPath() {
        return `[${this.index}]`;
    }

    assignOn(parentValue, value) {
        parentValue = [...parentValue];
        parentValue[this.index] = value;
        return parentValue;
    }

    deleteOn(parentValue) {
        parentValue = [...parentValue];
        parentValue.splice(this.index, 1);
        return parentValue;
    }
}
