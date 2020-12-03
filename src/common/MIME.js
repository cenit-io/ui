import mime from 'mime-types';

const ExtraTypes = {
    'text/x-ruby': ['rb']
};

Object.keys(ExtraTypes).forEach(type => {
        let extensions = mime.extensions[type] || [];
        ExtraTypes[type].forEach(ext => {
            if (extensions.indexOf(ext) === -1) {
                extensions.push(ext);
            }
        });
        mime.extensions[type] = extensions;
    }
);

export default mime;
