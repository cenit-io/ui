import { Subject } from "rxjs";
import Random from "../util/Random";

export function eq(a, b) {
    if (a === null) {
        return b === null;
    }
    if (a === undefined) {
        return b === undefined
    }
    if (a && b && (typeof a === 'object') && (typeof b === 'object')) {
        if (a.constructor === b.constructor) {
            if (a.constructor === Array) {
                if (a.length === b.length) {
                    let i = 0;
                    while (i < a.length) {
                        if (eq(a[i], b[i])) {
                            i++;
                        } else {
                            break;
                        }
                    }
                    return i === a.length;
                }
            } else {
                const a_keys = Object.keys(a);
                const b_keys = Object.keys(b);
                if (a_keys.length === b_keys.length) {
                    let i = 0;
                    while (i < a_keys.length) {
                        const key = a_keys[i];
                        if (b.hasOwnProperty(key) && eq(a[key], b[key])) {
                            i++;
                        } else {
                            break;
                        }
                    }
                    return i === a_keys.length;
                }
            }
        }

        return false;
    }

    return a === b;
}

const Pid = Symbol.for('_projection');

class BLoC {

    listeners = {};
    projections = {};
    states = {};

    constructor(defaultState = {}) {
        this.state = defaultState || {};
    }

    nextOn(pid) {
        const projection = this.projections[pid];
        if (projection) {
            const prevState = this.states[pid];
            const newState = projection(this.state);
            if (!eq(prevState, newState)) {
                this.states[pid] = newState;
                const listener = this.listeners[pid];
                if (listener) {
                    listener.next(newState);
                }
            }
        }
    }

    on(projection, pid = null) {
        pid = pid || projection[Pid] || Random.string();
        if (projection[Pid] !== pid) {
            projection[Pid] = pid;
        }
        this.projections[pid] = projection;
        let listener = this.listeners[pid];
        if (!listener) { // TODO complete listener if already exists
            listener = this.listeners[pid] = new Subject();
            this.nextOn(pid);
        }
        return listener;
    }

    checkPids(...pids) {
        if (!pids.length) {
            pids = Object.keys(this.projections);
        }
        pids.forEach(pid => this.nextOn(pid));
    }

    update(state, checkPids = true) {
        this.state = { ...this.state, ...state };
        if (checkPids) {
            this.checkPids();
        }
    }

    set(state, checkPids = true) {
        this.state = state;
        if (checkPids) {
            this.checkPids();
        }
    }
}

export default BLoC;
