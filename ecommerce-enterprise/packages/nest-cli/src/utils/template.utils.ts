export class TemplateUtils {
  static toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  static toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  static toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  static toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  static replacePlaceholders(template: string, placeholders: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(placeholders)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }

  static generateClassName(name: string): string {
    return this.toPascalCase(name);
  }

  static generateFileName(name: string): string {
    return this.toKebabCase(name);
  }

  static generateVariableName(name: string): string {
    return this.toCamelCase(name);
  }

  static generateConstantName(name: string): string {
    return this.toSnakeCase(name).toUpperCase();
  }
}

