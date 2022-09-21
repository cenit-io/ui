import StringCodeControl from "../../../components/StringCodeControl";

export default {
  title: 'Call Link',
  actions: {
    edit: {
      fields: ['name', 'link']
    }
  },
  fields: {
    name: {
      readOnly: true
    }
  }
};
