import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileUp, Wand2, FilePlus2, Check, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan } from '../lib/plans';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import ContractForm from './ContractForm';

export default function ContractEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { plan, isAdmin, trialEndsAt } = useAuth();
  const { openCheckout } = useCheckoutModal();
  const canUseAI = checkPlan(plan, 'pro', isAdmin, trialEndsAt);

  if (mode) return <ContractForm />;

  const options = [
    {
      id: 'document',
      icon: FileUp,
      badge: canUseAI ? null : 'PRO',
      locked: !canUseAI,
      title: 'Já tenho o documento',
      description: 'Tens o contrato em PDF ou DOCX? Importa-o e a IA preenche os dados automaticamente.',
      features: ['Upload de PDF', 'Extração de dados por IA', 'Revisão antes de salvar'],
      cta: 'Importar documento',
      onClick: () => {
        if (!canUseAI) { openCheckout('pro'); return; }
        navigate('/contracts/new?mode=document');
      },
    },
    {
      id: 'template',
      icon: Wand2,
      badge: null,
      locked: false,
      title: 'Criar do zero',
      description: 'Escolhe um modelo profissional ou deixa a IA gerar o contrato completo a partir de umas perguntas.',
      features: ['Modelos profissionais', 'Geração com IA (Pro)', 'Contrato completo em HTML'],
      cta: 'Criar contrato',
      onClick: () => navigate('/contracts/new?mode=template'),
    },
    {
      id: 'draft',
      icon: FilePlus2,
      badge: null,
      locked: false,
      title: 'Rascunho',
      description: 'Começa aos poucos, sem pressa. Guarda como rascunho e continua a editar quando quiseres.',
      features: ['Totalmente gratuito', 'Guarda e retoma depois', 'Sem limite de tempo'],
      cta: 'Começar rascunho',
      onClick: () => navigate('/contracts/new?mode=draft'),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', marginBottom: 6 }}>
          Criar Novo Contrato
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Escolhe a forma como queres começar. Podes voltar atrás e mudar de opção a qualquer momento.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {options.map(opt => (
          <div
            key={opt.id}
            style={{
              background: '#fff', border: '1px solid #e2e5e9', padding: 28,
              display: 'flex', flexDirection: 'column', gap: 16,
              transition: 'transform .2s, box-shadow .2s', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#0d1117';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = '#e2e5e9';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(13,17,23,0.08)', color: '#0d1117',
              }}>
                <opt.icon size={26} />
              </div>
              {opt.badge && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: '#0d1117', color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '3px 8px', letterSpacing: 0.5,
                }}>
                  <Lock size={10} /> {opt.badge}
                </span>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>{opt.title}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{opt.description}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {opt.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
                  {opt.locked ? <Lock size={12} color="#9ca3af" /> : <Check size={12} color="#16a34a" />}
                  {f}
                </div>
              ))}
            </div>

            <button
              onClick={opt.onClick}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 'auto', padding: '11px 16px', fontSize: 13, fontWeight: 600,
                background: '#0d1117', color: '#fff', border: '1.5px solid #0d1117', cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif", transition: 'background .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#000'}
              onMouseLeave={e => e.currentTarget.style.background = '#0d1117'}
            >
              {opt.locked ? <Lock size={14} /> : opt.id === 'template' ? <Sparkles size={14} /> : null}
              {opt.cta}
            </button>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 18px', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.5)',
        fontSize: 12, color: '#6b7280',
      }}>
        <ArrowLeft size={14} />
        Dica: se o contrato já existe e tem documento, escolhe <strong>“Já tenho o documento”</strong>. Se vais negociar e criar aos poucos, usa <strong>Rascunho</strong>.
      </div>
    </div>
  );
}
