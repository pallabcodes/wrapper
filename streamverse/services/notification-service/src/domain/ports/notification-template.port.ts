export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export interface NotificationTemplate {
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string; // For email
  content: string;
  variables: string[]; // List of required variables
}

export interface ITemplateService {
  /**
   * Get a template by name
   */
  getTemplate(name: string): Promise<NotificationTemplate | null>;

  /**
   * Render a template with variables
   */
  renderTemplate(template: NotificationTemplate, variables: TemplateVariables): Promise<{
    subject?: string;
    content: string;
  }>;

  /**
   * Validate template variables
   */
  validateVariables(template: NotificationTemplate, variables: TemplateVariables): boolean;
}

export const TEMPLATE_SERVICE = Symbol('ITemplateService');
