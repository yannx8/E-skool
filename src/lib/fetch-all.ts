type PageResult<T> = { data: T[] | null; error: { message: string; code?: string } | null };

/**
 * Supabase returns at most 1000 rows per request (PostgREST max_rows). Exports
 * and totals must read every row, so they page through with range(). The
 * query passed in must have a stable order.
 */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(`fetchAll: ${error.code ?? ""} ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}
