import React, { useState, useMemo } from 'react';
import { useAuditLogs, formatAction, formatResource, type AuditEntry } from '../hooks/useAuditLogs';
import {
  Loader2, Search, Filter, Clock, User, Activity,
  Shield, ChevronDown, ChevronUp, FileText, DollarSign,
  BookTemplate, Users, PenLine, AlertCircle
} from 'lucide-react';

const resourceIcons: Record<string, any> = {
  contract: FileText,
  invoice: DollarSign,
  template: BookTemplate,
  client: Users,
  signature: PenLine,
  approval: Shield,
  notification: AlertCircle,
};

export default function AuditLogList() {
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: any = {};
  if (resourceFilter) filters.resource = resourceFilter;
  if (actionFilter) filters.action = actionFilter;
  if (search) filters.search = search;

  const { data: logs = [], isLoading } = useAuditLogs({ limit: 200 });

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(l =>
      l.user_name?.toLowerCase().includes(q) ||
      l.user_email?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.resource?.toLowerCase().includes(q) ||
      l.resource_name?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const resources = useMemo(() => {
    const set = new Set(logs.map(l => l.resource));
    return Array.from(set).sort();
  }, [logs]);

  const actions = useMemo(() => {
    const set = new Set(logs.map(l => l.action));
    return Array.from(set).sort();
  }, [logs]);

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif", maxWidth: 1200, margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.35)', borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={22} /> Auditoria
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Registo detalhado de todas as acções no sistema — {logs.length} registos</p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 400 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por utilizador, email, acção..."
                style={{
                  width: '100%', padding: '8px 12px 8px 36px', fontSize: 13,
                  border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
              />
            </div>
            <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}
              style={{
                padding: '8px 12px', fontSize: 13, border: '1.5px solid #e2e5e9',
                outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff', color: '#0d1117', minWidth: 140
              }}
            >
              <option value="">Todos os recursos</option>
              {resources.map(r => <option key={r} value={r}>{formatResource(r)}</option>)}
            </select>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
              style={{
                padding: '8px 12px', fontSize: 13, border: '1.5px solid #e2e5e9',
                outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff', color: '#0d1117', minWidth: 180
              }}
            >
              <option value="">Todas as acções</option>
              {actions.map(a => <option key={a} value={a}>{formatAction(a)}</option>)}
            </select>
            {(resourceFilter || actionFilter || search) && (
              <button onClick={() => { setResourceFilter(''); setActionFilter(''); setSearch(''); }}
                style={{ padding: '8px 14px', background: '#fff', border: '1px solid #e2e5e9', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#6b7280' }}
              >Limpar Filtros</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 20, minHeight: 400 }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10 }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              A carregar registos...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <Activity size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 15 }}>Nenhum registo encontrado</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Os registos de auditoria aparecem aqui à medida que as acções são realizadas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map(entry => {
                const Icon = resourceIcons[entry.resource] || Activity;
                const isExpanded = expandedId === entry.id;
                return (
                  <div key={entry.id} style={{
                    border: '1px solid #e2e5e9', overflow: 'hidden',
                    background: entry.status === 'error' ? 'rgba(239,68,68,0.03)' : '#fff',
                    transition: 'all .15s'
                  }}>
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(13,17,23,0.04)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ width: 140, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} color="#9ca3af" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1117' }}>
                            {entry.user_name || entry.user_email || '—'}
                          </span>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1117' }}>
                          {formatAction(entry.action)}
                        </span>
                        <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
                          {formatResource(entry.resource)}
                          {entry.resource_name && ` — ${entry.resource_name}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                        <Clock size={12} />
                        {new Date(entry.timestamp).toLocaleString('pt-PT')}
                      </div>
                      <div style={{ color: entry.status === 'error' ? '#ef4444' : '#10b981', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {entry.status === 'error' ? 'ERRO' : entry.status === 'success' ? 'OK' : entry.status}
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                    </div>

                    {isExpanded && (
                      <div style={{
                        padding: '12px 16px 16px 60px', borderTop: '1px solid #f0f2f4',
                        fontSize: 12, color: '#6b7280', fontFamily: "'Courier New', monospace"
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
                          <span style={{ fontWeight: 600, color: '#0d1117' }}>ID:</span><span>{entry.id}</span>
                          <span style={{ fontWeight: 600, color: '#0d1117' }}>Utilizador ID:</span><span>{entry.user_id}</span>
                          {entry.resource_id && <><span style={{ fontWeight: 600, color: '#0d1117' }}>Recurso ID:</span><span>{entry.resource_id}</span></>}
                          {entry.ip_address && <><span style={{ fontWeight: 600, color: '#0d1117' }}>IP:</span><span>{entry.ip_address}</span></>}
                        </div>
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <span style={{ fontWeight: 600, color: '#0d1117', display: 'block', marginBottom: 4 }}>Detalhes:</span>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', background: 'rgba(13,17,23,0.03)', padding: 8, borderRadius: 6 }}>
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
