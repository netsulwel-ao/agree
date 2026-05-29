import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { processSignatureFile, processSignatureImage, cropToSignature, fileToImageData, imageDataToBlob } from '../services/signatureProcessor';
import { encryptSignature } from '../services/signatureEncryption';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Camera, Upload, QrCode, Smartphone, Laptop, CheckCircle2, Loader2, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type Step = 'choose-method' | 'capture' | 'preview' | 'saving';

export default function RegisterSignature() {
  const { user } = useAuth();
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
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
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
    if (!finalBlob || !user) return;
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
      toast.error(e.message || 'Erro ao salvar a assinatura');
    } finally {
      setIsSaving(false);
    }
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', background: '#000' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={capturePhoto} disabled={isProcessing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif", opacity: isProcessing ? 0.7 : 1 }}>
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              {isProcessing ? 'A processar...' : 'Capturar'}
            </button>
            <button onClick={() => { cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); setStep('choose-method'); }} style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
              Cancelar
            </button>
          </div>
        </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500, margin: '0 auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e5e9', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', margin: 0 }}>Pré-visualização</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>A tua assinatura após processamento digital</p>
            <div style={{ border: '2px dashed #e2e5e9', borderRadius: 12, padding: 24, minWidth: 200, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.5)' }}>
              <img src={processedPreview} alt="Assinatura processada" style={{ maxWidth: 300, maxHeight: 120, objectFit: 'contain' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.5, fontFamily: "'Poppins',sans-serif" }}>NOME DA ASSINATURA</label>
            <input type="text" value={sigName} onChange={e => setSigName(e.target.value)} placeholder="Ex: Minha Assinatura" style={{ width: '100%', padding: '12px 16px', fontSize: 14, background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", borderRadius: 10 }}
              onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleSave} disabled={isSaving} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', fontSize: 15, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif", opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {isSaving ? 'A salvar...' : 'Salvar Assinatura'}
            </button>
            <button onClick={reprocess} style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
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
