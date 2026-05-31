import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

type SendMailOptions = {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly templateDir: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@resend.dev';
    this.fromName = this.configService.get<string>('RESEND_FROM_NAME') || 'PopFlix';
    this.templateDir =
      this.configService.get<string>('EMAIL_TEMPLATE_DIR') || path.join(process.cwd(), 'templates');

    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  private resolveTemplatePath(templateName: string) {
    const normalized = templateName.replace(/^\.?\//, '');
    return path.join(this.templateDir, `${normalized}.hbs`);
  }

  private async renderTemplate(templateName: string, context: Record<string, any> = {}) {
    const templatePath = this.resolveTemplatePath(templateName);
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const compiled = handlebars.compile(templateSource);
    return compiled(context);
  }

  async sendMail(options: SendMailOptions) {
    if (!this.resend) {
      throw new Error(
        'RESEND_API_KEY is not configured. Please set RESEND_API_KEY on the backend deployment.',
      );
    }

    const html =
      options.html ||
      (options.template
        ? await this.renderTemplate(options.template, options.context || {})
        : undefined);

    if (!html && !options.text) {
      throw new Error('Either html, text, or template must be provided.');
    }

    const { data, error } = await this.resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html,
      text: options.text,
    });

    if (error) {
      this.logger.error(`Resend email failed: ${error.message}`);
      throw error;
    }

    return data;
  }
}
