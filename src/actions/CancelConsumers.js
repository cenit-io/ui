import ActionRegistry from "./ActionRegistry";
import CancelIcon from "@material-ui/icons/Cancel";
import API from "../services/ApiService";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

function CancelConsumers({ selectedItems, record, dataType, containerContext, selector }) {

    selectedItems = record
        ? [record]
        : selectedItems || [];

    if (selectedItems.length) {
        selector = { _id: { $in: selectedItems.map(({ id }) => id) } };
    }

    let message;
    if (record || selectedItems.length === 1) {
        message = `The consumer ${(record || selectedItems[0]).tag} will be canceled.`;
    } else if (selectedItems.length) {
        message = `The ${selectedItems.length} selected consumers will be canceled.`;
    } else if (Object.keys(selector).length) {
        message = 'All the found consumers will be cancelled';
    } else {
        message = 'All the consumers will be cancelled';
    }

    return containerContext.confirm({
        title: 'Cancel confirmation',
        message,
        cancelText: 'Abort',
    }).pipe(
        switchMap(ok => {
            if (ok) {
                return API.get('setup', 'data_type', dataType.id, 'digest', 'cancel', {
                    headers: {
                        'X-Digest-Options': JSON.stringify({ selector })
                    }
                });
            }
            return of(false);
        })
    );
}

export default ActionRegistry.register(CancelConsumers, {
    bulkable: true,
    icon: CancelIcon,
    title: 'Cancel',
    executable: true,
    onlyFor: [{ namespace: '', name: 'RabbitConsumer' }]
});
