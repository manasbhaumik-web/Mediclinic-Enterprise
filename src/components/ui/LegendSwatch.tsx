import React from 'react';

interface LegendSwatchProps {
  /** Series colour from chart data */
  color: string;
  shape?: 'square' | 'circle';
  size?: 'sm' | 'md';
  className?: string;
}

/** Chart legend colour key. Sizing lives in `.legend-swatch*` (index.css); the data colour is an SVG fill. */
export function LegendSwatch({ color, shape = 'square', size = 'md', className = '' }: LegendSwatchProps) {
  const classes = ['legend-swatch', size === 'sm' && 'legend-swatch-sm', className].filter(Boolean).join(' ');
  return (
    <svg className={classes} viewBox="0 0 10 10" aria-hidden="true">
      {shape === 'circle' ? <circle cx="5" cy="5" r="5" fill={color} /> : <rect width="10" height="10" fill={color} />}
    </svg>
  );
}

export default LegendSwatch;
