import { supabase } from '../supabase';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

export interface EmailTemplate {
  id?: string;
  type: 'welcome' | 'password_reset' | 'subscription_confirmed' | 'payment_failed' | 'trial_ending';
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'email')
      .single();

    if (error) throw error;
    if (data) return data.data as EmailConfig;
    return null;
  } catch (error) {
    console.error('Error getting email config:', error);
    return null;
  }
}

export async function saveEmailConfig(config: EmailConfig) {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        id: 'email',
        data: config,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving email config:', error);
    throw error;
  }
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*');

    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      subject: item.subject,
      body: item.body,
      variables: item.variables || [],
      isActive: item.is_active,
    }));
  } catch (error) {
    console.error('Error getting email templates:', error);
    return [];
  }
}

export async function saveEmailTemplate(template: EmailTemplate) {
  try {
    const row: any = {
      type: template.type,
      subject: template.subject,
      body: template.body,
      variables: template.variables,
      is_active: template.isActive,
      updated_at: new Date().toISOString(),
    };

    if (template.id) {
      const { error } = await supabase
        .from('email_templates')
        .update(row)
        .eq('id', template.id);

      if (error) throw error;
    } else {
      row.created_at = new Date().toISOString();
      const { error } = await supabase
        .from('email_templates')
        .insert(row);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving email template:', error);
    throw error;
  }
}

export async function sendEmail(to: string, templateType: string, variables: Record<string, string>) {
  try {
    const config = await getEmailConfig();
    if (!config?.enabled) {
      console.log('Email sending disabled');
      return { success: false, message: 'Email disabled' };
    }

    const templates = await getEmailTemplates();
    const template = templates.find(t => t.type === templateType && t.isActive);
    if (!template) {
      throw new Error(`Template not found: ${templateType}`);
    }

    let body = template.body;
    let subject = template.subject;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    console.log('Sending email:', { to, subject, body, config });

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, config }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export const defaultTemplates: Omit<EmailTemplate, 'id'>[] = [
  {
    type: 'welcome',
    subject: 'Bem-vindo à Kernel Barber SaaS, {{name}}!',
    body: `Olá {{name}},

Bem-vindo à Kernel Barber SaaS! Sua conta foi criada com sucesso.

Detalhes da sua assinatura:
- Plano: {{plan}}
- Valor: {{price}}
- Status: {{status}}

Acesse agora: {{login_url}}

Equipe Kernel Barber`,
    variables: ['name', 'plan', 'price', 'status', 'login_url'],
    isActive: true,
  },
  {
    type: 'password_reset',
    subject: 'Recuperação de Senha - Kernel Barber',
    body: `Olá {{name}},

Você solicitou a recuperação de senha. Clique no link abaixo para redefinir:

{{reset_url}}

Este link expira em 1 hora.

Se você não solicitou, ignore este email.`,
    variables: ['name', 'reset_url'],
    isActive: true,
  },
  {
    type: 'subscription_confirmed',
    subject: 'Assinatura Confirmada - {{plan}}',
    body: `Parabéns {{name}}!

Sua assinatura do plano {{plan}} foi confirmada com sucesso.

Valor: {{price}}/mês
Próxima cobrança: {{next_billing_date}}

Obrigado por escolher a Kernel Barber!`,
    variables: ['name', 'plan', 'price', 'next_billing_date'],
    isActive: true,
  },
  {
    type: 'payment_failed',
    subject: 'Falha no Pagamento - Kernel Barber',
    body: `Olá {{name}},

Houve uma falha ao processar seu pagamento do plano {{plan}}.

Motivo: {{failure_reason}}

Por favor, atualize seus dados de pagamento: {{update_payment_url}}`,
    variables: ['name', 'plan', 'failure_reason', 'update_payment_url'],
    isActive: true,
  },
  {
    type: 'trial_ending',
    subject: 'Seu período de teste está acabando!',
    body: `Olá {{name}},

Seu período de teste do plano {{plan}} termina em {{trial_end_date}}.

Para continuar usando, escolha um plano: {{pricing_url}}`,
    variables: ['name', 'plan', 'trial_end_date', 'pricing_url'],
    isActive: true,
  },
];
