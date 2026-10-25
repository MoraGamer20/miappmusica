import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  color?: string;
  barCount?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  color = '#3b82f6',
  barCount = 28,
  height = 36,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const barWidth = Math.max(2, (width / barCount) - 2);
      phaseRef.current += isPlaying ? 0.08 : 0.01;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          // Dynamic wave pattern
          const sin1 = Math.sin(phaseRef.current + i * 0.4);
          const cos1 = Math.cos(phaseRef.current * 0.8 + i * 0.3);
          const noise = Math.sin(phaseRef.current * 1.5 + i * 0.9);
          const normalized = Math.max(0.1, (sin1 + cos1 + noise + 3) / 6);
          barHeight = Math.max(4, normalized * (height - 4));
        } else {
          barHeight = 3;
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = isPlaying ? gradient : 'rgba(156, 163, 175, 0.4)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, color, barCount, height]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 5}
      height={height}
      className="rounded overflow-hidden"
      style={{ width: `${barCount * 5}px`, height: `${height}px` }}
    />
  );
};
