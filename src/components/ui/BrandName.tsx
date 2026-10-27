import React from 'react';

interface BrandNameProps {
  name?: string;
  className?: string;
  accentClassName?: string;
  as?: 'span' | 'h1' | 'h2' | 'div' | 'p';
}

/**
 * Capitalizes a word or string to First Letter Caps (Title Case).
 * E.g. "MEDICLINIC" -> "Mediclinic", "ENTERPRISE" -> "Enterprise".
 * If the string already has mixed case, it is preserved.
 */
function toFirstLetterCaps(word: string): string {
  if (!word) return '';
  if (word === word.toUpperCase() && word.length > 3) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  return word;
}

/**
 * Splits a brand name into a primary leading section and a stylized accent trailing word
 * to create a modern dual-tone / dual-color typography treatment.
 * Formats all-caps names with First Letter Caps for each word.
 */
export function splitBrandName(rawName: string = 'Mediclinic Enterprise'): { first: string; last: string } {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return { first: 'Mediclinic', last: 'Enterprise' };
  }

  // If the entire multi-word string is in ALL CAPS, convert each word to First Letter Caps
  const formattedName = (trimmed === trimmed.toUpperCase() && trimmed.length > 3)
    ? trimmed.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
    : trimmed;

  const words = formattedName.split(/\s+/);
  if (words.length > 1) {
    return {
      first: words.slice(0, -1).join(' '),
      last: words[words.length - 1],
    };
  }

  // Handle compound medical brand words (e.g., "MEDICLINIC" -> "Medi" + "Clinic", "Poliklinik" -> "Poli" + "klinik")
  const medicalSuffixMatch = trimmed.match(/^(.*)(CLINIC|KLINIK|CARE|HEALTH|MED|MEDICAL|MEDIC)$/i);
  if (medicalSuffixMatch && medicalSuffixMatch[1] && medicalSuffixMatch[2]) {
    return { 
      first: toFirstLetterCaps(medicalSuffixMatch[1]), 
      last: toFirstLetterCaps(medicalSuffixMatch[2]) 
    };
  }

  // Handle camelCase / PascalCase words (e.g., "MediClinic" -> "Medi" + "Clinic")
  if (trimmed.length > 4) {
    const camelMatch = trimmed.match(/^([A-Z][a-z]+)([A-Z].*)$/);
    if (camelMatch) {
      return { first: camelMatch[1], last: camelMatch[2] };
    }
    const mid = Math.floor(trimmed.length / 2);
    return { first: toFirstLetterCaps(trimmed.slice(0, mid)), last: toFirstLetterCaps(trimmed.slice(mid)) };
  }

  return { first: trimmed, last: '' };
}

export default function BrandName({
  name = 'Mediclinic Enterprise',
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
