import sanitizeHtml from 'sanitize-html'

// Strip all HTML — for plain text fields (review body, gift messages, notes)
export function stripHtml(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim()
}

// Allow basic formatting only — for fields that may render as HTML (none currently, but future-safe)
export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
  }).trim()
}
