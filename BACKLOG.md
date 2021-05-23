
## Cenit Admin Backlog

Issues & next features

### Issues

- Pull-import execution monitor leaks

- Filter PUSH target collections by origins depending on the super user status.

- Mapping converters

### Cenit side Issues

- When filtering booleans (and probably other types) $eq: null cast null to false and filter does not work

- Dhow flash messages...

### Optimizations

- Cache for Liquid templates

- Prevent recursive referenced items edition.

- Refresh Index when redirected from delete callback.

- Clean up tenant configuration after tenant shredding

### Next Features

- Seed for embedded forms

- Action to config tasks description and auto-retry

- Add breadcrumb when navigating through references properties on forms editors.

- Add attachment filter option for notifications and executions.

- Use ExecutionMonitor to track collection create/update.

- Add styles and navigation links to the editor breadcrumb.

- Tasks and executions agents through API.

- Extend support for tasks descriptions across all executions APIs

- Use the data type title to customize ref-picker loading message.

- Async response might be not an execution but an error notification because the task could not be created.

- Add collection agent field to collection sharing models

- Add data type agent field to deletion task

- Add file store migration progress viewer

- Add seed contexts to e-mail notification forms 

- Storage updated_at property at index
