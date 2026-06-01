import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, DollarSign, ArrowRight, Check, X, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: FileText,
    title: 'Crie o seu primeiro contrato',
    description: 'Use um modelo ou a IA para gerar contratos profissionais em segundos. Adicione cláusulas, defina prazos e valores.',
    action: '/contracts/new',
    actionLabel: 'Criar Contrato',
    emoji: '📄',
  },
  {
    icon: Users,
    title: 'Adicione clientes',
    description: 'Registe os seus clientes com contactos, documentos e notas. Associe contratos e facturas a cada cliente.',
    action: '/clients/new',
    actionLabel: 'Adicionar Cliente',
    emoji: '👥',
  },
  {
    icon: DollarSign,
    title: 'Crie a sua primeira factura',
    description: 'Gere facturas profissionais com IVA, linhas de items e moeda. Envie aos clientes com um clique.',
    action: '/invoices/new',
    actionLabel: 'Criar Factura',
    emoji: '💰',
  },
];

export default function OnboardingWalkthrough({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];

  const handleAction = () => {
    onComplete();
    navigate(current.action);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      padding: 16, fontFamily: "'Poppins',sans-serif"
    }}>
      <div style={{
        background: '#fff', width: '100%', maxWidth: 500,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 32px 64px rgba(0,0,0,0.3)'
      }}>
        {/* Header with step indicator */}
        <div style={{
          background: '#0d1117', color: '#fff', padding: '32px 32px 24px',
          position: 'relative'
        }}>
          <button onClick={onComplete} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', cursor: 'pointer', width: 32, height: 32,
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16
          }}>
            <X size={16} />
          </button>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= step ? '#fff' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>

          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16
          }}>
            <current.icon size={28} color="#fff" />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>
            {current.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            Passo {step + 1} de {STEPS.length}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step < STEPS.length - 1 ? (
              <>
                <button onClick={handleAction} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', fontSize: 14, fontWeight: 700,
                  background: '#0d1117', color: '#fff', border: 'none',
                  cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
                }}>
                  {current.actionLabel} <ArrowRight size={16} />
                </button>
                <button onClick={() => setStep(s => s + 1)} style={{
                  padding: '10px 16px', fontSize: 13, fontWeight: 600,
                  background: 'transparent', border: 'none',
                  color: '#6b7280', cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
                }}>
                  Skip
                </button>
              </>
            ) : (
              <button onClick={handleAction} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', fontSize: 14, fontWeight: 700,
                background: '#0d1117', color: '#fff', border: 'none',
                cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
              }}>
                Começar <Sparkles size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
