import RefOneViewer from "./RefOneViewer";
import RefManyViewer from "./RefManyViewer";
import EmbedsOneViewer from "./EmbedsOneViewer";
import EmbedsManyViewer from "./EmbedsManyViewer";
import BooleanViewer from "./BooleanViewer";
import DateTimeViewer from "./DateTimeViewer";
import StringViewer from "./StringViewer";
import JsonViewer from "./JsonViewer";
import TypePropertyViewer from "./TypePropertyViewer";

export default function viewerComponentFor(property, config) {
    let configViewer = config?.viewers;
    if (configViewer) {
        configViewer = configViewer[property.name];
        if (configViewer) {
            return configViewer;
        }
    }

    if (property.name === '_type') {
        return TypePropertyViewer;
    }

    switch (property.type) {

        case 'refOne':
            return RefOneViewer;

        case 'refMany':
            return RefManyViewer;

        case 'embedsOne':
            return EmbedsOneViewer;

        case 'embedsMany':
            return EmbedsManyViewer;

        case 'boolean':
            return BooleanViewer;

        case 'string': {
            switch (property.propertySchema.format) {
                case 'date-time':
                case 'time':
                case 'date':
                    return DateTimeViewer;

                default:
                    return StringViewer;
            }
        }

        default: {
            if (!property.type || property.type === 'object' || property.type === 'array') {
                return JsonViewer;
            }
            return StringViewer;
        }
    }
}
