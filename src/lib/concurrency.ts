/** Runs `fn` over every item with at most `limit` concurrent calls. Failures are captured, not thrown. */
export async function promisePool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) return;
      try {
        results[current] = await fn(items[current]);
      } catch {
        results[current] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
