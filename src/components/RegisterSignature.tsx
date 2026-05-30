import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { processSignatureFile, type ProcessOptions } from '../services/signatureProcessor';
import { encryptSignature } from '../services/signatureEncryption';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import { ArrowLeft, ArrowUpRight, Camera, Upload, QrCode, Smartphone, CheckCircle2, Loader2, RotateCcw, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { checkPlan, getLimits, canUpgrade } from '../lib/plans';

type Step = 'choose-method' | 'capture' | 'preview' | 'saving';

export default function RegisterSignature() {
  const { user, plan, isAdmin } = useAuth();
  const { openCheckout } = useCheckoutModal();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('choose-method');
  const [method, setMethod] = useState<'camera' | 'upload' | 'qr' | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [rawBlob, setRawBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string>('');
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [sigName, setSigName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [lightLevel, setLightLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(() => setHasCamera(true))
      .catch(() => setHasCamera(false));
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  const generateQrCode = useCallback(async () => {
    const id = uuidv4();
    setSessionId(id);
    const url = `${APP_URL}/capture-signature/${id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#0d1117', light: '#ffffff' } });
    setQrDataUrl(dataUrl);

    // Create a signature_sessions entry — use a simple approach: store in localStorage
    // The capture page will upload to a known path and we'll poll for it
    // For cross-device, we use Supabase Storage as bridge
    localStorage.setItem(`sig_session_${id}`, JSON.stringify({ status: 'pending', userId: user?.id }));
    setMethod('qr');
    setStep('capture');
  }, [user]);

  const startCamera = useCallback(async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMethod('camera');
      setStep('capture');
    } catch {
      toast.error('Não foi possível aceder à câmara. Tenta enviar uma foto.');
      setHasCamera(false);
    }
  }, [cameraStream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraStream) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Recortar apenas a área das guias (match com SVG viewBox: x 15-85, y 35-65)
    const GX = 0.15, GY = 0.35, GW = 0.70, GH = 0.30;
    const sx = Math.round(video.videoWidth * GX);
    const sy = Math.round(video.videoHeight * GY);
    const sw = Math.round(video.videoWidth * GW);
    const sh = Math.round(video.videoHeight * GH);
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext('2d')!.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(b => {
      if (b) {
        setRawBlob(b);
        processAndPreview(b);
      }
    }, 'image/png');
    cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawBlob(file);
    processAndPreview(file);
    setMethod('upload');
    setStep('capture');
  };

  const pollForSessionImage = useCallback(async () => {
    if (!sessionId) return;
    const check = async () => {
      const { data } = await supabase.storage
        .from('signatures')
        .download(`sessions/${sessionId}.png`);
      if (data) {
        const blob = data;
        setRawBlob(blob);
        processAndPreview(blob);
        return true;
      }
      return false;
    };
    const found = await check();
    if (!found) {
      setTimeout(() => pollForSessionImage(), 2000);
    }
  }, [sessionId]);

  useEffect(() => {
    if (method === 'qr' && sessionId) {
      pollForSessionImage();
    }
  }, [method, sessionId, pollForSessionImage]);

  const processAndPreview = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      const { blob: processed } = await processSignatureFile(file);
      setFinalBlob(processed);
      const url = URL.createObjectURL(processed);
      if (processedPreview) URL.revokeObjectURL(processedPreview);
      setProcessedPreview(url);
      setStep('preview');
    } catch {
      toast.error('Erro ao processar a imagem. Tenta outra foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reprocess = () => {
    setStep('choose-method');
    setMethod(null);
    setRawBlob(null);
    setFinalBlob(null);
    setProcessedPreview('');
    setQrDataUrl('');
    setSessionId('');
    setSigName('');
  };

  const handleSave = async () => {
    setSaveError('');
    if (!user) { toast.error('Sessão expirada. Faz login novamente.'); return; }
    if (!finalBlob) { toast.error('Nenhuma assinatura processada. Tenta de novo.'); return; }
    const name = sigName.trim() || `Assinatura ${new Date().toLocaleDateString()}`;
    setIsSaving(true);
    try {
      const filePath = `${user.id}/${uuidv4()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, finalBlob, { contentType: 'image/png', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(filePath);

      const base64 = await blobToBase64(finalBlob);
      const encrypted = await encryptSignature(base64, user.id);

      const { error: dbError } = await supabase.from('user_signatures').insert({
        user_id: user.id,
        name,
        image_url: publicUrl,
        encrypted_data: encrypted,
        is_active: true,
      });
      if (dbError) throw dbError;

      setSaved(true);
      toast.success('Assinatura digital registada com sucesso!');
    } catch (e: any) {
      const msg = e.message || 'Erro ao salvar a assinatura';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!checkPlan(plan, 'pro', isAdmin)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 60, gap: 20, fontFamily: "'Poppins',sans-serif", textAlign: 'center'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(13,17,23,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <PenLine size={40} color="#9ca3af" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117' }}>
          Assinaturas Digitais
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400 }}>
          Assinaturas digitais estão disponíveis apenas nos planos Pro e Enterprise.
        </p>
        <button onClick={() => openCheckout('pro')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', fontSize: 14, fontWeight: 700,
          background: '#0d1117', border: 'none', color: '#fff',
          cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif"
        }}>
          <ArrowUpRight size={16} />
          Fazer Upgrade
        </button>
      </div>
    );
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 20, fontFamily: "'Poppins',sans-serif" }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(13,17,23,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={40} color="#0d1117" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117' }}>Assinatura registada!</h2>
        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 400 }}>
          A tua assinatura digital foi processada, estilizada e criptografada com segurança. Já podes usá-la para assinar contratos.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={() => navigate('/signatures')} style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            Ver as minhas assinaturas
          </button>
          <button onClick={reprocess} style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#0d1117', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            Registar outra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate('/signatures')} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e5e9', cursor: 'pointer', borderRadius: 12 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', margin: 0 }}>Registar Assinatura Digital</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Cria a tua assinatura digital de forma segura
          </p>
        </div>
      </div>

      {step === 'choose-method' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Escolhe como queres criar a tua assinatura:</p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {/* Camera / Mobile */}
            {hasCamera && (
              <button onClick={startCamera} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, background: '#fff', border: '1.5px solid #e2e5e9', cursor: 'pointer', transition: 'all .2s', fontFamily: "'Poppins',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0d1117'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e5e9'}
              >
                <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={28} color="#0d1117" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', margin: 0 }}>{isMobile ? 'Tirar Foto' : 'Usar Webcam'}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Tira uma foto da tua assinatura num papel branco</p>
                </div>
              </button>
            )}

            {/* Upload */}
            <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, background: '#fff', border: '1.5px solid #e2e5e9', cursor: 'pointer', transition: 'all .2s', fontFamily: "'Poppins',sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0d1117'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e5e9'}
            >
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={28} color="#0d1117" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', margin: 0 }}>Enviar Foto</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Seleciona uma foto da assinatura no teu dispositivo</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </button>

            {/* QR Code — só no PC */}
            {!isMobile && (
              <button onClick={generateQrCode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, background: '#fff', border: '1.5px solid #e2e5e9', cursor: 'pointer', transition: 'all .2s', gridColumn: isMobile ? '1' : '1 / -1', fontFamily: "'Poppins',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0d1117'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e5e9'}
              >
                <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={28} color="#0d1117" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', margin: 0 }}>Escanear QR Code com o Telemóvel</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Gera um código QR único para fotografares a assinatura com o telemóvel</p>
                  {isLocalhost && (
                    <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 8, background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: 8 }}>
                      ⚠ Em localhost o QR não funciona no telemóvel. Usa o link da produção (Render) ou envia uma foto diretamente.
                    </p>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'capture' && method === 'camera' && (
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraStream={cameraStream}
          isProcessing={isProcessing}
          onCapture={capturePhoto}
          onCancel={() => { cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); setStep('choose-method'); }}
        />
      )}

      {step === 'capture' && method === 'qr' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 32, background: '#fff', border: '1px solid #e2e5e9', borderRadius: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <QrCode size={24} color="#0d1117" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0d1117', margin: '12px 0 4px' }}>Escaneia o QR Code com o Telemóvel</h3>
            <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 360 }}>
              Abre a câmara do teu telemóvel e escaneia o código abaixo. Serás redirecionado para tirar uma foto da tua assinatura.
            </p>
          </div>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240, imageRendering: 'pixelated' }} />
          )}
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Ou então, {isProcessing ? 'a aguardar a foto...' : <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#0d1117', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', fontFamily: "'Poppins',sans-serif", padding: 0 }}>envia uma foto diretamente</button>}
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          <button onClick={() => { setStep('choose-method'); setMethod(null); }} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280', cursor: 'pointer', borderRadius: 10, fontFamily: "'Poppins',sans-serif" }}>
            Cancelar
          </button>
        </div>
      )}

      {step === 'capture' && method === 'upload' && isProcessing && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48 }}>
          <Loader2 size={32} className="animate-spin" color="#0d1117" />
          <p style={{ fontSize: 14, color: '#6b7280' }}>A processar a imagem...</p>
        </div>
      )}

      {step === 'preview' && processedPreview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Preview */}
          <div style={{ background: '#fff', border: '1px solid #e2e5e9', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', margin: 0 }}>Pré-visualização</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>A tua assinatura após processamento digital</p>
            <div style={{ border: '2px dashed #e2e5e9', borderRadius: 12, padding: 24, minWidth: 200, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.5)' }}>
              {isProcessing ? (
                <Loader2 size={24} className="animate-spin" color="#0d1117" />
              ) : (
                <img src={processedPreview} alt="Assinatura processada" style={{ maxWidth: 300, maxHeight: 120, objectFit: 'contain' }} />
              )}
            </div>
          </div>

          {/* Error */}
          {saveError && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>
              {saveError}
            </div>
          )}

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.5, fontFamily: "'Poppins',sans-serif" }}>NOME DA ASSINATURA</label>
            <input type="text" value={sigName} onChange={e => setSigName(e.target.value)} placeholder="Ex: Minha Assinatura" style={{ width: '100%', padding: '12px 16px', fontSize: 14, background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", borderRadius: 10 }}
              onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleSave} disabled={isSaving || isProcessing} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', fontSize: 15, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: (isSaving || isProcessing) ? 'not-allowed' : 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif", opacity: (isSaving || isProcessing) ? 0.7 : 1 }}>
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {isSaving ? 'A salvar...' : 'Salvar Assinatura'}
            </button>
            <button onClick={reprocess} disabled={isProcessing} style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280', cursor: isProcessing ? 'not-allowed' : 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 6, opacity: isProcessing ? 0.5 : 1 }}>
              <RotateCcw size={16} />
              Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function CameraView({ videoRef, canvasRef, cameraStream, isProcessing, onCapture, onCancel }: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStream: MediaStream | null;
  isProcessing: boolean;
  onCapture: () => void;
  onCancel: () => void;
}) {
  const [light, setLight] = useState(0);
  const lightTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    lightTimer.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const c = document.createElement('canvas');
      c.width = 100;
      c.height = 100;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 100, 100);
      const d = ctx.getImageData(0, 0, 100, 100).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }
      setLight(Math.round(sum / (d.length / 4)));
    }, 500);
    return () => { if (lightTimer.current) clearInterval(lightTimer.current); };
  }, [videoRef]);

  const lightPct = Math.min(100, Math.round((light / 255) * 100));
  const lightOk = lightPct > 30 && lightPct < 85;
  const lightTooBright = lightPct >= 85;
  const lightTooDark = lightPct <= 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      {/* Luminosity meter */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', borderRadius: 10,
        background: lightTooDark ? 'rgba(239,68,68,0.1)' : lightTooBright ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        border: `1px solid ${lightTooDark || lightTooBright ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600,
        color: lightTooDark || lightTooBright ? '#ef4444' : '#16a34a'
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: lightTooDark || lightTooBright ? '#ef4444' : lightOk ? '#16a34a' : '#f59e0b',
          flexShrink: 0
        }} />
        {lightTooDark ? 'Pouca luz — acende mais luz' :
         lightTooBright ? 'Muita luz — afasta a luz' :
         lightPct === 0 ? 'A medir luz...' : 'Iluminação boa ✓'}
        <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>{lightPct}%</span>
      </div>

      {/* Video with guide lines overlay */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {/* Guide lines overlay */}
        <svg
          viewBox="0 0 100 100"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {/* Center horizontal line */}
          <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeDasharray="4,3" />
          {/* Upper guide line */}
          <line x1="15" y1="35" x2="85" y2="35" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" strokeDasharray="2,4" />
          {/* Lower guide line */}
          <line x1="15" y1="65" x2="85" y2="65" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" strokeDasharray="2,4" />
          {/* Center vertical line */}
          <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="2,4" />
          {/* Corner brackets */}
          <path d="M15,30 L15,20 L25,20" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <path d="M85,30 L85,20 L75,20" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <path d="M15,70 L15,80 L25,80" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <path d="M85,70 L85,80 L75,80" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        </svg>
        <p style={{
          position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
          fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Poppins',sans-serif",
          margin: 0, pointerEvents: 'none'
        }}>
          Alinha a assinatura dentro das guias
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCapture} disabled={isProcessing || !lightOk} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
          fontSize: 14, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff',
          cursor: (isProcessing || !lightOk) ? 'not-allowed' : 'pointer', borderRadius: 12,
          fontFamily: "'Poppins',sans-serif", opacity: (isProcessing || !lightOk) ? 0.5 : 1
        }}>
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          {isProcessing ? 'A processar...' : 'Capturar'}
        </button>
        <button onClick={onCancel} style={{
          padding: '12px 24px', fontSize: 14, fontWeight: 600,
          background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
          cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif"
        }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
