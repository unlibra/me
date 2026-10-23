/**
 * File validation utilities
 * Simple MIME type validation (detailed validation is done on backend)
 *
 * Each check returns the error text in the page's language (`messages`, the
 * tool texts' `common.fileErrors`), or `null` when the file passes.
 */
import { formatMessage } from "../messages/format.ts";
import type { ToolMessages } from "../messages/en.ts";

/** The error texts of the file checks. */
export type FileErrorMessages = ToolMessages["common"]["fileErrors"];

/**
 * Validate file size
 * Common utility for all file types
 */
export function validateFileSize(
  file: File,
  maxSize: number,
  messages: FileErrorMessages,
): string | null {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return formatMessage(messages.tooLarge, { max: maxSizeMB });
  }
  return null;
}

/**
 * Validate file type using MIME type and file extension
 *
 * Note: Detailed format validation (magic numbers, corruption check, etc.)
 * is performed on the backend. This is just a quick pre-check for UX.
 *
 * Some browsers don't recognize HEIC/HEIF MIME types, so we also check extensions.
 */
export function validateImageFileType(
  file: File,
  messages: FileErrorMessages,
): string | null {
  // Check MIME type (set by browser based on file extension/content)
  if (file.type.startsWith("image/")) {
    return null;
  }

  // Fallback: Check file extension for formats that browsers may not recognize
  // (HEIC/HEIF often have no MIME type or application/octet-stream)
  const extension = file.name.split(".").pop()?.toLowerCase();
  const supportedExtensions = ["heic", "heif", "avif"];

  if (extension && supportedExtensions.includes(extension)) {
    return null;
  }

  return messages.selectImage;
}

/**
 * Validate SVG file
 * MIME type check + size check
 */
export function validateSvgFile(
  file: File,
  messages: FileErrorMessages,
  options: { maxSize?: number } = {},
): string | null {
  // MIME type check (SVG specific)
  if (file.type !== "image/svg+xml") {
    return messages.svgOnly;
  }

  // File size check
  if (options.maxSize) {
    const sizeError = validateFileSize(file, options.maxSize, messages);
    if (sizeError) return sizeError;
  }

  return null;
}

/**
 * Complete validation of image files
 * MIME type check + size check + optional dimension check
 */
export async function validateImageFile(
  file: File,
  messages: FileErrorMessages,
  options: {
    maxSize?: number;
    maxDimensions?: { width: number; height: number };
  } = {},
): Promise<string | null> {
  // MIME type check
  const typeError = validateImageFileType(file, messages);
  if (typeError) return typeError;

  // File size check
  if (options.maxSize) {
    const sizeError = validateFileSize(file, options.maxSize, messages);
    if (sizeError) return sizeError;
  }

  // Image dimensions check (optional)
  // Skip for formats that browsers don't natively support (HEIC/HEIF/AVIF)
  // Backend will validate dimensions for these formats
  if (options.maxDimensions) {
    try {
      const dimensions = await getImageDimensions(file);
      if (
        dimensions.width > options.maxDimensions.width ||
        dimensions.height > options.maxDimensions.height
      ) {
        return formatMessage(messages.dimensionsTooLarge, {
          width: options.maxDimensions.width,
          height: options.maxDimensions.height,
        });
      }
    } catch {
      // Error if image cannot be loaded (only for formats browser should support)
      return messages.loadFailed;
    }
  }

  return null;
}

/**
 * Get image dimensions
 */
async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
