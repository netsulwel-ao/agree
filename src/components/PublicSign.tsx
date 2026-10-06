/**
 * /sign/:token — Página pública de assinatura de contrato
 *
 * Fluxo:
 *  1. Carrega o contrato via token (sem login)
 *  2. Mostra o contrato em HTML + botão de download PDF
 *  3. Dois checkboxes: "li e aceito" + "confirmo identidade"
 *  4. Botão "Aceito — Assinar Contrato" só activo depois dos dois checks
 *  5. Abre o ecrã CaptureSignature (QR code + câmara + upload)
 *     que já existe e funciona — o token serve de sessionId
 *  6. Quando a foto chegar ao Storage, submete e sela o contrato
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2, Loader2, AlertCircle, Download,
  Camera, Upload, Smartphone, RotateCcw, Zap, FlipHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step =
  | 'loading' | 'error' | 'expired' | 'already_signed'
  | 'view'        // lê o contrato
  | 'capture'     // ecrã de captura da assinatura
  | 'waiting'     // à espera que a foto chegue do telemóvel
  | 'submitting'  // a processar
  | 'done';

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

  const [step, setStep]         = useState<Step>('loading');
  const [request, setRequest]   = useState<SigningRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [captureMethod, setCaptureMethod] = useState<'qr' | 'camera' | 'upload' | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);

  // ── 1. Carrega pedido ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setStep('error'); setErrorMsg('Link inválido.'); return; }

    fetch(`/api/sign/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 410)  { setStep('expired'); return; }
        if (!res.ok)             { setStep('error'); setErrorMsg(data.error || 'Erro ao carregar.'); return; }
        if (data.alreadySigned)  { setStep('already_signed'); return; }
        setRequest(data);
        setStep('view');
      })
      .catch(() => { setStep('error'); setErrorMsg('Não foi possível carregar o contrato.'); });
  }, [token]);

  // ── Download PDF ───────────────────────────────────────────────────────────
  const downloadPdf = useCallback(async () => {
    if (!request?.contract?.content) return;
    const { default: html2pdf } = await import('html2pdf.js');
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;width:794px;height:1123px;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;line-height:1.8;color:#222;padding:32px;margin:0;background:#fff}h1,h2,h3{color:#111;margin-bottom:8px}p{margin:0 0 10px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px}</style>
</head><body>${request.contract.content}</body></html>`);
    doc.close();
    await new Promise(r => setTimeout(r, 300));
    await html2pdf().set({
      margin: 12,
      filename: `${request.contract.title}.pdf`,
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(doc.body).save();
    document.body.removeChild(iframe);
  }, [request]);

  // ── Submete a assinatura ao servidor (declarado antes dos que o chamam) ────
  const submitSignatureBlob = useCallback(async (blob: Blob) => {
    setStep('submitting');
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onloadend = () => res(reader.result as string);
        reader.onerror   = rej;
        reader.readAsDataURL(blob);
      });
      const resp = await fetch(`/api/sign/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl: dataUrl, acceptedTerms: true, signerAgent: navigator.userAgent }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Erro ao submeter.');
      setStep('done');
    } catch (e: any) {
      setStep('error');
      setErrorMsg(e.message);
    }
  }, [token]);

  // ── Upload de ficheiro ─────────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    submitSignatureBlob(file);
  }, [submitSignatureBlob]);

  // ── Poll para imagem vinda do telemóvel ────────────────────────────────────
  const pollForSignature = useCallback(() => {
    let retries = 0;
    const MAX = 90;
    const check = async () => {
      try {
        const publicUrl = `https://iocpbnawjkjauvewijkh.supabase.co/storage/v1/object/public/signatures/sessions/${token}.png`;
        const resp = await fetch(publicUrl, { method: 'HEAD' });
        if (resp.ok) {
          const blob = await fetch(publicUrl).then(r => r.blob());
          streamRef.current?.getTracks().forEach(t => t.stop());
          await submitSignatureBlob(blob);
          return;
        }
      } catch {}
      try {
        const { data, error } = await supabase.storage.from('signatures').download(`sessions/${token}.png`);
        if (!error && data) {
          streamRef.current?.getTracks().forEach(t => t.stop());
          await submitSignatureBlob(data);
          return;
        }
      } catch {}
      if (++retries < MAX) setTimeout(check, 2000);
      else { setStep('error'); setErrorMsg('Tempo esgotado. Tenta de novo ou usa outro método.'); }
    };
    check();
  }, [token, submitSignatureBlob]);

  // ── Captura do webcam ──────────────────────────────────────────────────────
  const captureFromCamera = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const GX = 0.15, GY = 0.35, GW = 0.70, GH = 0.30;
    const sx = Math.round(video.videoWidth  * GX);
    const sy = Math.round(video.videoHeight * GY);
    const sw = Math.round(video.videoWidth  * GW);
    const sh = Math.round(video.videoHeight * GH);
    canvas.width  = sw; canvas.height = sh;
    canvas.getContext('2d')!.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(b => { if (b) submitSignatureBlob(b); }, 'image/png');
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, [submitSignatureBlob]);

  // ── Inicia captura ─────────────────────────────────────────────────────────
  const startCapture = useCallback(async (method: 'qr' | 'camera' | 'upload') => {
    setCaptureMethod(method);
    if (method === 'qr') {
      const captureUrl = `${APP_URL}/capture-signature/${token}`;
      const dataUrl = await QRCode.toDataURL(captureUrl, { width: 260, margin: 2, color: { dark: '#0d1117', light: '#ffffff' } });
      setQrDataUrl(dataUrl);
      setStep('waiting');
      pollForSignature();
    } else if (method === 'camera') {
      setStep('capture');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setErrorMsg('Não foi possível aceder à câmara.');
        setStep('error');
      }
    } else {
      // upload — abre file input imediatamente
      fileInputRef.current?.click();
    }
  }, [token, pollForSignature]);

  // ─── Ecrãs ─────────────────────────────────────────────────────────────────

  if (step === 'loading')
    return <Center><Loader2 size={36} className="animate-spin" color="#0d1117" /><p style={s.grey}>A carregar o contrato…</p></Center>;

  if (step === 'expired')
    return <Center><AlertCircle size={48} color="#ef4444" /><h2 style={s.h2}>Link expirado</h2><p style={s.grey}>Este link já não é válido. Pede ao remetente que envie um novo.</p></Center>;

  if (step === 'already_signed')
    return <Center><CheckCircle2 size={48} color="#16a34a" /><h2 style={s.h2}>Já assinaste este contrato</h2><p style={s.grey}>A tua assinatura foi registada com sucesso anteriormente.</p></Center>;

  if (step === 'done')
    return (
      <Center>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={44} color="#16a34a" />
        </div>
        <h2 style={s.h2}>Contrato assinado!</h2>
        <p style={s.grey}>A tua assinatura foi aplicada e registada com segurança. O hash do documento foi selado como prova de integridade.</p>
      </Center>
    );

  if (step === 'error')
    return <Center><AlertCircle size={48} color="#ef4444" /><h2 style={s.h2}>Algo correu mal</h2><p style={s.grey}>{errorMsg}</p><button onClick={() => window.location.reload()} style={s.btnPrimary}>Tentar novamente</button></Center>;

  if (step === 'submitting')
    return <Center><Loader2 size={36} className="animate-spin" color="#0d1117" /><p style={s.grey}>A registar e selar a tua assinatura…</p></Center>;

  if (!request) return null;

  // ─── Ecrã de visualização ──────────────────────────────────────────────────
  if (step === 'view') return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.cardHeader}>
          <p style={s.label}>Contrato para assinar</p>
          <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#09090b' }}>{request.contract.title}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#71717a' }}>
            Olá <strong>{request.signer_name.split(' ')[0]}</strong>, lê o contrato abaixo antes de assinar.
          </p>
        </div>

        {/* Download PDF */}
        <div style={{ padding: '12px 32px', borderBottom: '1px solid #f4f4f5' }}>
          <button onClick={downloadPdf} style={{ ...s.btnSecondary, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Download size={14} /> Descarregar PDF
          </button>
        </div>

        {/* Conteúdo do contrato */}
        <div style={{ padding: '24px 32px', maxHeight: 420, overflowY: 'auto', borderBottom: '1px solid #e4e4e7' }}>
          {request.contract.content
            ? <div dangerouslySetInnerHTML={{ __html: request.contract.content }} style={{ fontSize: 14, lineHeight: 1.8, color: '#374151' }} />
            : <p style={{ color: '#9ca3af', fontSize: 14 }}>Conteúdo do contrato não disponível.</p>
          }
        </div>

        {/* Aceitar termos */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CheckItem checked={accepted} onChange={setAccepted}>
            Li e compreendi o conteúdo deste contrato e concordo com todos os seus termos e condições.
          </CheckItem>
          <CheckItem checked={confirmed} onChange={setConfirmed}>
            Confirmo que sou <strong>{request.signer_name}</strong> ({request.signer_email}) e estou autorizado(a) a assinar este documento.
          </CheckItem>
        </div>

        {/* CTA */}
        <div style={{ padding: '24px 32px' }}>
          <button
            disabled={!accepted || !confirmed}
            onClick={() => setStep('capture')}
            style={{ ...s.btnPrimary, width: '100%', opacity: accepted && confirmed ? 1 : 0.4, cursor: accepted && confirmed ? 'pointer' : 'not-allowed' }}
          >
            {accepted && confirmed ? '✅ Aceito — Assinar Contrato' : 'Aceita os termos para continuar'}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Ecrã de escolha de método de captura ─────────────────────────────────
  if (step === 'capture' && !captureMethod) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#09090b' }}>Assinar contrato</h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#71717a' }}>
            Escolhe como queres submeter a tua assinatura. Escreve num papel branco e fotografa.
          </p>
        </div>
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <MethodCard icon={<Smartphone size={28} />} label="QR Code" desc="Usa o telemóvel" onClick={() => startCapture('qr')} />
          <MethodCard icon={<Camera size={28} />}    label="Câmara"   desc="Usa esta câmara"  onClick={() => startCapture('camera')} />
          <MethodCard icon={<Upload size={28} />}    label="Upload"   desc="Envia uma foto"
            onClick={() => startCapture('upload')} />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        <div style={{ padding: '0 32px 24px' }}>
          <button onClick={() => setStep('view')} style={{ ...s.btnSecondary, fontSize: 13 }}>← Voltar ao contrato</button>
        </div>
      </div>
    </div>
  );

  // ─── Ecrã QR + espera ─────────────────────────────────────────────────────
  if (step === 'waiting') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#09090b' }}>Escaneia o QR Code</h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#71717a' }}>
            Abre a câmara do telemóvel, aponta para o código abaixo e segue as instruções.<br/>
            Escreve a tua assinatura num papel branco e fotografa.
          </p>
        </div>
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240 }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={16} className="animate-spin" color="#71717a" />
            <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>À espera da foto…</p>
          </div>
          <div style={{ borderTop: '1px solid #f4f4f5', width: '100%', paddingTop: 16, textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#71717a' }}>Preferes usar outra forma?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setCaptureMethod(null); setStep('capture'); }} style={s.btnSecondary}>Câmara ou Upload</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Ecrã câmara ──────────────────────────────────────────────────────────
  if (step === 'capture' && captureMethod === 'camera') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#09090b' }}>Fotografar assinatura</h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#71717a' }}>Coloca a assinatura dentro das guias e captura.</p>
        </div>
        <div style={{ padding: '16px 32px 24px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <mask id="m"><rect x="0" y="0" width="100" height="100" fill="white" /><rect x="15" y="32" width="70" height="36" fill="black" rx="2" /></mask>
              </defs>
              <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.4)" mask="url(#m)" />
              <rect x="15" y="32" width="70" height="36" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" rx="2" />
            </svg>
          </div>
          <button onClick={captureFromCamera} style={{ ...s.btnPrimary, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 40 }}>
            <Camera size={18} /> Capturar e Assinar
          </button>
          <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setCaptureMethod(null); setStep('capture'); }} style={{ ...s.btnSecondary, fontSize: 13 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CheckItem({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#0d1117', flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{children}</span>
    </label>
  );
}

function MethodCard({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '20px 12px', background: '#fafafa', border: '1.5px solid #e4e4e7',
      borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.background = '#f0f0f0'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.background = '#fafafa'; }}
    >
      {icon}
      <span style={{ fontSize: 13, fontWeight: 700, color: '#09090b' }}>{label}</span>
      <span style={{ fontSize: 11, color: '#71717a' }}>{desc}</span>
    </button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, fontFamily: "system-ui,sans-serif" }}>
      {children}
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = {
  page: { minHeight: '100vh', background: '#f4f4f5', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', fontFamily: 'system-ui,sans-serif' } as React.CSSProperties,
  card: { width: '100%', maxWidth: 600, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' } as React.CSSProperties,
  cardHeader: { padding: '28px 32px', borderBottom: '1px solid #e4e4e7' } as React.CSSProperties,
  label: { margin: 0, fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  h2: { margin: '16px 0 0', fontSize: 22, fontWeight: 800, color: '#09090b', fontFamily: 'system-ui,sans-serif' } as React.CSSProperties,
  grey: { margin: '8px 0 0', fontSize: 14, color: '#71717a', textAlign: 'center' as const, maxWidth: 380, fontFamily: 'system-ui,sans-serif' } as React.CSSProperties,
  btnPrimary: { padding: '14px 28px', fontSize: 15, fontWeight: 700, background: '#0d1117', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' } as React.CSSProperties,
  btnSecondary: { padding: '10px 20px', fontSize: 14, fontWeight: 600, background: '#fff', color: '#374151', border: '1.5px solid #e4e4e7', borderRadius: 10, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' } as React.CSSProperties,
};
