import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  History,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Share2,
  AlertCircle,
  Paperclip,
  File,
  Loader2,
  ExternalLink,
  Plus,
  Eye,
  FileEdit,
  Trash2,
  Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import AgreeLogo from '../Agree-logo.svg';
import { exportContractToPdf } from '../services/exportPdf';
import { analyzeContractRisks } from '../services/gemini';
import SignaturePanel from './SignaturePanel';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ContractDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: contractId } = useParams<{ id: string }>();
  const [contract, setContract] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    participants: '',
    content: ''
  });
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'notes' | 'files' | 'signatures'>('details');

  useEffect(() => {
    if (user) {
      const init = async () => {
        try {
          const [contractRes, versionsRes, notesRes] = await Promise.all([
            supabase.from('contracts').select('*').eq('id', contractId).eq('owner_id', user.id).single(),
            supabase.from('contract_versions').select('*').eq('contract_id', contractId).order('version_number', { ascending: false }),
            supabase.from('meeting_notes').select('*').eq('contract_id', contractId).order('date', { ascending: false })
          ]);

          if (contractRes.error) {
            console.error("Error fetching contract:", contractRes.error);
            setContract(null);
          } else if (contractRes.data) {
            setContract(contractRes.data);
          }
          if (versionsRes.error) {
            console.error("Error fetching versions:", versionsRes.error);
            setVersions([]);
          } else if (versionsRes.data) {
            setVersions(versionsRes.data);
          }
          if (notesRes.error) {
            console.error("Error fetching notes:", notesRes.error);
            setMeetingNotes([]);
          } else if (notesRes.data) {
            setMeetingNotes(notesRes.data);
          }
        } catch (err) {
          console.error("Error initializing contract detail:", err);
        }
      };
      init();

      const contractChannel = supabase
        .channel(`contract_${contractId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contracts', filter: `id=eq.${contractId}` }, (payload: any) => {
          setContract(payload.new);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(contractChannel);
      };
    }
  }, [contractId, user]);

  const fetchContractData = async () => {
    if (!user) return;
    try {
      const [contractRes, versionsRes, notesRes] = await Promise.all([
        supabase.from('contracts').select('*').eq('id', contractId).eq('owner_id', user.id).single(),
        supabase.from('contract_versions').select('*').eq('contract_id', contractId).order('version_number', { ascending: false }),
        supabase.from('meeting_notes').select('*').eq('contract_id', contractId).order('date', { ascending: false })
      ]);

      if (contractRes.error) {
        console.error("Error fetching contract:", contractRes.error);
        setContract(null);
      } else if (contractRes.data) {
        setContract(contractRes.data);
      }
      if (versionsRes.error) {
        console.error("Error fetching versions:", versionsRes.error);
        setVersions([]);
      } else if (versionsRes.data) {
        setVersions(versionsRes.data);
      }
      if (notesRes.error) {
        console.error("Error fetching notes:", notesRes.error);
        setMeetingNotes([]);
      } else if (notesRes.data) {
        setMeetingNotes(notesRes.data);
      }
    } catch (err) {
      console.error("Error fetching contract data:", err);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !contract) return;
    setSavingNote(true);
    try {
      await supabase.from('meeting_notes').insert({
        contract_id: contract.id,
        date: newNote.date,
        participants: newNote.participants,
        content: newNote.content,
        author_id: user.id,
        author_name: user.user_metadata?.name || user.email
      });
      
      setIsAddingNote(false);
      setNewNote({ date: format(new Date(), 'yyyy-MM-dd'), participants: '', content: '' });
      fetchContractData();
      toast.success('Nota de reunião adicionada!');
    } catch (err) {
      toast.error('Erro ao salvar nota');
    } finally {
      setSavingNote(false);
    }
  };

  if (!contract) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        fontFamily: "'Poppins', sans-serif"
      }}>
        <AlertCircle size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 14, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
          Contrato não encontrado
        </p>
        <button
          onClick={() => navigate('/contracts')}
          style={{
            marginTop: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: '#fff',
            border: '1.5px solid #e2e5e9',
            borderRadius: 0,
            cursor: 'pointer',
            color: '#0d1117',
            fontFamily: "'Poppins',sans-serif"
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: 'rgba(13,17,23,0.1)', text: '#0d1117' };
      case 'pending': return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
      case 'rejected': return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' };
      default: return { bg: '#f7f9fb', text: '#6b7280' };
    }
  };

  const statusStyle = getStatusColor(contract.status);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      fontFamily: "'Poppins', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/contracts')}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #e2e5e9',
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'all .2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f7f9fb';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff';
            }}
          >
            <ArrowLeft size={18} color="#0d1117" />
          </button>
          <div>
            <h1 style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#0d1117',
              marginBottom: 4,
              fontFamily: "'Poppins',sans-serif"
            }}>
              {contract.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: statusStyle.bg,
                color: statusStyle.text,
                fontFamily: "'Poppins',sans-serif"
              }}>
                {contract.status === 'approved' ? 'Assinado' : 
                 contract.status === 'pending' ? 'Aprovação' : 
                 contract.status === 'rejected' ? 'Rejeitado' : 'Rascunho'}
              </span>
              <span style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
                Criado em {format(parseISO(contract.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate(`/contracts/${contractId}/edit`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              background: '#fff',
              border: '1.5px solid #e2e5e9',
              color: '#6b7280',
              cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f7f9fb';
              e.currentTarget.style.color = '#0d1117';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <FileEdit size={16} />
            Editar
          </button>
          <button
            onClick={() => {
              if (window.confirm('Tens a certeza que pretendes eliminar este contrato? Esta acção é irreversível.')) {
                supabase.from('contracts').delete().eq('id', contractId).eq('owner_id', user?.id).then(({ error }) => {
                  if (error) { toast.error('Erro ao eliminar contrato'); return; }
                  toast.success('Contrato eliminado com sucesso');
                  navigate('/contracts');
                });
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              background: '#fff',
              border: '1.5px solid #fee2e2',
              color: '#ef4444',
              cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#ef4444';
            }}
          >
            <Trash2 size={16} />
            Eliminar
          </button>
          <button
            onClick={async () => { await exportContractToPdf(contract); }}
            style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            background: '#0d1117',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: "'Poppins',sans-serif"
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#000000';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#0d1117';
            }}
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        borderRadius: 20,
        padding: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        {[
          { id: 'details', label: 'Detalhes', icon: FileText },
          { id: 'versions', label: 'Versões', icon: History },
          { id: 'notes', label: 'Notas de Reunião', icon: FileText },
          { id: 'files', label: 'Anexos', icon: Paperclip },
          { id: 'signatures', label: 'Assinaturas', icon: CheckCircle2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              border: activeTab === tab.id ? '1px solid #e2e5e9' : 'none',
              color: activeTab === tab.id ? '#0d1117' : '#6b7280',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: "'Poppins',sans-serif"
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24
        }}>
          {/* Left Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Informações Básicas
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6b7280',
                    marginBottom: 4,
                    fontFamily: "'Poppins',sans-serif"
                  }}>
                    Descrição
                  </div>
                  <p style={{
                    fontSize: 14,
                    color: '#0d1117',
                    lineHeight: 1.6,
                    fontFamily: "'Poppins',sans-serif"
                  }}>
                    {contract.description || 'Sem descrição'}
                  </p>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16
                }}>
                  <div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 4,
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      Valor
                    </div>
                    <p style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#0d1117',
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      {contract.value ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contract.value) : 'Kz 0,00'}
                    </p>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 4,
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      Nível de Risco
                    </div>
                    <p style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: contract.risk_level === 'high' ? '#ef4444' : 
                             contract.risk_level === 'medium' ? '#f59e0b' : '#0d1117',
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      {contract.risk_level === 'high' ? 'Alto' : 
                       contract.risk_level === 'medium' ? 'Médio' : 'Baixo'}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16
                }}>
                  <div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 4,
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      Data de Início
                    </div>
                    <p style={{
                      fontSize: 14,
                      color: '#0d1117',
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      {contract.start_date ? format(parseISO(contract.start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 4,
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      Data de Término
                    </div>
                    <p style={{
                      fontSize: 14,
                      color: '#0d1117',
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      {contract.end_date ? format(parseISO(contract.end_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <div style={{
              background: '#fff',
              border: '1px solid #e2e5e9',
              borderRadius: 0,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Conteúdo do Contrato
              </h3>
              
              {contract.content ? (
                <div style={{ position: 'relative' }}>
                  <div className="contract-content" style={{
                    maxHeight: 400,
                    overflowY: 'auto',
                    padding: 24,
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    color: '#1a1a1a'
                  }}
                    dangerouslySetInnerHTML={{ __html: contract.content }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 9,
                    color: 'rgba(0,0,0,0.15)',
                    fontFamily: "'Poppins',sans-serif",
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}>
                    <img src={AgreeLogo} alt="" style={{ height: 12, display: 'block', opacity: 0.5 }} />
                    Agree — free plan
                  </div>
                </div>
              ) : (
                <p style={{
                  fontSize: 14,
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: 24,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Sem conteúdo
                </p>
              )}
            </div>

            {contract.risks && Array.isArray(contract.risks) && contract.risks.length > 0 && (
              <div style={{
                background: '#fff',
                border: '1px solid #e2e5e9',
                borderRadius: 0,
                padding: 24
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <h3 style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontFamily: "'Poppins',sans-serif"
                  }}>
                    Riscos Identificados ({contract.risks.length})
                  </h3>
                  <button
                    onClick={async () => {
                      if (!contract.content) { toast.error('O contrato não tem conteúdo para analisar'); return; }
                      const results = await analyzeContractRisks(contract.content);
                      if (results.risks?.length > 0) {
                        const { error } = await supabase.from('contracts').update({ risks: results.risks }).eq('id', contractId).eq('owner_id', user?.id);
                        if (!error) {
                          setContract({ ...contract, risks: results.risks });
                          toast.success('Riscos actualizados com sucesso');
                        }
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', fontSize: 12, fontWeight: 600,
                      background: '#fff', border: '1px solid #e2e5e9',
                      color: '#6b7280', cursor: 'pointer',
                      fontFamily: "'Poppins',sans-serif"
                    }}
                  >
                    <Sparkles size={14} />
                    Re-analisar
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {contract.risks.map((risk: any, idx: number) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 12,
                      background: risk.severity === 'high' ? 'rgba(239,68,68,0.05)' : 
                                  risk.severity === 'medium' ? 'rgba(245,158,11,0.05)' : 
                                  'rgba(16,185,129,0.05)',
                      borderLeft: '3px solid ' + (risk.severity === 'high' ? '#ef4444' : 
                                                          risk.severity === 'medium' ? '#f59e0b' : '#10b981')
                    }}>
                      <AlertCircle size={18} color={risk.severity === 'high' ? '#ef4444' : 
                                                                        risk.severity === 'medium' ? '#f59e0b' : '#10b981'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                          <span style={{
                            fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: '#0d1117',
                            fontFamily: "'Poppins',sans-serif"
                          }}>Risco {risk.severity}</span>
                          {risk.type && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px',
                              background: '#f0f0f0', color: '#6b7280',
                              fontFamily: "'Poppins',sans-serif"
                            }}>{risk.type}</span>
                          )}
                        </div>
                        <p style={{
                          fontSize: 13, color: '#374151', lineHeight: 1.5,
                          fontFamily: "'Poppins',sans-serif"
                        }}>{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e5e9'
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#0d1117',
              fontFamily: "'Poppins',sans-serif"
            }}>
              Histórico de Versões
            </h3>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {versions.length > 0 ? (
              versions.map((version, idx) => (
                <div key={version.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '16px 24px',
                  borderBottom: '1px solid #e2e5e9'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#0d1117',
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      v{version.version_number}
                    </div>
                    <div>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0d1117',
                        marginBottom: 4,
                        fontFamily: "'Poppins',sans-serif"
                      }}>
                        Versão {version.version_number}
                      </p>
                      <p style={{
                        fontSize: 12,
                        color: '#6b7280',
                        fontFamily: "'Poppins',sans-serif"
                      }}>
                        {format(parseISO(version.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: '#fff',
                    border: '1px solid #e2e5e9',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif"
                  }}>
                    <Eye size={14} />
                    Ver
                  </button>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 48,
                color: '#9ca3af'
              }}>
                <History size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontFamily: "'Poppins',sans-serif" }}>
                  Sem versões anteriores
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {!isAddingNote ? (
            <button
              onClick={() => setIsAddingNote(true)}
              style={{
                width: 'fit-content',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                background: '#0d1117',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif"
              }}
            >
              <Plus size={16} />
              Adicionar Nota
            </button>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: 24
            }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Nova Nota de Reunião
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 6,
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      DATA
                    </label>
                    <input
                      type="date"
                      value={newNote.date}
                      onChange={e => setNewNote({ ...newNote, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 14,
                        background: '#fff',
                        border: '1.5px solid #e2e5e9',
                        outline: 'none',
                        fontFamily: "'Poppins',sans-serif"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 6,
                      fontFamily: "'Poppins',sans-serif"
                    }}>
                      PARTICIPANTES
                    </label>
                    <input
                      type="text"
                      value={newNote.participants}
                      onChange={e => setNewNote({ ...newNote, participants: e.target.value })}
                      placeholder="Nome dos participantes"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 14,
                        background: '#fff',
                        border: '1.5px solid #e2e5e9',
                        outline: 'none',
                        fontFamily: "'Poppins',sans-serif"
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6b7280',
                    marginBottom: 6,
                    fontFamily: "'Poppins',sans-serif"
                  }}>
                    CONTEÚDO
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Descreva o que foi discutido na reunião..."
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      background: '#fff',
                      border: '1.5px solid #e2e5e9',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: "'Poppins',sans-serif"
                    }}
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12
                }}>
                  <button
                    onClick={() => setIsAddingNote(false)}
                    style={{
                      padding: '10px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      background: '#fff',
                      border: '1.5px solid #e2e5e9',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontFamily: "'Poppins',sans-serif"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      background: '#0d1117',
                      border: 'none',
                      color: '#fff',
                      cursor: savingNote ? 'not-allowed' : 'pointer',
                      opacity: savingNote ? 0.7 : 1,
                      fontFamily: "'Poppins',sans-serif"
                    }}
                  >
                    {savingNote ? <Loader2 size={16} className="animate-spin" /> : null}
                    {savingNote ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {meetingNotes.length > 0 ? (
              meetingNotes.map(note => (
                <div key={note.id} style={{
                  background: '#fff',
                  border: '1px solid #e2e5e9',
                  borderRadius: 0,
                  padding: 24
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12
                  }}>
                    <div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0d1117',
                        marginBottom: 4,
                        fontFamily: "'Poppins',sans-serif"
                      }}>
                        Reunião de {format(parseISO(note.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      {note.participants && (
                        <p style={{
                          fontSize: 12,
                          color: '#6b7280',
                          marginBottom: 8,
                          fontFamily: "'Poppins',sans-serif"
                        }}>
                          Participantes: {note.participants}
                        </p>
                      )}
                    </div>
                    {note.author_name && (
                      <span style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        fontFamily: "'Poppins',sans-serif"
                      }}>
                        Por {note.author_name}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 14,
                    color: '#374151',
                    lineHeight: 1.7,
                    fontFamily: "'Poppins',sans-serif"
                  }}>
                    {note.content}
                  </p>
                </div>
              ))
            ) : (
              <div style={{
                background: '#fff',
                border: '1px solid #e2e5e9',
                borderRadius: 0,
                padding: 48,
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontFamily: "'Poppins',sans-serif" }}>
                  Sem notas de reunião
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e5e9'
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#0d1117',
              fontFamily: "'Poppins',sans-serif"
            }}>
              Anexos
            </h3>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {contract.attachments && contract.attachments.length > 0 ? (
              contract.attachments.map((attachment: any, idx: number) => (
                <div key={attachment.id || idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: '1px solid #e2e5e9'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <File size={20} color="#0d1117" />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0d1117',
                        marginBottom: 2,
                        fontFamily: "'Poppins',sans-serif"
                      }}>
                        {attachment.name}
                      </p>
                      <p style={{
                        fontSize: 12,
                        color: '#6b7280',
                        fontFamily: "'Poppins',sans-serif"
                      }}>
                        {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ''}
                        {attachment.uploadedAt ? ` • ${format(parseISO(attachment.uploadedAt), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                      </p>
                    </div>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#fff',
                      border: '1px solid #e2e5e9',
                      color: '#6b7280',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      fontFamily: "'Poppins',sans-serif"
                    }}
                  >
                    <ExternalLink size={14} />
                    Abrir
                  </a>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 48,
                color: '#9ca3af'
              }}>
                <Paperclip size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontFamily: "'Poppins',sans-serif" }}>
                  Sem anexos
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'signatures' && (
        <SignaturePanel
          contract={contract}
          user={user}
          onUpdate={fetchContractData}
        />
      )}
    </div>
  );
}
