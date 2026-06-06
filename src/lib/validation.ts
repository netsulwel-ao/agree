import { z } from 'zod';

// Contract validation schema
export const contractSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  content: z.string().min(1, 'O conteúdo é obrigatório'),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']),
  risk_level: z.enum(['low', 'medium', 'high']),
  value: z.number().min(0, 'O valor deve ser positivo').optional(),
  currency: z.string().default('AOA'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  client_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  auto_renew: z.boolean().default(false),
  renewal_period: z.enum(['monthly', 'quarterly', 'semi_annually', 'annually']).optional(),
  notification_days: z.number().min(1).max(365).default(30),
});

export type ContractFormData = z.infer<typeof contractSchema>;

// Client validation schema
export const clientSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(200, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50, 'Telefone muito longo').optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
  custom_fields: z.record(z.string(), z.any()).default({}),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Invoice validation schema
export const invoiceSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').max(200),
  description: z.string().max(1000).optional(),
  value: z.number().min(0.01, 'O valor deve ser positivo'),
  tax_rate: z.number().min(0).max(100).default(0),
  currency: z.string().default('AOA'),
  due_date: z.string().optional(),
  notes: z.string().max(2000).optional(),
  line_items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    total: z.number().min(0),
  })).default([]),
  payment_terms: z.string().max(500).optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Profile validation schema
export const profileSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  role: z.enum(['user', 'admin']).default('user'),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Template validation schema
export const templateSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(200),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  content: z.string().min(1, 'O conteúdo é obrigatório'),
  variables: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'date', 'currency']),
    required: z.boolean(),
  })).default([]),
});

export type TemplateFormData = z.infer<typeof templateSchema>;
