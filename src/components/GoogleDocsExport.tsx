import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { createDocument, getDocumentUrl } from '../services/google';
import { FileText, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  userId: string;
  contract: {
    id: string;
    title: string;
    content?: string;
    description?: string;
  };
}

export default function GoogleDocsExport({ userId, contract }: Props) {
  const [loading, setLoading] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('google_integrations')
        .select('access_token')
        .eq('user_id', userId)
        .single();
      if (!data?.access_token) { toast.error('Google não conectado'); return; }

      const content = [
        contract.content || contract.description || '',
        '',
        `---`,
        `Contrato: ${contract.title}`,
        `ID: ${contract.id}`,
      ].join('\n');

      const doc = await createDocument(data.access_token, contract.title, content);
      const url = getDocumentUrl(doc.documentId);
      setDocUrl(url);
      toast.success('Documento criado no Google Docs');
    } catch { toast.error('Erro ao exportar para Google Docs'); }
    setLoading(false);
  };

  if (docUrl) {
    return (
      <a href={docUrl} target="_blank" rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: '#fff', color: '#1a73e8', border: '1.5px solid #1a73e8',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
        }}>
        <CheckCircle2 size={16} color="#10b981" />
        Documento criado <ExternalLink size={14} />
      </a>
    );
  }

  return (
    <button onClick={handleExport} disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
        background: '#fff', color: '#1a73e8', border: '1.5px solid #1a73e8',
        fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}>
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
      {loading ? 'A exportar...' : 'Exportar para Google Docs'}
    </button>
  );
}
