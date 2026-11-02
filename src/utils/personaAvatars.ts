export function getPersonaAvatar(role?: string | null): string {
  if (!role) return '/personas/doctor.jpg';
  const r = role.toLowerCase();
  if (r.includes('doctor') || r.includes('physician')) return '/personas/doctor.jpg';
  if (r.includes('pharmacist') || r.includes('dispensary')) return '/personas/pharmacist.jpg';
  if (r.includes('assistant') || r.includes('nurse') || r.includes('triage') || r.includes('receptionist')) return '/personas/nurse.jpg';
  if (r.includes('admin') || r.includes('hr') || r.includes('manager')) return '/personas/admin.jpg';
  return '/personas/doctor.jpg';
}
