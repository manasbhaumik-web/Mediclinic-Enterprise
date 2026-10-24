import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Centralized Styling & Design Token Consistency Across Workspaces', () => {
  const srcRoot = path.resolve(__dirname, '..');
  const cssPath = path.join(srcRoot, 'index.css');
  const indexCss = fs.readFileSync(cssPath, 'utf8');

  // Key user workspace modules
  const coreWorkspaceFiles = [
    'features/doctor/DoctorDashboardModule.tsx',
    'features/consultation/ConsultationRoom.tsx',
    'features/triage/TriageModule.tsx',
    'features/registration/PatientRegistrationModule.tsx',
    'features/pharmacy/DispensaryDashboard.tsx',
    'features/billing/BillingDesk.tsx',
    'features/appointments/AppointmentCalendarModule.tsx',
    'features/inventory/InventoryPage.tsx',
    'features/reports/ReportsAnalyticsModule.tsx',
    'features/leave/MyLeave.tsx',
  ];

  it('declares all mandatory semantic surface, line, and ink design tokens in index.css', () => {
    const requiredTokens = [
      '--color-canvas',
      '--color-surface',
      '--color-surface-muted',
      '--color-surface-accent',
      '--color-surface-strong',
      '--color-line-subtle',
      '--color-line',
      '--color-line-strong',
      '--color-ink',
      '--color-deep',
      '--color-accent',
      '--color-strong',
      '--color-muted',
      '--color-subtle',
      '--color-brand',
      '--color-primary',
      '--color-primary-hover',
    ];

    for (const token of requiredTokens) {
      expect(indexCss).toContain(token);
    }
  });

  it('declares complete dark mode (Night Shift) overrides in index.css', () => {
    expect(indexCss).toContain('.dark {');
    expect(indexCss).toContain('--color-canvas:');
    expect(indexCss).toContain('--color-surface:');
    expect(indexCss).toContain('--color-line:');
    expect(indexCss).toContain('--color-ink:');
  });

  it('centralizes standard button utility classes in index.css', () => {
    expect(indexCss).toContain('.btn-primary');
    expect(indexCss).toContain('.btn-secondary');
    expect(indexCss).toContain('.btn-danger');
  });

  it('centralizes status chip utilities with Night Shift support in index.css', () => {
    const requiredChips = [
      '.chip',
      '.chip-danger',
      '.chip-warn',
      '.chip-info',
      '.chip-ok',
      '.chip-neutral',
      '.chip-brand',
    ];

    for (const chip of requiredChips) {
      expect(indexCss).toContain(chip);
    }
  });

  it('centralizes typography roles across all workspaces', () => {
    const requiredTypeRoles = [
      '.type-brand',
      '.type-page-title',
      '.type-section-title',
      '.type-card-title',
      '.type-label',
      '.type-heading-caps',
    ];

    for (const role of requiredTypeRoles) {
      expect(indexCss).toContain(role);
    }
  });

  it('centralizes workspace header, banner, and navigation classes', () => {
    const requiredWorkspaceClasses = [
      '.workspace-header',
      '.workspace-banner-section',
      '.workspace-banner-bar',
      '.workspace-navbar',
      '.changer-container',
      '.changer-btn',
    ];

    for (const cls of requiredWorkspaceClasses) {
      expect(indexCss).toContain(cls);
    }
  });

  it('enforces 100% flat corners (zero rounded-md, rounded-lg, rounded-xl, rounded-2xl) across all core workspaces', () => {
    for (const relPath of coreWorkspaceFiles) {
      const fullPath = path.join(srcRoot, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Rounded-full is permitted exclusively for circular status indicator dots and user avatar circles
      const illegalRoundedRegex = /\brounded-(sm|md|lg|xl|2xl|3xl)\b/g;
      const matches = content.match(illegalRoundedRegex);
      expect(matches, `Found illegal border radius in ${relPath}: ${matches?.join(', ')}`).toBeNull();
    }
  });

  it('enforces centralized border-line tokens instead of raw border-slate-200 or border-slate-300 in core workspaces', () => {
    for (const relPath of coreWorkspaceFiles) {
      // Exclude physical thermal print sticker label in pharmacy
      if (relPath.includes('DispensaryDashboard.tsx')) continue;

      const fullPath = path.join(srcRoot, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const illegalBorderRegex = /\bborder-slate-(200|300)\b/g;
      const matches = content.match(illegalBorderRegex);
      expect(matches, `Found raw slate borders in ${relPath}: ${matches?.join(', ')}`).toBeNull();
    }
  });

  it('enforces centralized bg-surface tokens instead of raw bg-white for primary card/modal surfaces', () => {
    for (const relPath of coreWorkspaceFiles) {
      if (relPath.includes('DispensaryDashboard.tsx')) continue; // Exclude physical drug sticker

      const fullPath = path.join(srcRoot, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Look for standalone bg-white on elements with rounded-none or border
      const illegalBgWhiteRegex = /className=["'][^"']*\bbg-white\b[^"']*(?:rounded-none|border-line)[^"']*["']/g;
      const matches = content.match(illegalBgWhiteRegex);
      expect(matches, `Found raw bg-white surface in ${relPath}: ${matches?.join(', ')}`).toBeNull();
    }
  });

  it('verifies all workspaces share the unified EnterpriseLayoutTemplate shell', () => {
    const shellPath = path.join(srcRoot, 'routes/ClinicShell.tsx');
    const shellContent = fs.readFileSync(shellPath, 'utf8');
    expect(shellContent).toContain('EnterpriseLayoutTemplate');

    const layoutPath = path.join(srcRoot, 'features/shell/EnterpriseLayoutTemplate.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    expect(layoutContent).toContain('HelpCenter');
    expect(layoutContent).toContain('AppFooter');
  });

  it('verifies accessible Tooltip component is implemented and centralized', () => {
    const tooltipPath = path.join(srcRoot, 'components/ui/Tooltip.tsx');
    expect(fs.existsSync(tooltipPath)).toBe(true);
    const tooltipContent = fs.readFileSync(tooltipPath, 'utf8');
    expect(tooltipContent).toContain('export default function Tooltip');
    expect(tooltipContent).toContain('role="tooltip"');
  });
  it('verifies standardized Modal dialog component is implemented and accessible', () => {
    const modalPath = path.join(srcRoot, 'components/ui/Modal.tsx');
    expect(fs.existsSync(modalPath)).toBe(true);
    const modalContent = fs.readFileSync(modalPath, 'utf8');
    expect(modalContent).toContain('export default function Modal');
    expect(modalContent).toContain('role="dialog"');
    expect(modalContent).toContain('aria-modal="true"');
  });

  it('verifies shared Telemetry context and hook are implemented', () => {
    const telemetryPath = path.join(srcRoot, 'context/TelemetryContext.tsx');
    expect(fs.existsSync(telemetryPath)).toBe(true);
    const telemetryContent = fs.readFileSync(telemetryPath, 'utf8');
    expect(telemetryContent).toContain('export function TelemetryProvider');
    expect(telemetryContent).toContain('export function useTelemetry');
  });

  it('verifies AdminModule code-splits heavy modules via React.lazy', () => {
    const adminPath = path.join(srcRoot, 'features/admin/AdminModule.tsx');
    const adminContent = fs.readFileSync(adminPath, 'utf8');
    expect(adminContent).toContain('React.lazy');
    expect(adminContent).toContain('React.Suspense');
  });
});
