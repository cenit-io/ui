import AutocompleteControl from "../../../components/AutocompleteControl";

const fields = ['name', 'type', 'many', 'required'];

export default {
    title: 'Algorithm Parameter',
    actions: {
        new: {
            fields,
            seed: {
                language: 'ruby'
            }
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
        }
    }
};
