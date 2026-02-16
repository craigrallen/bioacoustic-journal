import { useRef, useEffect } from 'react';

interface Props {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

export default function Waveform({ analyser, isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !isRecording || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getFloatTimeDomainData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 2;
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#ec4899');
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const y = (dataArray[i] * 0.5 + 0.5) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 10;
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isRecording]);

  // Idle animation
  useEffect(() => {
    if (isRecording || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let t = 0;
    const drawIdle = () => {
      animRef.current = requestAnimationFrame(drawIdle);
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = 'rgba(10, 10, 26, 0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.02 + t) * 10 + Math.sin(x * 0.01 + t * 0.7) * 5;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      t += 0.03;
    };
    drawIdle();
    return () => cancelAnimationFrame(animRef.current);
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={120}
      className="w-full h-24 rounded-xl"
      style={{ background: 'rgba(10,10,26,0.5)' }}
    />
  );
}
