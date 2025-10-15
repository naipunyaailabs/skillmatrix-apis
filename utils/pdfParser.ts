import { extractText } from "unpdf";

// Add error handling and logging
const logger = {
  info: (message: string) => console.log(`[PDF Parser] ${message}`),
  error: (message: string, error: unknown) => console.error(`[PDF Parser Error] ${message}:`, error)
};

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    logger.info('Starting PDF text extraction');
    logger.info(`Buffer size: ${buffer.length} bytes`);
    
    const uint8Array = new Uint8Array(buffer);
    const result = await extractText(uint8Array);
    
    logger.info(`Extraction result type: ${typeof result.text}, isArray: ${Array.isArray(result.text)}`);
    
    // Normalize text output
    let text = "";
    if (Array.isArray(result.text)) {
      text = result.text.map(t => (typeof t === "string" ? t : "")).join('\n').trim();
    } else if (typeof result.text === "string") {
      text = (result.text as string).trim();
    } else {
      text = "";
    }
    
    logger.info(`PDF text extraction completed - Extracted ${text.length} characters`);
    
    // Log first 200 characters for debugging
    if (text.length > 0) {
      logger.info(`First 200 chars: ${text.substring(0, 200)}...`);
    } else {
      logger.error('WARNING: Extracted text is EMPTY!', null);
    }
    
    return text;
  } catch (error) {
    logger.error('Failed to extract PDF text', error);
    throw new Error('PDF text extraction failed');
  }
}