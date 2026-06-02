import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Undo2, Check, PenLine } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
  penColor?: string;
  penWidth?: number;
}

export default function SignaturePad({
  onSave,
  onCancel,
  width = 500,
  height = 200,
  penColor = '#0d1117',
  penWidth = 2,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    setHasTouch('ontouchstart' in window);
  }, []);

  const getCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { canvas, rect };
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const result = getCanvas();
    if (!result) return null;
    const { canvas, rect } = result;
    if ('touches' in e) {
      const touch = e.touches[0] || (e as TouchEvent).changedTouches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    const me = e as MouseEvent;
    return {
      x: (me.clientX - rect.left) * (canvas.width / rect.width),
      y: (me.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [getCanvas]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e5e9';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height / 2);
    ctx.lineTo(canvas.width - 20, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    if (currentStroke.length > 0) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, penColor, penWidth]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e as any);
    if (!pos) return;
    setIsDrawing(true);
    setCurrentStroke([pos]);
    setIsEmpty(false);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e as any);
    if (!pos) return;
    setCurrentStroke(prev => [...prev, pos]);
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, { points: currentStroke, color: penColor, width: penWidth }]);
      setCurrentStroke([]);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    setStrokes(prev => prev.slice(0, -1));
    setIsEmpty(strokes.length <= 1);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: "'Poppins',sans-serif" }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          border: '2px solid #e2e5e9',
          background: '#fff',
          touchAction: 'none',
          cursor: hasTouch ? 'default' : 'crosshair',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        {isEmpty && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            color: '#d1d5db', gap: 6
          }}>
            <PenLine size={24} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Desenha a tua assinatura aqui</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={handleUndo}
          disabled={isEmpty}
          title="Desfazer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', fontSize: 12, fontWeight: 600,
            background: '#fff', border: '1px solid #e2e5e9', color: isEmpty ? '#d1d5db' : '#6b7280',
            cursor: isEmpty ? 'not-allowed' : 'pointer', borderRadius: 8,
            fontFamily: "'Poppins',sans-serif"
          }}
        >
          <Undo2 size={14} />
          Desfazer
        </button>
        <button
          onClick={handleClear}
          disabled={isEmpty}
          title="Limpar"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', fontSize: 12, fontWeight: 600,
            background: '#fff', border: '1px solid #e2e5e9', color: isEmpty ? '#d1d5db' : '#6b7280',
            cursor: isEmpty ? 'not-allowed' : 'pointer', borderRadius: 8,
            fontFamily: "'Poppins',sans-serif"
          }}
        >
          <RotateCcw size={14} />
          Limpar
        </button>
        <div style={{ flex: 1 }} />
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 12, fontWeight: 600,
              background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
              cursor: 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif"
            }}
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isEmpty}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', fontSize: 12, fontWeight: 700,
            background: isEmpty ? '#e2e5e9' : '#0d1117', border: 'none',
            color: isEmpty ? '#9ca3af' : '#fff',
            cursor: isEmpty ? 'not-allowed' : 'pointer', borderRadius: 8,
            fontFamily: "'Poppins',sans-serif"
          }}
        >
          <Check size={14} />
          Usar
        </button>
      </div>
    </div>
  );
}
