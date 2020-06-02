import { Subject } from "rxjs";
import Random from "../util/Random";

function eq(a, b) {
    if ((typeof a === 'object') && (typeof b === 'object')) {
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

const key = Symbol.for('_projection');

class BLoC {

    listeners = {};
    projections = {};
    states = {};
    state = {};

    nextOn(pid) {
        const prevState = this.states[pid];
        const newState = this.projections[pid](this.state);
        if (!eq(prevState, newState)) {
            this.states[pid] = newState;
            const listener = this.listeners[pid];
            if (listener) {
                listener.next(newState);
            }
        }
    }

    on(projection) {
        let pid = projection[key];
        if (!pid) {
            pid = projection[key] = Random.string();
        }
        this.projections[pid] = projection;
        let listener = this.listeners[pid];
        if (!listener) {
            listener = this.listeners[pid] = new Subject();
            this.nextOn(pid);
        }
        return listener;
    }

    checkPids() {
        Object.keys(this.projections).forEach(pid => this.nextOn(pid));
    }

    update(state) {
        this.state = { ...this.state, ...state };
        this.checkPids();
    }

    set(state) {
        this.state = state;
        this.checkPids();
    }
}

export default BLoC;
