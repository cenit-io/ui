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
    }
};
