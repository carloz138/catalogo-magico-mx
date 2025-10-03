export async function processBatchWithConcurrency<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrencyLimit: number = 3
): Promise<{ successful: R[]; failed: Array<{ item: T; index: number; error: any }> }> {
  const successful: R[] = [];
  const failed: Array<{ item: T; index: number; error: any }> = [];
  
  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const batch = items.slice(i, i + concurrencyLimit);
    const batchWithIndices = batch.map((item, batchIndex) => ({
      item,
      originalIndex: i + batchIndex
    }));
    
    const results = await Promise.allSettled(
      batchWithIndices.map(({ item, originalIndex }) => 
        processor(item, originalIndex)
      )
    );
    
    results.forEach((result, batchIndex) => {
      const originalIndex = i + batchIndex;
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          item: batch[batchIndex],
          index: originalIndex,
          error: result.reason
        });
      }
    });
  }
  
  return { successful, failed };
}
