import AutocompleteControl from "../../../components/AutocompleteControl";
import JsonControl from "../../../components/JsonControl";

const fields = ['name', 'type', 'many', 'required', 'default'];

export default {
  title: 'Algorithm Parameter',
  actions: {
    new: {
      fields,
    },
    edit: {
      fields
    }
  },
  fields: {
    type: {
      control: AutocompleteControl,
      controlProps: {
        options: ['integer', 'boolean', 'number', 'string', 'object']
      }
    },
    default: {
      control: JsonControl,
    }
  },
  dynamicConfig: ({ required }, state, value) => {
    if (state.default?.hidden !== required) {
      if (required && value.propertyValue('default').get() !== undefined) {
        value.propertyValue('default').set(null);
      }
      return {
        default: {
          hidden: required
        }
      };
    }
  }
};
