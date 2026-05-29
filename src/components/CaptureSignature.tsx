import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Loader2, AlertCircle, RotateCcw, Upload } from 'lucide-react';

export default function CaptureSignature() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [step, setStep] = useState<'idle' | 'camera' | 'uploading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [debug, setDebug] = useState<string>('');
  const cameraStream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDebug = (msg: string) => {
    setDebug(prev => prev + '\n' + msg);
    console.log('[Capture]', msg);
  };

  const startCamera = async () => {
    setStep('camera');
    addDebug('A ligar câmara...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      cameraStream.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      addDebug('Câmara ligada');
    } catch (err: any) {
      addDebug('Erro câmara: ' + err.message);
      setErrorMsg('Não foi possível aceder à câmara. Tenta enviar uma foto da galeria.');
      setStep('error');
    }
  };

  const doUpload = async (blob: Blob) => {
    if (!sessionId) {
      addDebug('Erro: sessionId vazio');
      setErrorMsg('Sessão inválida. Volta ao computador e gera um novo QR code.');
      setStep('error');
      return;
    }
    setStep('uploading');
    addDebug('A enviar foto (' + (blob.size / 1024).toFixed(1) + ' KB)...');
    try {
      if (cameraStream.current) {
        cameraStream.current.getTracks().forEach(t => t.stop());
        cameraStream.current = null;
      }
      const path = `sessions/${sessionId}.png`;

      const { error } = await supabase.storage
        .from('signatures')
        .upload(path, blob, { contentType: 'image/png', upsert: true });

      if (error) {
        addDebug('Erro upload: ' + error.message);
        throw new Error(error.message);
      }
      addDebug('Upload OK');
      setStep('done');
    } catch (err: any) {
      addDebug('Erro: ' + err.message);
      setErrorMsg(err.message || 'Erro ao enviar a imagem.');
      setStep('error');
    }
  };

  const capturePhoto = () => {
    addDebug('A capturar...');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      addDebug('Erro: video ou canvas ref nulo');
      setErrorMsg('Erro ao aceder à câmara. Tenta novamente.');
      setStep('error');
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    addDebug('Dimensões: ' + w + 'x' + h);
    if (w === 0 || h === 0) {
      addDebug('Erro: dimensões zero (câmara não pronta)');
      setErrorMsg('Câmara ainda não está pronta. Aguarda e tenta novamente.');
      setStep('error');
      return;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      addDebug('Erro: canvas context nulo');
      setErrorMsg('Erro ao processar imagem.');
      setStep('error');
      return;
    }

    try {
      ctx.drawImage(video, 0, 0);
    } catch (e: any) {
      addDebug('Erro drawImage: ' + e.message);
      setErrorMsg('Erro ao capturar imagem.');
      setStep('error');
      return;
    }

    addDebug('A converter para PNG...');
    canvas.toBlob(
      (blob) => {
        if (blob) {
          doUpload(blob);
        } else {
          addDebug('Erro: blob é nulo');
          setErrorMsg('Erro ao gerar imagem. Tenta novamente.');
          setStep('error');
        }
      },
      'image/png'
    );
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addDebug('Ficheiro: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)');
      doUpload(file);
    }
  };

  const stopCamera = () => {
    if (cameraStream.current) {
      cameraStream.current.getTracks().forEach(t => t.stop());
      cameraStream.current = null;
    }
  };

  const retry = () => { setErrorMsg(''); setDebug(''); setStep('idle'); };

  const doneOrErrorBase = {
    fontFamily: "'Poppins',sans-serif", background: '#fafafa',
    minHeight: '100dvh', display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16
  };

  if (step === 'done') {
    return (
      <div style={doneOrErrorBase}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(13,17,23,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={40} color="#0d1117" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', textAlign: 'center', margin: 0 }}>Assinatura enviada!</h2>
        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 320, margin: 0 }}>
          A foto foi enviada com sucesso. Volta ao computador para finalizar.
        </p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={doneOrErrorBase}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={30} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', textAlign: 'center', margin: 0 }}>Algo correu mal</h2>
        <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 300, margin: 0 }}>{errorMsg}</p>
        {debug && (
          <pre style={{ fontSize: 10, color: '#9ca3af', maxWidth: '100%', overflow: 'auto', padding: 8, background: '#f5f5f5', borderRadius: 8, margin: 0 }}>{debug}</pre>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <button onClick={retry} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', fontSize: 15, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            <RotateCcw size={16} /> Tentar novamente
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', fontSize: 15, fontWeight: 600, background: '#fff', border: '1.5px solid #e2e5e9', color: '#0d1117', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            <Upload size={16} /> Escolher foto da galeria
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFilePick} style={{ display: 'none' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minHeight: '100dvh', padding: 24, fontFamily: "'Poppins',sans-serif", background: '#fafafa' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', margin: 0 }}>Capturar Assinatura</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          Coloca a assinatura num papel branco dentro do enquadramento
        </p>
      </div>

      {step === 'idle' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '40px 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={36} color="#0d1117" />
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 280 }}>
            Para começar, precisamos de aceder à câmara do teu dispositivo
          </p>
          <button onClick={startCamera} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', fontSize: 16, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 14, fontFamily: "'Poppins',sans-serif" }}>
            <Camera size={18} /> Ligar Câmara
          </button>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '8px 0 0' }}>ou</p>
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', fontSize: 14, fontWeight: 600, background: '#fff', border: '1.5px solid #e2e5e9', color: '#0d1117', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
            <Upload size={16} /> Escolher foto da galeria
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFilePick} style={{ display: 'none' }} />
        </div>
      ) : step === 'camera' ? (
        <MobileCameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          onCapture={capturePhoto}
          onCancel={() => { stopCamera(); retry(); }}
        />
      ) : step === 'uploading' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
          <Loader2 size={32} className="animate-spin" color="#0d1117" />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0d1117', margin: 0 }}>A enviar foto...</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Aguarda enquanto enviamos a imagem</p>
        </div>
      ) : null}

      {debug && step !== 'error' && (
        <pre style={{ fontSize: 9, color: '#9ca3af', maxWidth: '100%', overflow: 'auto', padding: 8, background: '#f5f5f5', borderRadius: 8, marginTop: 16, alignSelf: 'stretch' }}>{debug}</pre>
      )}
    </div>
  );
}

function MobileCameraView({ videoRef, canvasRef, onCapture, onCancel }: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCapture: () => void;
  onCancel: () => void;
}) {
  const [light, setLight] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const c = document.createElement('canvas');
      c.width = 80;
      c.height = 80;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 80, 80);
      const d = ctx.getImageData(0, 0, 80, 80).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }
      setLight(Math.round(sum / (d.length / 4)));
    }, 500);
    return () => clearInterval(timer);
  }, [videoRef]);

  const pct = Math.min(100, Math.round((light / 255) * 100));
  const bad = pct <= 30 || pct >= 85;

  return (
    <>
      {/* Luminosity */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
        background: bad ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        border: `1px solid ${bad ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        fontSize: 12, fontWeight: 600,
        color: bad ? '#ef4444' : '#16a34a', fontFamily: "'Poppins',sans-serif"
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: bad ? '#ef4444' : '#16a34a', flexShrink: 0 }} />
        {pct <= 30 ? 'Pouca luz' : pct >= 85 ? 'Muita luz' : pct === 0 ? 'A medir...' : 'Luz boa ✓'}
      </div>

      {/* Video + guides */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeDasharray="4,3" />
          <line x1="15" y1="35" x2="85" y2="35" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" strokeDasharray="2,4" />
          <line x1="15" y1="65" x2="85" y2="65" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" strokeDasharray="2,4" />
          <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="2,4" />
          <path d="M15,30 L15,20 L25,20" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <path d="M85,30 L85,20 L75,20" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <path d="M15,70 L15,80 L25,80" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <path d="M85,70 L85,80 L75,80" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        </svg>
        <p style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Poppins',sans-serif", margin: 0, pointerEvents: 'none' }}>
          Alinha a assinatura nas guias
        </p>
      </div>

      <button onClick={onCapture} disabled={bad} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 40px',
        fontSize: 16, fontWeight: 700, background: bad ? '#6b7280' : '#0d1117',
        border: 'none', color: '#fff', cursor: bad ? 'not-allowed' : 'pointer',
        borderRadius: 14, fontFamily: "'Poppins',sans-serif", opacity: bad ? 0.5 : 1
      }}>
        <Camera size={18} /> Capturar e Enviar
      </button>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: "'Poppins',sans-serif" }}>
        Cancelar
      </button>
    </>
  );
}
