import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plug } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Secção "Apps conectadas" nas definições da conta.
 *
 * Lista as aplicações OAuth a que o utilizador deu acesso, com o nome e o logo
 * de cada uma. Os dados vêm da Edge Function `oauth` em /connections, que junta
 * `oauth_consents` com `oauth_clients` e `companies` — o logo vive no cliente,
 * por isso não se tenta adivinhar aqui.
 */

interface Connection {
  id: string;
  client_id: string;
  company_id: string | null;
  scopes: string[];
  created_at: string;
  client: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const OAUTH_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth`;

/** Rótulos legíveis para os scopes, para não mostrar "company:read" cru. */
const SCOPE_LABELS: Record<string, string> = {
  'company:read': 'Ver a empresa',
  'company:write': 'Alterar a empresa',
  'contracts:read': 'Ver contratos',
  'contracts:write': 'Criar e alterar contratos',
  'clients:read': 'Ver clientes',
  'clients:write': 'Criar e alterar clientes',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ConnectedApps() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function load() {
      if (!user) return;

      try {
        const { data: sessao } = await supabase.auth.getSession();
        const token = sessao.session?.access_token;
        if (!token) throw new Error('Sem sessão');

        const res = await fetch(`${OAUTH_API}/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { data?: Connection[] };

        if (!cancelado) setConnections(body.data ?? []);
      } catch (e) {
        // Falhar aqui não pode estragar as definições da conta: mostra-se a
        // mensagem e segue-se em frente com a lista vazia.
        if (!cancelado) {
          console.error('apps conectadas:', e);
          toast.error('Não foi possível carregar as apps conectadas.');
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    load();
    return () => {
      cancelado = true;
    };
  }, [user]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          gridColumn: '1 / -1',
          marginTop: 24,
          background: '#fff',
          border: '1px solid #e2e5e9',
          borderRadius: 14,
          padding: 24,
        }}
      >
        <p style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins', sans-serif" }}>
          A carregar apps conectadas…
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        gridColumn: '1 / -1',
        marginTop: 24,
        background: '#fff',
        border: '1px solid #e2e5e9',
        borderRadius: 14,
        padding: 24,
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: connections.length ? 20 : 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#0d1117',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Plug size={18} color="#fff" />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0d1117', marginBottom: 2 }}>
            Apps conectadas
          </h3>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
            Aplicações a que deste acesso à tua conta.
          </p>
        </div>
      </div>

      {connections.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            color: '#6b7280',
            background: '#f9fafb',
            border: '1px solid #e2e5e9',
            borderRadius: 10,
            padding: 16,
            lineHeight: 1.6,
          }}
        >
          Ainda não ligaste nenhuma app. Quando ligares uma, aparece aqui com o
          que tem acesso.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {connections.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                border: '1px solid #e2e5e9',
                borderRadius: 12,
                padding: 14,
              }}
            >
              {/* Logo da aplicação. O NetsulCondo manda o SVG oficial em
                  client.logo_url; se faltar, cai na inicial. */}
              {c.client?.logo_url ? (
                <img
                  src={c.client.logo_url}
                  alt={c.client.name}
                  width={40}
                  height={40}
                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#f3f4f6',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {(c.client?.name ?? '?').charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>
                  {c.client?.name ?? 'App desconhecida'}
                </div>

                {c.company && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Partilha a empresa <strong>{c.company.name}</strong>
                  </div>
                )}

                {Array.isArray(c.scopes) && c.scopes.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    {c.scopes.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 11,
                          color: '#374151',
                          background: '#f3f4f6',
                          borderRadius: 999,
                          padding: '3px 9px',
                        }}
                      >
                        {SCOPE_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>
                )}

                {c.created_at && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
                    Ligada a {formatDate(c.created_at)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}