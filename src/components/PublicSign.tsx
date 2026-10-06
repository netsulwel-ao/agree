import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, PenLine, Upload, RotateCcw } from 'lucide-react';
import SignaturePad from './SignaturePad';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Step = 'loading' | 'error' | 'view' | 'sign' | 'submitting' | 'done' | 'expired' | 'already_signed';

interface SigningRequest {
  id: string;
  signer_name: string;
  signer_email: string;
  status: string;
  alreadySigned?: boolean;
  contract: {
    id: string;
    title: string;
    content: string;
    value?: number | null;
    currency?: string;
    start_date?: string | null;
    end_date?: string | null;
  };
}

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PublicSign() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>('loading');
  const [request, setRequest] = useState<SigningRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [signMethod, setSignMethod] = useState<'draw' | 'upload' | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega o pedido de assinatura
  useEffect(() => {
    if (!token) { setStep('error'); setErrorMsg('Link inválido.'); return; }

    fetch(`/api/sign/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 410) { setStep('expired'); return; }
        if (!res.ok) { setStep('error'); setErrorMsg(data.error || 'Erro ao carregar o contrato.'); return; }
        if (data.alreadySigned) { setStep('already_signed'); return; }
        setRequest(data);
        setStep('view');
      })
      .catch(() => { setStep('error'); setErrorMsg('Não foi possível carregar o contrato.'); });
  }, [token]);

  // Submete a assinatura
  const handleSubmit = useCallback(async () => {
    if (!signatureDataUrl || !accepted || !confirmed) return;
    setSubmitting(true);
    setStep('submitting');

    try {
      const res = await fetch(`/api/sign/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl,
          acceptedTerms: true,
          signerAgent: navigator.userAgent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao submeter assinatura.');
      setStep('done');
    } catch (e: any) {
      setStep('error');
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [signatureDataUrl, accepted, confirmed, token]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSignatureDataUrl(ev.target?.result as string);
      setSignMethod('upload');
    };
    reader.readAsDataURL(file);
  };

  // ─── Ecrãs ────────────────────────────────────────────────────────────────

  if (step === 'loading') return <CenteredBox><Loader2 size={36} className="animate-spin" color="#0d1117" /><p style={grey}>A carregar o contrato…</p></CenteredBox>;

  if (step === 'expired') return (
    <CenteredBox>
      <AlertCircle size={48} color="#ef4444" />
      <h2 style={title}>Link expirado</h2>
      <p style={grey}>Este link de assinatura já não é válido. Pede ao remetente que envie um novo.</p>
    </CenteredBox>
  );

  if (step === 'already_signed') return (
    <CenteredBox>
      <CheckCircle2 size={48} color="#16a34a" />
      <h2 style={title}>Já assinaste este contrato</h2>
      <p style={grey}>A tua assinatura foi registada com sucesso.</p>
    </CenteredBox>
  );

  if (step === 'done') return (
    <CenteredBox>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle2 size={44} color="#16a34a" />
      </div>
      <h2 style={title}>Contrato assinado!</h2>
      <p style={grey}>A tua assinatura foi aplicada e registada com segurança. Receberás uma cópia por email.</p>
    </CenteredBox>
  );

  if (step === 'error') return (
    <CenteredBox>
      <AlertCircle size={48} color="#ef4444" />
      <h2 style={title}>Algo correu mal</h2>
      <p style={grey}>{errorMsg}</p>
    </CenteredBox>
  );

  if (step === 'submitting') return <CenteredBox><Loader2 size={36} className="animate-spin" color="#0d1117" /><p style={grey}>A registar a tua assinatura…</p></CenteredBox>;

  if (!request) return null;

  // ─── Ecrã de visualização do contrato ─────────────────────────────────────
  if (step === 'view') return (
    <div style={pageWrap}>
      <div style={card}>
        {/* Header */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #e4e4e7' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contrato para assinar</p>
          <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#09090b' }}>{request.contract.title}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#71717a' }}>Olá <strong>{request.signer_name.split(' ')[0]}</strong>, por favor lê o contrato abaixo antes de assinar.</p>
        </div>

        {/* Conteúdo do contrato */}
        <div style={{ padding: '24px 32px', maxHeight: 480, overflowY: 'auto', borderBottom: '1px solid #e4e4e7' }}>
          {request.contract.content
            ? <div dangerouslySetInnerHTML={{ __html: request.contract.content }} style={{ fontSize: 14, lineHeight: 1.8, color: '#374151' }} />
            : <p style={{ color: '#9ca3af', fontSize: 14 }}>Conteúdo do contrato não disponível.</p>
          }
        </div>

        {/* Aceitar termos */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#0d1117', flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
              Li e compreendi o conteúdo deste contrato e concordo com os seus termos e condições.
            </span>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#0d1117', flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
              Confirmo que sou <strong>{request.signer_name}</strong> ({request.signer_email}) e que estou autorizado(a) a assinar este contrato.
            </span>
          </label>
        </div>

        {/* Botão continuar */}
        <div style={{ padding: '24px 32px' }}>
          <button
            disabled={!accepted || !confirmed}
            onClick={() => setStep('sign')}
            style={{
              width: '100%', padding: '16px', fontSize: 16, fontWeight: 700,
              background: accepted && confirmed ? '#0d1117' : '#e4e4e7',
              color: accepted && confirmed ? '#fff' : '#a1a1aa',
              border: 'none', borderRadius: 10, cursor: accepted && confirmed ? 'pointer' : 'not-allowed',
              transition: 'all .2s', fontFamily: 'inherit',
            }}
          >
            {accepted && confirmed ? 'Continuar para assinar →' : 'Aceita os termos para continuar'}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Ecrã de assinatura ───────────────────────────────────────────────────
  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #e4e4e7' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#09090b' }}>Assinar contrato</h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#71717a' }}>{request.contract.title}</p>
        </div>

        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Método de assinatura */}
          {!signMethod && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151' }}>Como queres assinar?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => setSignMethod('draw')} style={methodBtn}>
                  <PenLine size={24} color="#0d1117" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>Desenhar</span>
                  <span style={{ fontSize: 12, color: '#71717a' }}>Com o rato ou dedo</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} style={methodBtn}>
                  <Upload size={24} color="#0d1117" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>Enviar foto</span>
                  <span style={{ fontSize: 12, color: '#71717a' }}>Imagem da assinatura</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>
            </div>
          )}

          {/* Pad de desenho */}
          {signMethod === 'draw' && !signatureDataUrl && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' }}>Desenha a tua assinatura:</p>
              <SignaturePad
                onSave={(dataUrl) => setSignatureDataUrl(dataUrl)}
                onCancel={() => setSignMethod(null)}
                width={460}
                height={180}
              />
            </div>
          )}

          {/* Preview da assinatura */}
          {signatureDataUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151' }}>A tua assinatura:</p>
              <div style={{ border: '2px dashed #e4e4e7', borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <img src={signatureDataUrl} alt="Assinatura" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }} />
              </div>
              <button onClick={() => { setSignatureDataUrl(null); setSignMethod(null); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                <RotateCcw size={14} /> Refazer assinatura
              </button>
            </div>
          )}

          {/* Botão submeter */}
          {signatureDataUrl && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: '16px', fontSize: 16, fontWeight: 700,
                background: '#0d1117', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {submitting ? 'A registar…' : 'Confirmar e Assinar'}
            </button>
          )}
        </div>

        {/* Rodapé de segurança */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#a1a1aa' }}>🔒 Assinatura processada com segurança pela plataforma Agree. O documento é selado com hash SHA-256.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  minHeight: '100vh', background: '#f4f4f5', display: 'flex',
  alignItems: 'flex-start', justifyContent: 'center',
  padding: '40px 16px', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};

const card: React.CSSProperties = {
  width: '100%', maxWidth: 600, background: '#fff',
  borderRadius: 16, overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
};

const title: React.CSSProperties = {
  margin: '16px 0 0', fontSize: 22, fontWeight: 800, color: '#09090b',
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};

const grey: React.CSSProperties = {
  margin: '8px 0 0', fontSize: 14, color: '#71717a', textAlign: 'center', maxWidth: 380,
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};

const methodBtn: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  padding: '24px 16px', background: '#fafafa', border: '1.5px solid #e4e4e7',
  borderRadius: 12, cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
};

function CenteredBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f4f4f5', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: 40, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      {children}
    </div>
  );
}
