import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function CaptureSignature() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('Não foi possível aceder à câmara');
    }
  };

  const captureAndUpload = async () => {
    if (!videoRef.current || !canvasRef.current || !sessionId) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    setUploading(true);
    try {
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
      const path = `sessions/${sessionId}.png`;
      const { error } = await supabase.storage
        .from('signatures')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (error) throw error;
      setCaptured(true);
      toast.success('Assinatura capturada! Já podes voltar ao computador.');
    } catch {
      toast.error('Erro ao enviar a imagem');
    } finally {
      setUploading(false);
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    }
  };

  if (captured) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 20, padding: 40, fontFamily: "'Poppins',sans-serif" }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(13,17,23,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={40} color="#0d1117" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', textAlign: 'center' }}>Assinatura enviada!</h2>
        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 320 }}>
          Volta ao computador para processar e finalizar o registo da tua assinatura digital.
        </p>
        <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minHeight: '80vh', padding: 24, fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', margin: 0 }}>Capturar Assinatura</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          Coloca a assinatura num papel branco dentro do enquadramento
        </p>
      </div>
      <div style={{ position: 'relative', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <button onClick={captureAndUpload} disabled={uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', fontSize: 16, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', borderRadius: 14, fontFamily: "'Poppins',sans-serif", opacity: uploading ? 0.7 : 1 }}>
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        {uploading ? 'A enviar...' : 'Capturar e Enviar'}
      </button>
    </div>
  );
}
