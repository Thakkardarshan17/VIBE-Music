import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext.js';

interface AudioVisualizerProps {
  height?: number;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ height = 48, barCount = 28 }) => {
  const { isPlaying, analyserNode } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dataArray = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : new Uint8Array(barCount);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      }

      const barWidth = (canvas.width / barCount) - 2;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#7c3aed');
      gradient.addColorStop(0.5, '#a855f7');
      gradient.addColorStop(1, '#ec4899');

      ctx.fillStyle = gradient;

      for (let i = 0; i < barCount; i++) {
        let value = 0;
        if (isPlaying) {
          if (analyserNode) {
            value = (dataArray[i * 2] || 0) / 255;
          } else {
            // Reactive simulated wave when direct node is quiet or cross-origin
            const time = Date.now() / 200;
            value = 0.2 + 0.7 * Math.abs(Math.sin(time + i * 0.4) * Math.cos(time * 0.5 + i * 0.2));
          }
        } else {
          value = 0.08;
        }

        const barHeight = Math.max(3, value * canvas.height);
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Draw rounded top bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, analyserNode, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 8}
      height={height}
      className="w-full max-w-[260px] h-10 opacity-90 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
    />
  );
};

