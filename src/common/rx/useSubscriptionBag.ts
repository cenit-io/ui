import { useCallback, useEffect, useMemo, useRef } from "react";

export interface SubscriptionLike {
  unsubscribe: () => void;
}

function safeUnsubscribe(subscription?: SubscriptionLike | null) {
  if (subscription && typeof subscription.unsubscribe === "function") {
    subscription.unsubscribe();
  }
}

export default function useSubscriptionBag() {
  const bagRef = useRef<Map<string, SubscriptionLike>>(new Map());

  const add = useCallback((key: string, subscription?: SubscriptionLike | null) => {
    const current = bagRef.current.get(key);
    safeUnsubscribe(current);
    if (subscription) {
      bagRef.current.set(key, subscription);
    } else {
      bagRef.current.delete(key);
    }
  }, []);

  const remove = useCallback((key: string) => {
    const current = bagRef.current.get(key);
    safeUnsubscribe(current);
    bagRef.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    bagRef.current.forEach((subscription) => safeUnsubscribe(subscription));
    bagRef.current.clear();
  }, []);

  useEffect(() => clear, [clear]);

  return useMemo(() => ({ add, remove, clear }), [add, remove, clear]);
}
