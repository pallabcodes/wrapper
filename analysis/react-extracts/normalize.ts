/**
 * Text Normalization Utility for Multi-line Code
 * 
 * Extracted from React's tooling for handling indentation in multi-line strings.
 */

export function normalizeIndent(strings: TemplateStringsArray, ...values: any[]): string {
  // Join the strings and values
  const joined = String.raw({ raw: strings }, ...values);
  
  // Find common leading whitespace
  const lines = joined.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim());
  if (nonEmptyLines.length === 0) return '';
  
  // Find minimum indentation across non-empty lines
  const minIndent = Math.min(
    ...nonEmptyLines.map(line => {
      const match = line.match(/^\s*/);
      return match ? match[0].length : 0;
    })
  );
  
  // Remove common indentation and trim surrounding newlines
  return lines
    .map(line => line.slice(minIndent))
    .join('\n')
    .trim();
}