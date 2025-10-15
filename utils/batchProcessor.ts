/**
 * Utility for processing items in batches with controlled concurrency
 */

export interface BatchProcessorOptions {
  concurrency?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, item: any, index: number) => void;
}

export interface BatchResult<T> {
  success: T[];
  errors: Array<{ index: number; item: any; error: Error }>;
  totalProcessed: number;
  totalErrors: number;
}

/**
 * Process items in batches with controlled concurrency
 */
export async function processBatch<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput, index: number) => Promise<TOutput>,
  options: BatchProcessorOptions = {}
): Promise<BatchResult<TOutput>> {
  const { concurrency = 3, onProgress, onError } = options;
  
  const results: TOutput[] = [];
  const errors: Array<{ index: number; item: TInput; error: Error }> = [];
  let processedCount = 0;

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, Math.min(i + concurrency, items.length));
    const batchStartIndex = i;

    // Process current batch in parallel
    const batchPromises = batch.map(async (item, batchIndex) => {
      const absoluteIndex = batchStartIndex + batchIndex;
      try {
        const result = await processor(item, absoluteIndex);
        processedCount++;
        
        if (onProgress) {
          onProgress(processedCount, items.length);
        }
        
        return { success: true as const, result, index: absoluteIndex };
      } catch (error) {
        processedCount++;
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (onError) {
          onError(err, item, absoluteIndex);
        }
        
        if (onProgress) {
          onProgress(processedCount, items.length);
        }
        
        return { success: false as const, error: err, item, index: absoluteIndex };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Collect results and errors
    for (const result of batchResults) {
      if (result.success) {
        results.push(result.result);
      } else {
        errors.push({
          index: result.index,
          item: result.item as TInput,
          error: result.error
        });
      }
    }
  }

  return {
    success: results,
    errors,
    totalProcessed: processedCount,
    totalErrors: errors.length
  };
}

/**
 * Process a 2D matrix of items (useful for JD x Resume matching)
 */
export interface MatrixProcessorOptions extends BatchProcessorOptions {
  processRowByRow?: boolean; // If true, process all items in a row before moving to next row
}

export async function processMatrix<TRow, TCol, TOutput>(
  rows: TRow[],
  cols: TCol[],
  processor: (row: TRow, col: TCol, rowIndex: number, colIndex: number) => Promise<TOutput>,
  options: MatrixProcessorOptions = {}
): Promise<BatchResult<TOutput & { rowIndex: number; colIndex: number }>> {
  const { concurrency = 3, onProgress, onError, processRowByRow = false } = options;
  
  const totalCombinations = rows.length * cols.length;
  const results: Array<TOutput & { rowIndex: number; colIndex: number }> = [];
  const errors: Array<{ index: number; item: any; error: Error }> = [];
  let processedCount = 0;

  if (processRowByRow) {
    // Process row by row (useful when you want to process all resumes for one JD at a time)
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      
      const rowProcessor = async (col: TCol, colIndex: number) => {
        const result = await processor(row, col, rowIndex, colIndex);
        return { ...result, rowIndex, colIndex };
      };

      const rowResult = await processBatch(
        cols,
        rowProcessor,
        {
          concurrency,
          onProgress: (processed, total) => {
            const overallProcessed = rowIndex * cols.length + processed;
            if (onProgress) {
              onProgress(overallProcessed, totalCombinations);
            }
          },
          onError: (error, item, index) => {
            if (onError) {
              onError(error, { row, col: item }, rowIndex * cols.length + index);
            }
          }
        }
      );

      results.push(...rowResult.success);
      errors.push(...rowResult.errors);
      processedCount += rowResult.totalProcessed;
    }
  } else {
    // Process all combinations with controlled concurrency
    const allCombinations: Array<{ row: TRow; col: TCol; rowIndex: number; colIndex: number }> = [];
    
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < cols.length; colIndex++) {
        allCombinations.push({
          row: rows[rowIndex],
          col: cols[colIndex],
          rowIndex,
          colIndex
        });
      }
    }

    const combinationProcessor = async (
      combo: { row: TRow; col: TCol; rowIndex: number; colIndex: number },
      index: number
    ) => {
      const result = await processor(combo.row, combo.col, combo.rowIndex, combo.colIndex);
      return { ...result, rowIndex: combo.rowIndex, colIndex: combo.colIndex };
    };

    const batchResult = await processBatch(
      allCombinations,
      combinationProcessor,
      { concurrency, onProgress, onError }
    );

    results.push(...batchResult.success);
    errors.push(...batchResult.errors);
    processedCount = batchResult.totalProcessed;
  }

  return {
    success: results,
    errors,
    totalProcessed: processedCount,
    totalErrors: errors.length
  };
}
