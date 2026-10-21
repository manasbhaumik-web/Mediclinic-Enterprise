import React from 'react';
import { palette } from '../../theme/palette';

// Inline Micro SVG Sparkline for 10/10 Metric Density (Sharp Line Styling)
export default function MicroSparkline({ data, color = palette.brand }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 30 - ((val - min) / (max - min || 1)) * 24;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-20 h-7 overflow-visible inline-block opacity-90" viewBox="0 0 100 30" aria-hidden="true" focusable="false">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        points={points}
      />
    </svg>
  );
}
