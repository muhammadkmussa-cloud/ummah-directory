/**
 * Safely format API error responses (strings, arrays of Pydantic error objects, or dictionary objects)
 * into a plain string suitable for React rendering.
 */
export function formatApiError(detail: any, fallbackMessage: string = 'An error occurred. Please try again.'): string {
  if (!detail) return fallbackMessage;
  if (typeof detail === 'string') return detail;
  
  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.msg || item.message || JSON.stringify(item);
        return String(item);
      })
      .join(', ');
  }

  if (typeof detail === 'object') {
    if (detail.msg) return detail.msg;
    if (detail.message) return detail.message;
    return JSON.stringify(detail);
  }

  return String(detail);
}
