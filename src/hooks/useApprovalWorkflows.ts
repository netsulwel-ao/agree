import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface WorkflowStep {
  id: string;
  created_at: string;
  workflow_id: string;
  step_order: number;
  name: string;
  min_value: number | null;
  max_value: number | null;
  min_risk_level: string | null;
  max_risk_level: string | null;
  required_approvers: number;
  approvers?: StepApprover[];
}

export interface StepApprover {
  id: string;
  created_at: string;
  step_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

export interface ApprovalWorkflow {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string;
  steps?: WorkflowStep[];
}

export interface ApprovalRequest {
  id: string;
  created_at: string;
  updated_at: string;
  contract_id: string;
  workflow_id: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  current_step_id: string | null;
  current_step_order: number | null;
  created_by: string;
  completed_at: string | null;
}

export interface ApprovalRecord {
  id: string;
  created_at: string;
  request_id: string;
  step_id: string;
  user_id: string;
  status: 'approved' | 'rejected';
  comment: string | null;
}

// ─── Workflows ───────────────────────────────────────────

export function useApprovalWorkflows(includeInactive = false) {
  return useQuery({
    queryKey: ['approval-workflows'],
    queryFn: async () => {
      let query = supabase
        .from('approval_workflows')
        .select('*, steps:approval_workflow_steps(*)')
        .order('name');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const workflows = (data || []) as ApprovalWorkflow[];
      // Fetch approvers for each step
      for (const wf of workflows) {
        if (wf.steps && wf.steps.length > 0) {
          const stepIds = wf.steps.map(s => s.id);
          const { data: approvers } = await supabase
            .from('approval_workflow_step_approvers')
            .select('*, user:user_id(id, email, user_metadata)')
            .in('step_id', stepIds);
          if (approvers) {
            for (const step of wf.steps) {
              (step as any).approvers = approvers.filter(a => a.step_id === step.id);
            }
          }
        }
      }
      return workflows;
    },
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: wf, error } = await supabase
        .from('approval_workflows')
        .insert({ name: data.name, description: data.description || '' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return wf;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('approval_workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('approval_workflows').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

// ─── Steps ───────────────────────────────────────────────

export function useCreateStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workflow_id: string;
      step_order: number;
      name: string;
      min_value?: number | null;
      max_value?: number | null;
      min_risk_level?: string | null;
      max_risk_level?: string | null;
      required_approvers?: number;
    }) => {
      const { data: step, error } = await supabase
        .from('approval_workflow_steps')
        .insert(data)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return step;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

export function useUpdateStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; min_value?: number | null; max_value?: number | null; min_risk_level?: string | null; max_risk_level?: string | null; required_approvers?: number; step_order?: number }) => {
      const { data, error } = await supabase
        .from('approval_workflow_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

export function useDeleteStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('approval_workflow_steps').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

// ─── Step Approvers ──────────────────────────────────────

export function useAddApprover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { step_id: string; user_id: string }) => {
      const { data: app, error } = await supabase
        .from('approval_workflow_step_approvers')
        .insert(data)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return app;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

export function useRemoveApprover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('approval_workflow_step_approvers').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approval-workflows'] }),
  });
}

// ─── Approval Requests ───────────────────────────────────

export function useApprovalRequests(statusFilter?: string) {
  return useQuery({
    queryKey: ['approval-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('approval_requests')
        .select('*, contract:contracts(id, title, value, risk_level, status), workflow:approval_workflows(name)')
        .order('created_at', { ascending: false });
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as (ApprovalRequest & { contract: any; workflow: any })[];
    },
  });
}

export function useCreateApprovalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { contract_id: string; workflow_id: string }) => {
      // Determine the first step
      const { data: firstStep } = await supabase
        .from('approval_workflow_steps')
        .select('id, step_order')
        .eq('workflow_id', data.workflow_id)
        .order('step_order', { ascending: true })
        .limit(1)
        .single();

      const { data: req, error } = await supabase
        .from('approval_requests')
        .insert({
          contract_id: data.contract_id,
          workflow_id: data.workflow_id,
          status: 'in_progress',
          current_step_id: firstStep?.id || null,
          current_step_order: firstStep?.step_order || 0,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return req;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['contract'] });
    },
  });
}

export function useApproveAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ request_id, step_id, comment }: { request_id: string; step_id: string; comment?: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('approval_request_approvals').insert({
        request_id,
        step_id,
        user_id: user.id,
        status: 'approved',
        comment: comment || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['approval-request'] });
      queryClient.invalidateQueries({ queryKey: ['contract'] });
    },
  });
}

export function useRejectAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ request_id, comment }: { request_id: string; comment?: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('reject_approval_request', {
        p_request_id: request_id,
        p_user_id: user.id,
        p_comment: comment || '',
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['approval-request'] });
      queryClient.invalidateQueries({ queryKey: ['contract'] });
    },
  });
}

export function useApprovalRequestDetail(requestId: string | undefined) {
  return useQuery({
    queryKey: ['approval-request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data: req, error } = await supabase
        .from('approval_requests')
        .select('*, contract:contracts(*), workflow:approval_workflows(*, steps:approval_workflow_steps(*))')
        .eq('id', requestId)
        .single();
      if (error) throw new Error(error.message);

      // Get approvals for this request
      const { data: approvals } = await supabase
        .from('approval_request_approvals')
        .select('*, user:user_id(id, email, user_metadata)')
        .eq('request_id', requestId);

      // Get approvers for each step
      const wf = req.workflow as any;
      if (wf?.steps) {
        const stepIds = wf.steps.map((s: any) => s.id);
        const { data: approvers } = await supabase
          .from('approval_workflow_step_approvers')
          .select('*, user:user_id(id, email, user_metadata)')
          .in('step_id', stepIds);
        if (approvers) {
          for (const step of wf.steps) {
            (step as any).approvers = approvers.filter((a: any) => a.step_id === step.id);
          }
        }
      }

      return { ...req, approvals: approvals || [] };
    },
    enabled: !!requestId,
  });
}

// ─── Available approvers (users) ─────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });
}
