import { supabase } from '../lib/supabase';

export const Actions = {
  CONTRACT_CREATE: 'contract.create',
  CONTRACT_UPDATE: 'contract.update',
  CONTRACT_DELETE: 'contract.delete',
  CONTRACT_VIEW: 'contract.view',
  CONTRACT_APPROVE: 'contract.approve',
  CONTRACT_REJECT: 'contract.reject',
  CONTRACT_SUBMIT: 'contract.submit',
  CONTRACT_RESUBMIT: 'contract.resubmit',
  CONTRACT_EXPORT_PDF: 'contract.export_pdf',
  SIGNATURE_SEND: 'signature.send',
  SIGNATURE_SIGN: 'signature.sign',
  SIGNATURE_REMIND: 'signature.remind',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_UPDATE: 'invoice.update',
  INVOICE_DELETE: 'invoice.delete',
  INVOICE_STATUS_CHANGE: 'invoice.status_change',
  INVOICE_EXPORT_PDF: 'invoice.export_pdf',
  TEMPLATE_CREATE: 'template.create',
  TEMPLATE_UPDATE: 'template.update',
  TEMPLATE_DELETE: 'template.delete',
  CLIENT_CREATE: 'client.create',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',
  APPROVAL_WORKFLOW_START: 'approval.start',
  APPROVAL_APPROVE: 'approval.approve',
  APPROVAL_REJECT: 'approval.reject',
  APPROVAL_WORKFLOW_CONFIG: 'approval.workflow_config',
  LOGIN: 'auth.login',
  NOTIFICATION_SEND: 'notification.send',
} as const;

interface LogEntry {
  user_id: string;
  user_name?: string;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  resource_name?: string;
  status?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(entry: LogEntry) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      user_name: entry.user_name || null,
      user_email: entry.user_email || null,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      resource_name: entry.resource_name || null,
      status: entry.status || 'success',
      details: entry.details || {},
    });
    if (error) console.error('Audit log insert error:', error);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
