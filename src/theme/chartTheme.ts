import { palette, seriesColors } from './palette';

/**
 * Shared Recharts styling. Every chart takes its grid, axes, ticks, tooltip
 * and legend from here so charts look the same across modules.
 */
export const chartTheme = {
  grid: palette.lineSubtle,
  axis: seriesColors.slateLight,
  // Font sizes follow the CSS type scale: 11px = text-2xs, 12px = text-xs.
  tick: { fontSize: 11, fill: seriesColors.slateDark },
  tickSmall: { fontSize: 11, fill: seriesColors.slateLight },
  tooltip: {
    backgroundColor: palette.ink,
    color: palette.white,
    border: `1px solid ${seriesColors.teal}`,
    borderRadius: 0,
    fontSize: '12px',
    padding: '8px 12px',
  },
  tooltipItem: { color: palette.lineStrong, padding: 0 },
  tooltipLabel: { color: palette.white, fontWeight: 700 },
  legend: { fontSize: '12px', paddingTop: '10px' },
  cursor: { fill: 'rgba(13, 148, 136, 0.1)' },
  dot: { r: 2.5 },
  activeDot: { r: 5 },
} as const;
