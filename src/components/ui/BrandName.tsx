import React from 'react';

interface BrandNameProps {
  name?: string;
  className?: string;
  accentClassName?: string;
  as?: 'span' | 'h1' | 'h2' | 'div' | 'p';
}

/**
 * Splits a brand name into a primary leading section and a stylized accent trailing word
 * to create a modern dual-tone / dual-color typography treatment.
 */
export function splitBrandName(rawName: string = 'MEDICLINIC ENTERPRISE'): { first: string; last: string } {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return { first: 'MEDICLINIC', last: 'ENTERPRISE' };
  }

  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    return {
      first: words.slice(0, -1).join(' '),
      last: words[words.length - 1],
    };
  }

  // Handle compound medical brand words (e.g., "MEDICLINIC" -> "MEDI" + "CLINIC", "Poliklinik" -> "Poli" + "klinik")
  const medicalSuffixMatch = trimmed.match(/^(.*)(CLINIC|KLINIK|CARE|HEALTH|MED|MEDICAL|MEDIC)$/i);
  if (medicalSuffixMatch && medicalSuffixMatch[1] && medicalSuffixMatch[2]) {
    return { first: medicalSuffixMatch[1], last: medicalSuffixMatch[2] };
  }

  // Handle camelCase / PascalCase words (e.g., "MediClinic" -> "Medi" + "Clinic")
  if (trimmed.length > 4) {
    const camelMatch = trimmed.match(/^([A-Z][a-z]+)([A-Z].*)$/);
    if (camelMatch) {
      return { first: camelMatch[1], last: camelMatch[2] };
    }
    const mid = Math.floor(trimmed.length / 2);
    return { first: trimmed.slice(0, mid), last: trimmed.slice(mid) };
  }

  return { first: trimmed, last: '' };
}

export default function BrandName({
  name = 'MEDICLINIC ENTERPRISE',
  className = 'font-bold tracking-tight text-ink dark:text-white',
  accentClassName = 'text-accent',
  as: Component = 'span',
}: BrandNameProps) {
  const { first, last } = splitBrandName(name);

  return (
    <Component className={className}>
      <span>{first}</span>
      {last && (
        <>
          {' '}
          <span className={accentClassName}>{last}</span>
        </>
      )}
    </Component>
  );
}
