
import React, { useRef, useEffect } from 'react';
import { GRID_CONFIG } from '../constants';

interface SimulationCanvasProps {
  gridData: number[][] | null;
}

const getColor = (value: number, min: number, max: number): string => {
  if (isNaN(value) || !isFinite(value)) return '#ff00ff'; // Magenta for NaN/Inf

  const range = max - min;
  if (range < 1e-9) return `hsl(240, 100%, 50%)`; // Blue for flat field
  
  const normalized = (value - min) / range;
  // Hue from blue (240) to red (0)
  const hue = 240 * (1 - normalized);
  return `hsl(${hue}, 100%, 50%)`;
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ gridData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !gridData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nx, ny } = GRID_CONFIG;
    canvas.width = 512;
    canvas.height = 512;

    const cellWidth = canvas.width / nx;
    const cellHeight = canvas.height / ny;
    
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
            if (isFinite(gridData[j][i])) {
                minVal = Math.min(minVal, gridData[j][i]);
                maxVal = Math.max(maxVal, gridData[j][i]);
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const value = gridData[j][i];
        ctx.fillStyle = getColor(value, minVal, maxVal);
        ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
      }
    }
  }, [gridData]);

  return (
    <div className="bg-gray-950 p-2 rounded-lg border border-gray-700 shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full rounded"></canvas>
    </div>
  );
};
