/**
 * Colours for places CSS classes can't reach (Recharts props, inline SVG,
 * canvas/PDF output). Brand values mirror the light-mode tokens in
 * src/index.css — change both together.
 */
export const palette = {
  ink: '#0f3c4c',
  accent: '#0f766e',
  brand: '#0d9488',
  primary: '#0f766e',
  primaryHover: '#115e59',
  surface: '#fbfefe',
  surfaceMuted: '#f5fcfa',
  surfaceAccent: '#eef9f6',
  surfaceStrong: '#e0f4ef',
  lineSubtle: '#dcf6ef',
  line: '#bfeee3',
  lineStrong: '#8fe3d3',
  night: '#082830',
  stripe: '#635bff',
  white: '#ffffff',
} as const;

/** Categorical chart series colours (Tailwind palette values). */
export const seriesColors = {
  red: '#ef4444',
  redLight: '#f87171',
  redPale: '#fca5a5',
  rose: '#f43f5e',
  roseDark: '#e11d48',
  orange: '#f97316',
  orangeLight: '#fb923c',
  amber: '#f59e0b',
  amberDark: '#d97706',
  yellow: '#eab308',
  lime: '#84cc16',
  emerald: '#10b981',
  emeraldDark: '#059669',
  teal: '#2dd4bf',
  tealMid: '#14b8a6',
  cyan: '#06b6d4',
  cyanDark: '#0891b2',
  sky: '#0284c7',
  blue: '#3b82f6',
  violet: '#a78bfa',
  purple: '#a855f7',
  pink: '#ec4899',
  slate: '#64748b',
  slateLight: '#94a3b8',
  slateDark: '#475569',
  slateDeep: '#1e293b',
  slatePale: '#f1f5f9',
  slateWhite: '#f8fafc',
} as const;
