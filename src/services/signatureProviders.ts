import { supabase } from '../lib/supabase';

export interface Signer {
  name: string;
  email: string;
  role?: string;
  order?: number;
}

export interface ProviderConfig {
  base_url: string;
  api_key?: string;
  client_id?: string;
  account_id?: string;
  webhook_secret?: string;
}

export interface SignatureProvider {
  id: string;
  name: string;
  label: string;
  is_active: boolean;
  config: ProviderConfig;
  sort_order: number;
}

export interface SignatureRequest {
  id: string;
  created_at: string;
  contract_id: string;
  provider_id: string;
  provider_request_id: string | null;
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined' | 'error' | 'voided';
  signers: SignerStatus[];
  created_by: string;
  envelope_url: string | null;
  error_message: string | null;
}

interface SignerStatus extends Signer {
  status: 'awaiting' | 'viewed' | 'signed' | 'declined';
  signed_at?: string;
}

// ─── Database helpers ─────────────────────────────────

export async function getActiveProviders(): Promise<SignatureProvider[]> {
  const { data } = await supabase
    .from('signature_providers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}

export async function getAllProviders(): Promise<SignatureProvider[]> {
  const { data } = await supabase
    .from('signature_providers')
    .select('*')
    .order('sort_order');
  return data || [];
}

export async function getRequestsForContract(contractId: string): Promise<SignatureRequest[]> {
  const { data } = await supabase
    .from('signature_requests')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Provider implementions ────────────────────────────

interface ProviderApi {
  sendEnvelope(params: {
    title: string;
    content: string;
    signers: Signer[];
    config: ProviderConfig;
  }): Promise<{ requestId: string; envelopeUrl?: string }>;
  getStatus(params: { requestId: string; config: ProviderConfig }): Promise<{
    status: string;
    signers: SignerStatus[];
  }>;
  voidEnvelope(params: { requestId: string; config: ProviderConfig; reason?: string }): Promise<void>;
}

const providers: Record<string, ProviderApi> = {
  docusign: {
    async sendEnvelope({ title, content, signers, config }) {
      const res = await fetch(`${config.base_url}/v2.1/accounts/${config.account_id}/envelopes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailSubject: title,
          documents: [{
            documentId: '1',
            name: `${title}.html`,
            htmlDefinition: { source: content },
          }],
          recipients: {
            signers: signers.map((s, i) => ({
              email: s.email,
              name: s.name,
              recipientId: String(i + 1),
              routingOrder: s.order || String(i + 1),
              tabs: { signHereTabs: [{ documentId: '1', pageNumber: '1', xPosition: '100', yPosition: '700' }] },
            })),
          },
          status: 'sent',
        }),
      });
      if (!res.ok) throw new Error(`DocuSign error: ${await res.text()}`);
      const data = await res.json();
      return { requestId: data.envelopeId };
    },

    async getStatus({ requestId, config }) {
      const res = await fetch(`${config.base_url}/v2.1/accounts/${config.account_id}/envelopes/${requestId}`, {
        headers: { Authorization: `Bearer ${config.api_key}` },
      });
      if (!res.ok) throw new Error(`DocuSign error: ${await res.text()}`);
      const data = await res.json();
      return {
        status: data.status === 'completed' ? 'signed' : data.status === 'declined' ? 'declined' : data.status,
        signers: (data.recipients?.signers || []).map((s: any) => ({
          name: s.name,
          email: s.email,
          status: s.status === 'signed' ? 'signed' as const : s.status === 'declined' ? 'declined' as const : 'awaiting' as const,
          signed_at: s.signedDateTime,
        })),
      };
    },

    async voidEnvelope({ requestId, config, reason }) {
      await fetch(`${config.base_url}/v2.1/accounts/${config.account_id}/envelopes/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${config.api_key}` },
        body: JSON.stringify({ voidedReason: reason || 'Voided by user' }),
      });
    },
  },
  hellosign: {
    async sendEnvelope({ title, content, signers, config }) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', title);
      formData.append('message', 'Please sign this document');
      formData.append('signing_options', JSON.stringify({ draw_signature: 1, type: 1, upload: 1 }));
      const blob = new Blob([content], { type: 'text/html' });
      formData.append('file', blob, `${title}.html`);
      signers.forEach((s, i) => {
        formData.append(`signers[${i}][email_address]`, s.email);
        formData.append(`signers[${i}][name]`, s.name);
        formData.append(`signers[${i}][order]`, String(s.order || i));
      });

      const res = await fetch(`${config.base_url}/signature_request/send`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa(`${config.api_key}:`)}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`HelloSign error: ${await res.text()}`);
      const data = await res.json();
      return {
        requestId: data.signature_request.signature_request_id,
        envelopeUrl: data.signature_request.signing_url,
      };
    },

    async getStatus({ requestId, config }) {
      const res = await fetch(`${config.base_url}/signature_request/${requestId}`, {
        headers: { Authorization: `Basic ${btoa(`${config.api_key}:`)}` },
      });
      if (!res.ok) throw new Error(`HelloSign error: ${await res.text()}`);
      const data = await res.json();
      const sr = data.signature_request;
      return {
        status: mapHellosignStatus(sr.is_complete, sr.is_declined),
        signers: (sr.signatures || []).map((s: any) => ({
          name: s.signer_name,
          email: s.signer_email_address,
          role: s.signer_role,
          status: s.status_code === 'signed' ? 'signed' as const : s.status_code === 'declined' ? 'declined' as const : 'awaiting' as const,
          signed_at: s.signed_at,
        })),
      };
    },

    async voidEnvelope({ requestId, config, reason }) {
      const res = await fetch(`${config.base_url}/signature_request/cancel/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa(`${config.api_key}:`)}` },
        body: JSON.stringify({ signature_request_id: requestId }),
      });
      if (!res.ok) throw new Error(`HelloSign error: ${await res.text()}`);
    },
  },

  signnow: {
    async sendEnvelope({ title, content, signers, config }) {
      // Step 1: upload document
      const uploadRes = await fetch(`${config.base_url}/document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_name: title,
          file: btoa(content),
        }),
      });
      if (!uploadRes.ok) throw new Error(`SignNow error: ${await uploadRes.text()}`);
      const doc = await uploadRes.json();

      // Step 2: create invite
      const inviteRes = await fetch(`${config.base_url}/document/${doc.id}/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: doc.id,
          to: signers.map(s => ({ email: s.email, role: s.name, order: s.order || 1 })),
          from: config.account_id || '',
        }),
      });
      if (!inviteRes.ok) throw new Error(`SignNow invite error: ${await inviteRes.text()}`);
      const invite = await inviteRes.json();
      return { requestId: doc.id };
    },

    async getStatus({ requestId, config }) {
      const res = await fetch(`${config.base_url}/document/${requestId}`, {
        headers: { Authorization: `Bearer ${config.api_key}` },
      });
      if (!res.ok) throw new Error(`SignNow error: ${await res.text()}`);
      const data = await res.json();
      const allSigned = data.signatures?.every((s: any) => s.signed) || false;
      return {
        status: allSigned ? 'signed' : data.status || 'sent',
        signers: (data.field_invites || []).flatMap((inv: any) =>
          (inv.signers || []).map((s: any) => ({
            name: s.role_name || '',
            email: s.email || '',
            status: s.signed ? 'signed' as const : 'awaiting' as const,
          }))
        ),
      };
    },

    async voidEnvelope({ requestId, config }) {
      await fetch(`${config.base_url}/document/${requestId}/cancelinvite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.api_key}` },
      });
    },
  },
};

// ─── Orchestrator ──────────────────────────────────────

export async function sendToProvider(
  providerName: string,
  contract: { id: string; title: string; content?: string; description?: string },
  signers: Signer[],
  providerConfig: ProviderConfig,
): Promise<{ requestId: string; envelopeUrl?: string }> {
  const api = providers[providerName];
  if (!api) throw new Error(`Provider "${providerName}" not supported`);

  const content = contract.content || contract.description || `<p>${contract.title}</p>`;
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px">${content}</body></html>`;

  return api.sendEnvelope({ title: contract.title, content: html, signers, config: providerConfig });
}

export async function checkProviderStatus(
  providerName: string,
  requestId: string,
  providerConfig: ProviderConfig,
) {
  const api = providers[providerName];
  if (!api) throw new Error(`Provider "${providerName}" not supported`);
  return api.getStatus({ requestId, config: providerConfig });
}

export async function voidProviderRequest(
  providerName: string,
  requestId: string,
  providerConfig: ProviderConfig,
  reason?: string,
) {
  const api = providers[providerName];
  if (!api) throw new Error(`Provider "${providerName}" not supported`);
  return api.voidEnvelope({ requestId, config: providerConfig, reason });
}

// ─── Helpers ───────────────────────────────────────────

function mapHellosignStatus(complete: boolean, declined: boolean): string {
  if (complete) return 'signed';
  if (declined) return 'declined';
  return 'sent';
}
