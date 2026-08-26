/**
 * Utility to strip HTML tags, decode HTML entities, and remove Markdown symbols 
 * from job titles, descriptions, and company names.
 */
export const cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  let cleaned = text;

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '• ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Convert HTML block / break elements into line breaks or bullets
  cleaned = cleaned
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '');

  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Strip Markdown formatting
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove ** bold
    .replace(/\*(.*?)\*/g, '$1')   // remove * italic
    .replace(/\\(.*?)/g, '$1')      // remove backslash escapes
    .replace(/###\s+(.*)/g, '$1')  // remove ### headings
    .replace(/##\s+(.*)/g, '$1')   // remove ## headings
    .replace(/#\s+(.*)/g, '$1')   // remove # headings
    .replace(/`([^`]+)`/g, '$1'); // remove code backticks

  // Normalize excessive blank lines
  return cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
    .trim();
};
