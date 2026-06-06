import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AuditEntry {
  id: string;
  created_at?: string;
  timestamp: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  resource_name: string | null;
  status: string;
  details: Record<string, any>;
  ip_address: string | null;
}

export function useAuditLogs(filters?: {
  action?: string;
  resource?: string;
  userId?: string;
  resourceId?: string;
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('id,created_at,user_id,user_name,user_email,action,resource,resource_id,resource_name,status,details,ip_address')
        .order('created_at', { ascending: false });

      if (filters?.action) query = query.eq('action', filters.action);
      if (filters?.resource) query = query.eq('resource', filters.resource);
      if (filters?.userId) query = query.eq('user_id', filters.userId);
      if (filters?.resourceId) query = query.eq('resource_id', filters.resourceId);
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as AuditEntry[];
    },
  });
}

// Helper to format action for display
export function formatAction(action: string): string {
  const map: Record<string, string> = {
    'contract.create': 'Criou contrato',
    'contract.update': 'Actualizou contrato',
    'contract.delete': 'Eliminou contrato',
    'contract.view': 'Visualizou contrato',
    'contract.approve': 'Aprovou contrato',
    'contract.reject': 'Rejeitou contrato',
    'contract.submit': 'Submeteu contrato',
    'contract.resubmit': 'Re-submeteu contrato',
    'contract.export_pdf': 'Exportou PDF do contrato',
    'signature.send': 'Enviou pedido de assinatura',
    'signature.sign': 'Assinou documento',
    'signature.remind': 'Enviou lembrete de assinatura',
    'invoice.create': 'Criou factura',
    'invoice.update': 'Actualizou factura',
    'invoice.delete': 'Eliminou factura',
    'invoice.status_change': 'Alterou estado da factura',
    'invoice.export_pdf': 'Exportou PDF da factura',
    'template.create': 'Criou modelo',
    'template.update': 'Actualizou modelo',
    'template.delete': 'Eliminou modelo',
    'client.create': 'Criou cliente',
    'client.update': 'Actualizou cliente',
    'client.delete': 'Eliminou cliente',
    'approval.start': 'Iniciou workflow de aprovação',
    'approval.approve': 'Aprovou pedido',
    'approval.reject': 'Rejeitou pedido',
    'approval.workflow_config': 'Configurou workflow',
    'auth.login': 'Iniciou sessão',
    'notification.send': 'Enviou notificação',
  };
  return map[action] || action;
}

export function formatResource(resource: string): string {
  const map: Record<string, string> = {
    contract: 'Contrato',
    invoice: 'Factura',
    template: 'Modelo',
    client: 'Cliente',
    signature: 'Assinatura',
    approval: 'Aprovação',
    notification: 'Notificação',
  };
  return map[resource] || resource;
}
