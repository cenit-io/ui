import { useEffect, useState } from "react";

export interface ObservableLike<T> {
  subscribe: (next: (value: T) => void, error?: (err: unknown) => void) => { unsubscribe: () => void };
}

export default function useObservable<T>(
  observableFactory: () => ObservableLike<T> | null | undefined,
  deps: unknown[],
  initialValue: T,
): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const observable = observableFactory();
    if (!observable) return;
    const subscription = observable.subscribe((nextValue) => setValue(nextValue));
    return () => {
      subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
