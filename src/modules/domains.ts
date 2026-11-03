/**
 * The platform's domains: which feature folders belong together, and which domains may depend on which.
 * `boundaries.test.ts` fails the build when a feature imports another feature outside these rules.
 */
export type DomainId = 'journey' | 'clinical' | 'pharmacy' | 'revenue' | 'people' | 'compliance' | 'platform';

export const DOMAINS: Record<DomainId, { label: string; features: readonly string[] }> = {
  journey: { label: 'Patient journey', features: ['registration', 'triage', 'appointments', 'patientAdmin'] },
  clinical: { label: 'Clinical care', features: ['consultation', 'doctor'] },
  pharmacy: { label: 'Pharmacy and stock', features: ['pharmacy', 'inventory', 'equipment'] },
  revenue: { label: 'Revenue', features: ['billing', 'einvoice'] },
  people: { label: 'People', features: ['staff', 'leave', 'payroll'] },
  compliance: { label: 'Compliance and safety', features: ['operations', 'reports'] },
  platform: { label: 'Platform and shell', features: ['shell', 'admin', 'auth', 'dashboard', 'landing', 'integrations'] },
};

/**
 * Other domains a domain may import from. Compliance and safety tools (the operations modals such as the
 * Code Red alarm) are opened from clinical, front-desk, pharmacy and staff screens, so they are open to those.
 * Nothing else crosses a domain line.
 */
export const ALLOWED_DOMAIN_DEPS: Record<DomainId, readonly DomainId[]> = {
  journey: ['compliance'],
  clinical: ['compliance'],
  pharmacy: ['compliance'],
  revenue: [],
  people: ['compliance'],
  compliance: [],
  platform: [],
};

/** Features that compose other features' screens (the app shell and the admin console) and may import from any domain. */
export const COMPOSERS: readonly string[] = ['shell', 'admin'];

export const domainOf = (feature: string): DomainId | undefined =>
  (Object.keys(DOMAINS) as DomainId[]).find((d) => DOMAINS[d].features.includes(feature));
