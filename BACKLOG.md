
## Cenit Admin Backlog

Issues & next features

### Issues

- Pull-import execution monitor leaks

- "\xC3" from ASCII-8BIT to UTF-8

- Filter PUSH target collections by origins depending on the super user status.

- Fix xs view for large breadcrumb on actions toolbar.

- Tab recovery from Not Found responses.

- Refresh Index when redirected from delete callback.

- Prevent recursive referenced items edition.
 
- Many-ref control should excludes from search the ids already included in the association

- Codemirror code controls do not expand within new action.

- Data types and records names

- Copy doesn't work on readonly codemirror controls.

- Brake large titles with ellipsis.

- Updating container context record on forms onUpdate

- Mapping converters

- Customize all tasks models for show action view

- Refresh task record before and after schedule action

- Handle errors from executable actions observers

- Clean up tenant configuration after tenant shredding

### Cenit side Issues

- Make build-in data types `$ref` referenced by default.

- When filtering booleans (and probably other types) $eq: null cats null to false and filter does not work

### Features

- Use ExecutionMonitor to track collection create/update.

- Add styles and navigation links to the editor breadcrumb.

- Tasks and executions agents through API.

- Extend support for tasks descriptions across all executions APIs

- Action to config tasks description and auto-retry

- Config Authorization models

- Use the data type title to customize ref-picker loading message.

- Async response might be not an execution but an error notification because the task could not be created.

### Optimizations

- Cache for Liquid templates
