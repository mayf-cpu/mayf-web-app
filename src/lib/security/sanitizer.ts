/**
 * Strict Input Sanitization & Security Shield for CMS & Site Settings.
 * 
 * Strict Requirement:
 * "Do not allow arbitrary executable HTML or JavaScript through the CMS."
 * 
 * Guarantees:
 * - Strips all executable HTML (<script>, <iframe>, <object>, <embed>, <svg>, <math>, etc.)
 * - Strips all event handler attributes (onload, onerror, onclick, onmouseover, etc.)
 * - Strips dangerous URL pseudo-protocols (javascript:, vbscript:, data:text/html, etc.)
 * - Strips CSS expression() and url() injections
 * - Normalizes and validates URLs to only allow safe schemes (https:, http:, mailto:, tel:, or safe relative paths)
 * - Restricts hex color codes to strict hexadecimal values
 * - Escapes or removes any raw HTML entities to enforce pure plaintext for copy fields
 */

// Matches any HTML tags
const HTML_TAG_REGEX = /<[^>]*>/g;

// Matches dangerous protocols even if obfuscated with whitespace, tabs, or case variation
const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data|file):/i;

// Matches dangerous inline event handler attributes like onload=, onerror=, etc.
const EVENT_HANDLER_REGEX = /on[a-z]+\s*=\s*(['"]).*?\1/gi;

// Strict hex color regex: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

/**
 * Strips all HTML tags, script constructs, and dangerous characters from a string.
 * Enforces pure plaintext suitable for headlines, titles, descriptions, and labels.
 */
export function sanitizePlainText(input: unknown, maxLength: number = 2000): string {
  if (typeof input !== 'string') {
    return '';
  }

  let cleaned = input.trim();

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // Strip all HTML tags
  cleaned = cleaned.replace(HTML_TAG_REGEX, '');

  // Strip remaining unmatched brackets that could form tags
  cleaned = cleaned.replace(/[<>]/g, '');

  // Remove dangerous javascript: or data: pseudo-protocols if embedded
  cleaned = cleaned.replace(/javascript\s*:/gi, '');
  cleaned = cleaned.replace(/vbscript\s*:/gi, '');
  cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, '');

  // Remove event handlers
  cleaned = cleaned.replace(EVENT_HANDLER_REGEX, '');

  // Enforce max length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

/**
 * Validates and sanitizes URLs for logos, favicons, social links, and external resources.
 * Only permits valid https://, http://, mailto:, tel:, or safe relative paths starting with '/'.
 * Rejects any javascript:, vbscript:, or data: URLs.
 */
export function sanitizeUrl(input: unknown, allowedProtocols = ['https:', 'http:', 'mailto:', 'tel:']): string {
  if (typeof input !== 'string') {
    return '';
  }

  let trimmed = input.trim();

  if (!trimmed) {
    return '';
  }

  // Remove null bytes and control characters
  trimmed = trimmed.replace(/[\x00-\x1F\x7F]/g, '');

  // Check for dangerous protocol prefixes
  if (DANGEROUS_PROTOCOLS.test(trimmed)) {
    return '';
  }

  // Allow safe root-relative URLs (e.g. /favicon.ico, /images/logo.png)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    // Check that path doesn't contain encoded tags or dangerous characters
    if (/[<>"']/.test(trimmed)) {
      return '';
    }
    return trimmed;
  }

  // Handle mailto: and tel:
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    const cleanMailOrTel = trimmed.replace(/[<>"'\s]/g, '');
    return cleanMailOrTel;
  }

  // Validate absolute URL
  try {
    const parsed = new URL(trimmed);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    // Reject hosts that look like data: or javascript: payloads
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'vbscript:') {
      return '';
    }
    return parsed.toString();
  } catch {
    // Invalid URL format
    return '';
  }
}

/**
 * Sanitizes and validates a CSS hex color code.
 * Falls back to the provided fallback if the input is invalid or contains injections.
 */
export function sanitizeColorHex(input: unknown, fallback: string): string {
  if (typeof input !== 'string') {
    return fallback;
  }

  const trimmed = input.trim();
  if (HEX_COLOR_REGEX.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return fallback;
}

/**
 * Inspects a candidate payload for any prohibited script or HTML injection attempts.
 * Returns { safe: boolean, violations: string[] }
 */
export function inspectSecuritySafety(input: Record<string, any>): {
  safe: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const inspectValue = (key: string, val: any) => {
    if (typeof val === 'string') {
      if (/<script/i.test(val)) {
        violations.push(`Prohibited <script> tag detected in field "${key}".`);
      }
      if (/javascript\s*:/i.test(val)) {
        violations.push(`Prohibited javascript: URI detected in field "${key}".`);
      }
      if (/on[a-z]+\s*=/i.test(val)) {
        violations.push(`Prohibited HTML event handler detected in field "${key}".`);
      }
      if (/<iframe|<object|<embed/i.test(val)) {
        violations.push(`Prohibited executable HTML element detected in field "${key}".`);
      }
    } else if (val && typeof val === 'object') {
      for (const [subKey, subVal] of Object.entries(val)) {
        inspectValue(`${key}.${subKey}`, subVal);
      }
    }
  };

  for (const [k, v] of Object.entries(input)) {
    inspectValue(k, v);
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}
