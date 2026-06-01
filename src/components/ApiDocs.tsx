import React from 'react';
import { BookOpen, Code, Shield, Key, ExternalLink } from 'lucide-react';

const endpoints = [
  {
    method: 'GET', path: '/health', auth: false,
    desc: 'Verifica o estado da API.',
  },
  {
    method: 'GET', path: '/contracts', auth: true, scope: 'contracts:read',
    desc: 'Lista contratos. Parâmetros: page, limit.',
  },
  {
    method: 'POST', path: '/contracts', auth: true, scope: 'contracts:write',
    desc: 'Cria um contrato. Body: { title, description?, content?, value?, currency?, start_date?, end_date?, tags?, client_id? }',
  },
  {
    method: 'GET', path: '/contracts/:id', auth: true, scope: 'contracts:read',
    desc: 'Obtém um contrato pelo ID.',
  },
  {
    method: 'GET', path: '/invoices', auth: true, scope: 'invoices:read',
    desc: 'Lista facturas. Parâmetros: page, limit.',
  },
  {
    method: 'GET', path: '/clients', auth: true, scope: 'clients:read',
    desc: 'Lista clientes. Parâmetros: page, limit.',
  },
];

export default function ApiDocs() {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://project.supabase.co'}/functions/v1/api`;

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #e2e5e9', fontFamily: "'Poppins',sans-serif",
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#0d1117' }}>
          <BookOpen size={20} style={{ marginRight: 8 }} />
          API — Documentação
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Integra o sistema de gestão de contratos com outros serviços através da REST API.
        </p>
      </div>

      {/* Authentication */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Autenticação</span>
        </div>
        <div style={{ padding: 16, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
          <p>Todos os endpoints (excepto <code style={{ background: '#f3f4f6', padding: '1px 6px' }}>/health</code>) requerem autenticação via <strong>Bearer Token</strong>.</p>
          <p style={{ marginTop: 8 }}>Inclui o header:</p>
          <pre style={{ background: '#f9fafb', padding: 12, fontSize: 12, marginTop: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <code>Authorization: Bearer sua_chave_api_aqui</code>
          </pre>
          <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Gera chaves de API na secção "Chaves de API" nas definições.
            Disponível nos planos Pro (1 chave) e Enterprise (10 chaves).
          </p>
        </div>
      </div>

      {/* Base URL */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExternalLink size={16} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Base URL</span>
        </div>
        <div style={{ padding: 16 }}>
          <pre style={{ background: '#f9fafb', padding: 12, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <code style={{ color: '#3b82f6' }}>{baseUrl}</code>
          </pre>
        </div>
      </div>

      {/* Endpoints */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code size={16} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Endpoints</span>
        </div>
        {endpoints.map((ep, i) => {
          const methodColors: Record<string, string> = { GET: '#3b82f6', POST: '#22c55e', PUT: '#f59e0b', DELETE: '#ef4444' };
          return (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < endpoints.length - 1 ? '1px solid #f0f2f4' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: methodColors[ep.method] || '#6b7280', minWidth: 48 }}>{ep.method}</span>
                <code style={{ fontSize: 12, color: '#0d1117', fontFamily: "'JetBrains Mono',monospace" }}>{ep.path}</code>
                {ep.auth && <Key size={12} color="#9ca3af" />}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginLeft: 56 }}>{ep.desc}</p>
              {ep.scope && <p style={{ fontSize: 10, color: '#9ca3af', marginLeft: 56 }}>Scope necessário: {ep.scope}</p>}
            </div>
          );
        })}
      </div>

      {/* Example */}
      <div style={{ ...cardStyle }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code size={16} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Exemplo</span>
        </div>
        <div style={{ padding: 16 }}>
          <pre style={{ background: '#0d1117', color: '#e6e6e6', padding: 16, fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono',monospace" }}>
{`// Listar contratos
curl ${baseUrl}/contracts \\
  -H "Authorization: Bearer ag_abc123..." \\
  -H "Content-Type: application/json"

// Criar contrato
curl -X POST ${baseUrl}/contracts \\
  -H "Authorization: Bearer ag_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Novo Contrato",
    "value": 150000,
    "currency": "AOA",
    "content": "<p>Cláusulas...</p>"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
