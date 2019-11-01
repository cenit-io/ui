import Random from '../util/Random';

export const ActionKind = Object.freeze({
    root: 'root',
    collection: 'collection',
    member: 'member'
});

class ActionRegistryClass {

    actions = {};

    byKey = key => this.actions[key];

    register = (action, props = {}) => {
        props.key = Random.string();
        Object.keys(props).forEach(key => action[key] = props[key]);
        this.actions[action.key] = action;
        return action;
    };

    findBy = criteria => Object.values(this.actions).filter(
        action => Object.keys(criteria).reduce(
            (match, key) => match && criteria[key] === action[key],
            true
        )
    );
}

const ActionRegistry = new ActionRegistryClass();

export default ActionRegistry;
