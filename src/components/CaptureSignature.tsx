import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Loader2, AlertCircle, RotateCcw, Upload, Flashlight, FlipHorizontal, Zap } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'idle' | 'camera' | 'uploading' | 'done' | 'error';

export default function CaptureSignature() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [captureFlash, setCaptureFlash] = useState(false);
  const [autoCaptureCount, setAutoCaptureCount] = useState(0);

  const cameraStream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (cameraStream.current) {
      cameraStream.current.getTracks().forEach(t => t.stop());
      cameraStream.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setStep('camera');
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStream.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorMsg('Não foi possível aceder à câmara. Tenta enviar uma foto da galeria.');
      setStep('error');
    }
  }, [facingMode, stopCamera]);

  const toggleTorch = async () => {
    const track = cameraStream.current?.getVideoTracks()[0];
    if (!track) return;
    const capabilities = track.getCapabilities() as any;
    if (!capabilities?.torch) {
      toast.error('Este dispositivo não suporta flash');
      return;
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashEnabled }] } as any);
      setFlashEnabled(!flashEnabled);
    } catch {
      toast.error('Não foi possível ativar o flash');
    }
  };

  const flipCamera = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    setFlashEnabled(false);
    startCamera(newFacing);
  };

  const enhanceImage = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    let min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (gray < min) min = gray;
      if (gray > max) max = gray;
    }
    const range = max - min;
    if (range < 10) return;
    const scale = 255 / range;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, (d[i] - min) * scale));
      d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - min) * scale));
      d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - min) * scale));
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const doUpload = async (blob: Blob) => {
    if (!sessionId) {
      setErrorMsg('Sessão inválida. Volta ao computador e gera um novo QR code.');
      setStep('error');
      return;
    }
    setStep('uploading');
    try {
      stopCamera();
      const path = `sessions/${sessionId}.png`;
      const { error } = await supabase.storage
        .from('signatures')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (error) throw error;
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar a imagem.');
      setStep('error');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setErrorMsg('Erro ao aceder à câmara.');
      setStep('error');
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) {
      setErrorMsg('Câmara ainda não está pronta.');
      setStep('error');
      return;
    }

    // Crop to center 70% width, 30% height (signature area)
    const cropX = Math.round(w * 0.15);
    const cropY = Math.round(h * 0.35);
    const cropW = Math.round(w * 0.70);
    const cropH = Math.round(h * 0.30);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    enhanceImage(ctx, cropW, cropH);

    // Flash effect
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 300);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);

    canvas.toBlob(b => b && doUpload(b), 'image/png');
  };

  const retry = () => { setErrorMsg(''); stopCamera(); setFlashEnabled(false); setStep('idle'); };

  const doneOrErrorBase = {
    fontFamily: "'Poppins',sans-serif", background: '#fafafa',
    minHeight: '100dvh', display: 'flex' as const, flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16
  };

  if (step === 'done') {
    return (
      <div style={doneOrErrorBase}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={44} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0d1117', textAlign: 'center', margin: 0 }}>Assinatura enviada!</h2>
        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 320, margin: 0 }}>
          A imagem foi capturada, processada e enviada com sucesso. Volta ao computador para finalizar.
        </p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={doneOrErrorBase}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={32} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', textAlign: 'center', margin: 0 }}>Algo correu mal</h2>
        <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 300, margin: 0 }}>{errorMsg}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <button onClick={retry} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', fontSize: 15, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            <RotateCcw size={16} /> Tentar novamente
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', fontSize: 15, fontWeight: 600, background: '#fff', border: '1.5px solid #e2e5e9', color: '#0d1117', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            <Upload size={16} /> Escolher foto da galeria
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); }} style={{ display: 'none' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minHeight: '100dvh', padding: 24, fontFamily: "'Poppins',sans-serif", background: '#fafafa', position: 'relative' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', margin: 0 }}>Capturar Assinatura</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          Coloca a assinatura num papel branco dentro das guias
        </p>
      </div>

      {step === 'idle' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '40px 0' }}>
          <div style={{ width: 88, height: 88, borderRadius: 24, background: 'rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={40} color="#0d1117" />
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 300 }}>
            Vamos capturar a tua assinatura com a câmara do telemóvel
          </p>
          <button onClick={() => startCamera()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', fontSize: 16, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 14, fontFamily: "'Poppins',sans-serif" }}>
            <Camera size={18} /> Iniciar Câmara
          </button>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>ou</p>
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', fontSize: 14, fontWeight: 600, background: '#fff', border: '1.5px solid #e2e5e9', color: '#0d1117', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            <Upload size={16} /> Escolher foto da galeria
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); }} style={{ display: 'none' }} />
        </div>
      ) : step === 'camera' ? (
        <MobileCameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          flashEnabled={flashEnabled}
          facingMode={facingMode}
          onCapture={capturePhoto}
          onToggleTorch={toggleTorch}
          onFlip={flipCamera}
          onCancel={() => { stopCamera(); setFlashEnabled(false); setStep('idle'); }}
        />
      ) : step === 'uploading' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48 }}>
          <div style={{ position: 'relative' }}>
            <Loader2 size={40} className="animate-spin" color="#0d1117" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', margin: 0 }}>A processar e enviar...</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, textAlign: 'center', maxWidth: 260 }}>
            A imagem está a ser melhorada e enviada com segurança
          </p>
        </div>
      ) : null}

      {/* Capture flash overlay */}
      {captureFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: '#fff', pointerEvents: 'none',
          animation: 'captureFlash 0.3s ease-out'
        }} />
      )}
      <style>{`
        @keyframes captureFlash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes autoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function MobileCameraView({
  videoRef, canvasRef, flashEnabled, facingMode,
  onCapture, onToggleTorch, onFlip, onCancel
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  flashEnabled: boolean;
  facingMode: string;
  onCapture: () => void;
  onToggleTorch: () => void;
  onFlip: () => void;
  onCancel: () => void;
}) {
  const [light, setLight] = useState(0);
  const [ready, setReady] = useState(false);
  const lightTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Wait for video metadata to load
    const video = videoRef.current;
    if (!video) return;
    const onReady = () => setReady(true);
    if (video.readyState >= 2) setReady(true);
    video.addEventListener('loadeddata', onReady);
    return () => video.removeEventListener('loadeddata', onReady);
  }, [videoRef]);

  useEffect(() => {
    lightTimer.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const c = document.createElement('canvas');
      c.width = 80; c.height = 80;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 80, 80);
      const d = ctx.getImageData(0, 0, 80, 80).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      setLight(Math.round(sum / (d.length / 4)));
    }, 500);
    return () => { if (lightTimer.current) clearInterval(lightTimer.current); };
  }, [videoRef]);

  const pct = Math.min(100, Math.round((light / 255) * 100));
  const tooDark = pct <= 30;
  const tooBright = pct >= 85;
  const badLight = tooDark || tooBright;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%', maxWidth: 480 }}>
      {/* Status bar: torch + flip + light meter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <button
          onClick={onToggleTorch}
          title="Flash"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600,
            background: flashEnabled ? 'rgba(13,17,23,0.12)' : '#fff',
            border: '1px solid #e2e5e9', color: flashEnabled ? '#0d1117' : '#6b7280',
            cursor: 'pointer', borderRadius: 10, fontFamily: "'Poppins',sans-serif"
          }}
        >
          <Zap size={14} />
          Flash
        </button>
        <button
          onClick={onFlip}
          title="Inverter câmara"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600,
            background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
            cursor: 'pointer', borderRadius: 10, fontFamily: "'Poppins',sans-serif"
          }}
        >
          <FlipHorizontal size={14} />
          {facingMode === 'environment' ? 'Traseira' : 'Frontal'}
        </button>
        <div style={{ flex: 1 }} />
        {/* Light meter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10,
          background: badLight ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
          border: `1px solid ${badLight ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
          fontSize: 11, fontWeight: 600, color: badLight ? '#ef4444' : '#16a34a',
          fontFamily: "'Poppins',sans-serif"
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: badLight ? '#ef4444' : '#16a34a', flexShrink: 0 }} />
          {tooDark ? 'Pouca luz' : tooBright ? 'Muita luz' : 'Luz ideal'}
        </div>
      </div>

      {/* Video + guides */}
      <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
        {!ready && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', zIndex: 1 }}>
            <Loader2 size={32} className="animate-spin" color="#fff" />
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Enhanced overlay guides */}
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Semi-transparent mask around signature area */}
          <defs>
            <mask id="guideMask">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <rect x="15" y="32" width="70" height="36" fill="black" rx="2" />
            </mask>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.35)" mask="url(#guideMask)" />

          {/* Signature area border */}
          <rect x="15" y="32" width="70" height="36" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" rx="2" />

          {/* Center dashed line */}
          <line x1="18" y1="50" x2="82" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeDasharray="3,3" />

          {/* Corner brackets */}
          <path d="M17,34 L17,34 L17,38" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M83,34 L83,34 L83,38" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M17,66 L17,66 L17,62" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M83,66 L83,66 L83,62" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M17,34 L21,34" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M83,34 L79,34" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M17,66 L21,66" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M83,66 L79,66" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <p style={{
          position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
          fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: "'Poppins',sans-serif",
          margin: 0, pointerEvents: 'none'
        }}>
          Alinha a assinatura dentro da área destacada
        </p>
      </div>

      {/* Capture button */}
      <button
        onClick={onCapture}
        disabled={!ready || badLight}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '16px 48px',
          fontSize: 17, fontWeight: 700, background: !ready || badLight ? '#6b7280' : '#0d1117',
          border: 'none', color: '#fff', cursor: !ready || badLight ? 'not-allowed' : 'pointer',
          borderRadius: 50, fontFamily: "'Poppins',sans-serif", opacity: !ready || badLight ? 0.5 : 1,
          transition: 'all .2s', letterSpacing: 0.5
        }}
      >
        {!ready ? (
          <><Loader2 size={18} className="animate-spin" /> A preparar...</>
        ) : (
          <><Camera size={18} /> Capturar e Enviar</>
        )}
      </button>

      <button onClick={onCancel} style={{
        background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
        fontSize: 13, textDecoration: 'underline', fontFamily: "'Poppins',sans-serif"
      }}>
        Cancelar
      </button>
    </div>
  );
}
