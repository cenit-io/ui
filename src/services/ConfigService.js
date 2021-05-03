import BLoC from "./BLoC";
import AuthorizationService from "./AuthorizationService";
import { debounce, switchMap, map } from "rxjs/operators";
import { interval } from "rxjs";

function sanitize(config) {
    const { navigation, subjects, tabs } = config;
    const hash = {};
    (tabs || []).forEach(key => hash[key] = true);
    (navigation || []).forEach(({key}) => hash[key] = true);
    Object.keys(subjects || {}).forEach(key => {
        if (typeof subjects[key] !== 'function' && !hash[key]) {
            delete subjects[key];
        }
    });
    return config;
}

const configBLoC = new BLoC();

configBLoC.on(config => config).pipe(
    debounce(() => interval(5000)),
    map(config => sanitize(config)),
    switchMap(config => AuthorizationService.config(config))
).subscribe(
    () => console.log('Config updated!')
);

const tenantId = config => config.tenant_id;
const navigation = config => config.navigation;

const ConfigService = {

    state: () => configBLoC.state,

    navigationChanges: () => configBLoC.on(navigation),

    tenantIdChanges: () => configBLoC.on(tenantId),

    on: configBLoC.on.bind(configBLoC),

    update: function (config) {
        if (config.tenant_id && config.tenant_id !== configBLoC.state.tenant_id) {
            AuthorizationService.config(config).subscribe(
                newConfig => configBLoC.set(newConfig)
            )
        } else {
            configBLoC.update(config);
        }
    }
};

export default ConfigService;
