/**
 * @file lib/utils.ts
 * @description Collection of general utility functions used across various components and services.
 */

/**
 * Formats a Date object or a date string into a readable date and time string.
 * @param dateInput - The date to format, can be a Date object, a string, or a number (timestamp).
 * @param locale - The locale to use for formatting (e.g., 'en-US', 'de-DE'). Defaults to 'en-US'.
 * @param options - Optional formatting options for `Intl.DateTimeFormat`.
 * @returns A formatted date and time string, or "Invalid Date" if the input is not a valid date.
 */
export function formatDateTime(
  dateInput: Date | string | number,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }
): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Formats a number as currency.
 * @param amount - The number to format.
 * @param currency - The currency code (e.g., 'USD', 'EUR'). Defaults to 'USD'.
 * @param locale - The locale to use for formatting. Defaults to 'en-US'.
 * @param options - Optional formatting options for `Intl.NumberFormat`.
 * @returns A formatted currency string, or "N/A" if the input is not a valid number.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = { style: 'currency', currencyDisplay: 'symbol' }
): string {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return "N/A";
    }
    return new Intl.NumberFormat(locale, { ...options, currency }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "N/A";
  }
}

/**
 * Capitalizes the first letter of a string.
 * @param str - The input string.
 * @returns The string with its first letter capitalized, or an empty string if the input is null/undefined.
 */
export function capitalizeFirstLetter(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates a string to a specified length, adding an ellipsis if it exceeds the length.
 * @param str - The input string.
 * @param maxLength - The maximum length of the string before truncation.
 * @returns The truncated string.
 */
export function truncateString(str: string | null | undefined, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + '...';
}

/**
 * Generates a random unique ID.
 * @param prefix - An optional prefix for the ID.
 * @returns A unique string ID.
 */
export function generateUniqueId(prefix: string = ''): string {
  return prefix + Math.random().toString(36).substring(2, 9);
}

/**
 * Debounces a function, ensuring it's not called too frequently.
 * @param func - The function to debounce.
 * @param delay - The delay in milliseconds.
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    const later = function() {
      timeout = null;
      func.apply(context, args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, delay);
  };
}

/**
 * Throttles a function, ensuring it's called at most once within a given time frame.
 * @param func - The function to throttle.
 * @param limit - The time limit in milliseconds.
 * @returns A throttled version of the function.
 */
export function throttle<T extends (...args: any[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
      lastResult = func.apply(context, args) as ReturnType<T>;
    }
    return lastResult;
  };
}


/**
 * Converts a string to a URL-friendly slug.
 * @param str - The input string.
 * @returns A URL-friendly slug.
 */
export function slugify(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD') // Normalize diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

/**
 * Parses query parameters from a URL string.
 * @param url - The URL string to parse. Defaults to `window.location.search` if not provided.
 * @returns An object containing key-value pairs of query parameters.
 */
export function getQueryParams(url: string = typeof window !== 'undefined' ? window.location.search : ''): Record<string, string> {
  const params: Record<string, string> = {};
  if (!url) return params;

  const queryString = url.startsWith('?') ? url.substring(1) : url;
  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  return params;
}

/**
 * Generates a random integer within a specified range (inclusive).
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A random integer.
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Converts bytes to a human-readable size string (e.g., "1.23 GB").
 * @param bytes - The number of bytes.
 * @param decimals - The number of decimal places to include. Defaults to 2.
 * @returns A human-readable size string.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Compares two objects for deep equality.
 * Handles primitive values, arrays, and plain objects.
 * @param obj1 - The first object to compare.
 * @param obj2 - The second object to compare.
 * @returns True if the objects are deeply equal, false otherwise.
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (obj1 && typeof obj1 === 'object' && obj2 && typeof obj2 === 'object') {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false; // One is array, other is not

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param value - The number to clamp.
 * @param min - The minimum allowed value.
 * @param max - The maximum allowed value.
 * @returns The clamped number.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Simple hash function for strings. Not cryptographically secure, but useful for generating
 * consistent IDs or keys from strings.
 * @param str The string to hash.
 * @returns A numerical hash.
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Parses a JSON string safely, returning null if parsing fails.
 * @param jsonString The JSON string to parse.
 * @returns The parsed object or null if parsing failed.
 */
export function safeJsonParse<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn("Failed to parse JSON string:", error);
    return null;
  }
}

/**
 * Safely stringifies a JavaScript object to JSON.
 * Handles circular references by replacing them with '[Circular]'.
 * @param obj The object to stringify.
 * @param space The number of spaces to use for indentation.
 * @returns The JSON string or null if an error occurred.
 */
export function safeJsonStringify(obj: any, space?: number): string | null {
  const cache: any[] = [];
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.includes(value)) {
          // Circular reference found, discard key
          return '[Circular]';
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    }, space);
  } catch (error) {
    console.warn("Failed to stringify object to JSON:", error);
    return null;
  }
}

/**
 * Converts a base64 string to a Blob object.
 * @param base64 The base64 string.
 * @param contentType The content type of the blob (e.g., 'image/png').
 * @returns A Blob object.
 */
export function base64ToBlob(base64: string, contentType: string = ''): Blob {
  const sliceSize = 512;
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * Downloads a file given its data (e.g., Blob, File) and filename.
 * @param data The file data (Blob or File).
 * @param filename The name of the file to download.
 */
export function downloadFile(data: Blob | File, filename: string): void {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copies text to the clipboard.
 * @param text The text to copy.
 * @returns A Promise that resolves if the text was copied successfully, or rejects with an error.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text to clipboard (navigator.clipboard):', err);
      // Fallback for older browsers or insecure contexts if needed, though writeText is widely supported.
      throw err;
    }
  } else {
    // Fallback for extremely old browsers or environments without clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Avoid scrolling to bottom
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text to clipboard (execCommand):', err);
      throw err;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Converts an object's keys from snake_case to camelCase.
 * Recursively converts keys in nested objects and arrays.
 * @param obj The object with snake_case keys.
 * @returns A new object with camelCase keys.
 */
export function snakeToCamelCase<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item: any) => snakeToCamelCase(item)) as T;
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      newObj[camelKey] = snakeToCamelCase(obj[key]);
    }
  }
  return newObj as T;
}

/**
 * Converts an object's keys from camelCase to snake_case.
 * Recursively converts keys in nested objects and arrays.
 * @param obj The object with camelCase keys.
 * @returns A new object with snake_case keys.
 */
export function camelToSnakeCase<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item: any) => camelToSnakeCase(item)) as T;
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = camelToSnakeCase(obj[key]);
    }
  }
  return newObj as T;
}