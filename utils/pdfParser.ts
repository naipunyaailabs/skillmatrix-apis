import { extractText } from "unpdf";

// Add error handling and logging
const logger = {
  info: (message: string) => console.log(`[PDF Parser] ${message}`),
  error: (message: string, error: unknown) => console.error(`[PDF Parser Error] ${message}:`, error)
};

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    logger.info('Starting PDF text extraction');
    const uint8Array = new Uint8Array(buffer);
    const result = await extractText(uint8Array);
    
    // Normalize text output
    let text = "";
    if (Array.isArray(result.text)) {
      text = result.text.map(t => (typeof t === "string" ? t : "")).join('\n').trim();
    } else if (typeof result.text === "string") {
      text = (result.text as string).trim();
    } else {
      text = "";
    }
    
    logger.info('PDF text extraction completed successfully');
    return text;
  } catch (error) {
    logger.error('Failed to extract PDF text', error);
    throw new Error('PDF text extraction failed');
  }
}