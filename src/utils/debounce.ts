/**
 * Returns a debounced version of `fn` that delays invocation by `ms`
 * milliseconds. The pending timer is cancelled on each new call.
 */
export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
): { call: (...args: T) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  function call(...args: T): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  }

  function cancel(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  return { call, cancel };
}
