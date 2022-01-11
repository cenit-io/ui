import lazy from "./lazy";
import StringControl from "./StringControl";

export const LazyStringControl = lazy(StringControl, { skipChanges: true });
