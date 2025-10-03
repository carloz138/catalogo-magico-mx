export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export interface BatchInsertResult<T> {
  successful: T[];
  failed: Array<{
    batch: number;
    error: any;
  }>;
}

export async function batchInsert<T>(
  tableName: string,
  items: any[],
  batchSize: number = 500,
  supabaseClient: any
): Promise<BatchInsertResult<T>> {
  const chunks = chunkArray(items, batchSize);
  const successful: T[] = [];
  const failed: Array<{ batch: number; error: any }> = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const { data, error } = await supabaseClient
        .from(tableName)
        .insert(chunks[i])
        .select();

      if (error) throw error;
      
      if (data) {
        successful.push(...data);
      }
    } catch (error) {
      console.error(`Error in batch ${i + 1}:`, error);
      failed.push({
        batch: i + 1,
        error
      });
    }
  }

  return { successful, failed };
}
