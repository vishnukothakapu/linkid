import { useRef, useEffect, useCallback } from "react";

export default function useDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  wait = 300
) {
  const fnRef = useRef(fn);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, []);

  return useCallback((...args: TArgs) => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      void fnRef.current(...args);
    }, wait);
  }, [wait]);
}
