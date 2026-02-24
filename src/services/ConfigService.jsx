import BLoC from "./BLoC";
import { updateConfig } from "./AuthorizationService";
import { debounce, switchMap, map, } from "rxjs/operators";
import { interval, of } from "rxjs";

function sanitize(config) {
  const { navigation, subjects, tabs } = config;
  const hash = {};
  let i = 0;
  Object.keys(subjects || {}).forEach(key => {
    const subject = subjects[key];
    if (typeof subject === 'function') {
      return;
    }
    if (subject?.type === 'DataType' && !subject?.dataTypeId) {
      delete subjects[key];
      return;
    }
    if (subject?.type === 'Record' && (!subject?.dataTypeId || !subject?.id)) {
      delete subjects[key];
    }
  });
  [...(tabs || [])].forEach(key => {
    if (subjects && !subjects[key]) {
      tabs.splice(i, 1);
    } else {
      i++;
      hash[key] = true;
    }
  });
  i = 0;
  [...(navigation || [])].forEach(({ key }) => {
    if (subjects && !subjects[key]) {
      navigation.splice(i);
    } else {
      i++;
      hash[key] = true;
    }
  });
  Object.keys(subjects || {}).forEach(key => {
    if (typeof subjects[key] !== 'function' && !hash[key]) {
      delete subjects[key];
    }
  });
  return config;
}

const configBLoC = new BLoC();

configBLoC.on((config) => config).pipe(
  debounce(() => interval(5000)),
  map((config) => sanitize(config)),
  switchMap((config) => updateConfig(config))
).subscribe(
  (config) => console.log('Config updated!', config)
);

const tenantId = (config) => config.tenant_id;
const navigation = (config) => config.navigation;

const ConfigService = {

  state: () => configBLoC.state,

  navigationChanges: () => configBLoC.on(navigation),

  tenantIdChanges: () => configBLoC.on(tenantId),

  on: configBLoC.on.bind(configBLoC),

  update: function (config) {
    if (config.tenant_id && config.tenant_id !== configBLoC.state.tenant_id) {
      // configBLoC.set(sanitize(updateConfig(config)));
      updateConfig(config).subscribe(
        (newConfig) => configBLoC.set(sanitize(newConfig))
      )
    } else {
      const merged = { ...configBLoC.state, ...config };
      if (merged.subjects) {
        merged.subjects = { ...merged.subjects };
      }
      if (merged.tabs) {
        merged.tabs = [...merged.tabs];
      }
      if (merged.navigation) {
        merged.navigation = [...merged.navigation];
      }
      configBLoC.set(sanitize(merged));
    }
  }
};

export default ConfigService;
