/**
 * Input Sanitization Utility
 * 
 * Provides functions to sanitize and validate user inputs
 * to prevent injection attacks and malicious payloads
 */

/**
 * Sanitize string input
 * - Removes potentially dangerous characters
 * - Trims whitespace
 * - Limits length
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove null bytes and other control characters (except common ones)
  let sanitized = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize URL
 * - Ensures URL is valid
 * - Prevents javascript: and data: protocols
 * - Allows only http/https
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    throw new Error('URL must be a string');
  }
  
  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      throw new Error(`Dangerous protocol detected: ${protocol}`);
    }
  }
  
  // Validate URL format
  try {
    const parsed = new URL(trimmed);
    
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only http and https protocols are allowed');
    }
    
    return parsed.href;
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

/**
 * Validate board name
 * - Alphanumeric, spaces, hyphens, underscores
 * - No special characters
 * - Length limits
 */
export function sanitizeBoardName(boardName: string): string {
  if (typeof boardName !== 'string') {
    throw new Error('Board name must be a string');
  }
  
  const trimmed = boardName.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Board name cannot be empty');
  }
  
  if (trimmed.length > 200) {
    throw new Error('Board name too long (max 200 characters)');
  }
  
  // Allow only alphanumeric, spaces, hyphens, underscores, and common device names
  const allowedPattern = /^[a-zA-Z0-9\s\-_\.]+$/;
  
  if (!allowedPattern.test(trimmed)) {
    throw new Error('Board name contains invalid characters');
  }
  
  return trimmed;
}

/**
 * Validate JSON input
 * - Ensures valid JSON
 * - Prevents deeply nested objects
 * - Limits size
 */
export function sanitizeJson(jsonString: string, maxSize: number = 1024 * 1024): any {
  if (typeof jsonString !== 'string') {
    throw new Error('JSON input must be a string');
  }
  
  if (jsonString.length > maxSize) {
    throw new Error('JSON input too large');
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Check for deep nesting (prevent DoS)
    const maxDepth = 20;
    let depth = 0;
    
    const checkDepth = (obj: any): void => {
      if (depth > maxDepth) {
        throw new Error('JSON object too deeply nested');
      }
      
      if (typeof obj === 'object' && obj !== null) {
        depth++;
        for (const key in obj) {
          checkDepth(obj[key]);
        }
        depth--;
      }
    };
    
    checkDepth(parsed);
    
    return parsed;
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return '';
  }
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
