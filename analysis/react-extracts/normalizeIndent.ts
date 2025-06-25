/**
 * Text Normalization Utility for Multi-line Code
 * 
 * Actual code extracted from React's codebase
 */

/**
 * A string template tag that removes padding from the left side of multi-line strings
 */
function normalizeIndent(strings: TemplateStringsArray, ...values: any[]): string {
  const raw = String.raw({ raw: strings }, ...values);
  
  // Find all non-empty lines
  const lines = raw.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim());
  
  if (nonEmptyLines.length === 0) {
    return '';
  }
  
  // Find the minimum indentation across non-empty lines
  const minIndent = Math.min(
    ...nonEmptyLines.map(line => {
      const match = line.match(/^[\s\t]*/);
      return match ? match[0].length : 0;
    })
  );
  
  // Remove the common indentation from each line
  return lines
    .map(line => line.slice(minIndent))
    .join('\n')
    .trim();
}

// Repurposable areas or scenarios
// - Code generation tools
// - Testing libraries with code examples
// - Documentation systems
// - Template engines
// - CLI tools displaying formatted text
// - Code snippet formatting in editors
// - Log formatting with proper indentation

// Code example: Template engine with clean indentation
export function buildTemplate(template: string, data: Record<string, any>): string {
  const compiled = normalizeIndent`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title}</title>
        <meta charset="UTF-8">
        ${data.meta ? data.meta.map((m: any) => `<meta name="${m.name}" content="${m.content}">`).join('\n') : ''}
      </head>
      <body>
        <div id="root">
          ${data.content}
        </div>
        <script>
          ${data.script}
        </script>
      </body>
    </html>
  `;
  
  return compiled;
}

export { normalizeIndent };