/**
 * File Downloader Utility
 * Downloads files from URLs and converts them to File objects
 */

export interface DownloadResult {
  file: File;
  url: string;
  size: number;
}

export interface DownloadError {
  url: string;
  error: string;
}

/**
 * Download a file from a URL and convert it to a File object
 */
export async function downloadFileFromUrl(url: string, filename?: string): Promise<File> {
  try {
    // Fetch the file
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    // Get the blob
    const blob = await response.blob();
    
    // Extract filename from URL if not provided
    if (!filename) {
      const urlPath = new URL(url).pathname;
      filename = urlPath.split('/').pop() || 'document.pdf';
    }
    
    // Create File object from Blob
    const file = new File([blob], filename, { type: contentType });
    
    return file;
  } catch (error) {
    throw new Error(`Failed to download file from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Download multiple files from URLs with progress tracking
 */
export async function downloadMultipleFiles(
  urls: string[],
  onProgress?: (downloaded: number, total: number) => void
): Promise<{
  successful: DownloadResult[];
  failed: DownloadError[];
}> {
  const successful: DownloadResult[] = [];
  const failed: DownloadError[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    try {
      const file = await downloadFileFromUrl(url);
      successful.push({
        file,
        url,
        size: file.size
      });
      
      if (onProgress) {
        onProgress(i + 1, urls.length);
      }
    } catch (error) {
      failed.push({
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (onProgress) {
        onProgress(i + 1, urls.length);
      }
    }
  }
  
  return { successful, failed };
}

/**
 * Validate URL format
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate array of URLs
 */
export function validateUrls(urls: string[]): { valid: boolean; error?: string; invalidUrls?: string[] } {
  if (!Array.isArray(urls)) {
    return { valid: false, error: 'URLs must be provided as an array' };
  }
  
  if (urls.length === 0) {
    return { valid: false, error: 'At least one URL must be provided' };
  }
  
  const invalidUrls = urls.filter(url => !isValidUrl(url));
  
  if (invalidUrls.length > 0) {
    return {
      valid: false,
      error: `Invalid URL format(s) detected`,
      invalidUrls
    };
  }
  
  return { valid: true };
}
