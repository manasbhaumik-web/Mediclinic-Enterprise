// Reads result messages from lab analyzers, imaging gateways and point-of-care devices into one shape.
// Pure functions with no imports, so the edge function, the browser file import and the tests all use the same code.
//
// Supported: HL7 v2 (ORU^R01 result messages), FHIR (an Observation, a DiagnosticReport's observations, or a Bundle of
// them) and a plain JSON format for small bridges. Error text never includes patient data.

export type DeviceFormat = 'hl7v2' | 'fhir' | 'json';

export interface DeviceObservation {
  /** Unique per device and test, used to ignore a message sent twice. */
  messageId: string;
  /** The patient identifier as the device sent it (normally the IC number). */
  patientRef: string;
  /** The device's own code for the test. */
  deviceCode: string;
  value: string;
  unit: string;
  range: string;
  abnormal: boolean;
  observedAt?: string;
  /** Free-text report, such as an imaging finding. */
  notes: string;
}

export interface ParsedDeviceMessage {
  format: DeviceFormat;
  observations: DeviceObservation[];
  errors: string[];
  /** HL7 control id, so an acknowledgement can quote it. */
  controlId?: string;
}

export const MAX_MESSAGE_BYTES = 200_000;
export const MAX_OBSERVATIONS = 200;

const clean = (v: unknown, max: number): string => (typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : '');

/** Guesses the format from the body, so a device does not have to say what it is sending. */
export function detectFormat(body: string, contentType = ''): DeviceFormat | null {
  const text = body.trimStart();
  if (text.startsWith('MSH|')) return 'hl7v2';
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const j = JSON.parse(text);
      const first = Array.isArray(j) ? j[0] : j;
      if (first && typeof first === 'object' && typeof (first as any).resourceType === 'string') return 'fhir';
      return 'json';
    } catch {
      return null;
    }
  }
  if (/hl7/i.test(contentType)) return 'hl7v2';
  return null;
}

// ---- HL7 v2 --------------------------------------------------------------------------------------------------------

function unescapeHl7(v: string, seps: { field: string; comp: string; rep: string; esc: string; sub: string }): string {
  if (!v.includes(seps.esc)) return v;
  const e = seps.esc;
  return v.replace(new RegExp(`${escapeRe(e)}([FSTRE])${escapeRe(e)}`, 'g'), (_, c: string) =>
    ({ F: seps.field, S: seps.comp, T: seps.sub, R: seps.rep, E: seps.esc } as Record<string, string>)[c]);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function hl7Time(v: string): string | undefined {
  const m = v.match(/^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return undefined;
  const [, y, mo = '01', d = '01', h = '00', mi = '00', s = '00'] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}

// Flags that mean "outside normal". N (normal) and blank are not abnormal.
const HL7_NORMAL = new Set(['', 'N']);

export function parseHl7(text: string): ParsedDeviceMessage {
  const errors: string[] = [];
  const observations: DeviceObservation[] = [];
  const segments = text.split(/\r\n|\r|\n/).map((s) => s.trim()).filter(Boolean);
  const msh = segments.find((s) => s.startsWith('MSH'));
  if (!msh) return { format: 'hl7v2', observations, errors: ['Not an HL7 message: no MSH segment.'] };

  const fieldSep = msh[3] ?? '|';
  const enc = msh.slice(4, msh.indexOf(fieldSep, 4)) || '^~\\&';
  const seps = { field: fieldSep, comp: enc[0] ?? '^', rep: enc[1] ?? '~', esc: enc[2] ?? '\\', sub: enc[3] ?? '&' };
  const mshFields = msh.split(fieldSep);
  const type = mshFields[8] ?? '';
  const controlId = clean(mshFields[9], 100) || undefined;
  if (type && !/^ORU/i.test(type)) errors.push(`Message type ${clean(type, 20)} is not a result message (ORU).`);

  let patientRef = '';
  let counter = 0;
  for (const seg of segments) {
    const f = seg.split(fieldSep);
    if (f[0] === 'PID') {
      const first = (v?: string) => (v ?? '').split(seps.rep)[0].split(seps.comp)[0].trim();
      // PID-3 is the identifier list; fall back to PID-2 in older senders.
      patientRef = first(f[3]) || first(f[2]);
    } else if (f[0] === 'OBX') {
      counter += 1;
      const codeParts = (f[3] ?? '').split(seps.comp);
      const deviceCode = clean(unescapeHl7(codeParts[0] ?? '', seps), 100);
      if (!deviceCode) {
        errors.push(`Result ${counter} has no test code and was skipped.`);
        continue;
      }
      const valueType = (f[2] ?? '').toUpperCase();
      const rawValue = unescapeHl7(f[5] ?? '', seps).replace(/\\\.br\\/gi, '\n');
      const isText = valueType === 'TX' || valueType === 'FT';
      const unit = clean(unescapeHl7((f[6] ?? '').split(seps.comp)[0], seps), 50);
      const flag = (f[8] ?? '').trim().toUpperCase();
      const setId = clean(f[1], 10) || String(counter);
      observations.push({
        messageId: `${controlId ?? 'nomsg'}#${setId}`,
        patientRef,
        deviceCode,
        value: isText ? '' : clean(rawValue.split(seps.comp)[0], 500),
        unit,
        range: clean(unescapeHl7(f[7] ?? '', seps), 100),
        abnormal: !HL7_NORMAL.has(flag),
        observedAt: hl7Time(f[14] ?? ''),
        notes: isText ? clean(rawValue, 2000) : '',
      });
    }
  }
  if (observations.length === 0 && errors.length === 0) errors.push('The message has no results (no OBX segments).');
  if (observations.length > 0 && !patientRef) errors.push('The message has no patient identifier (PID-3).');
  return { format: 'hl7v2', observations, errors, controlId };
}

/** An HL7 acknowledgement the device or its middleware expects back. AA = accepted, AE = error. */
export function buildHl7Ack(controlId: string | undefined, ok: boolean, now = new Date()): string {
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const id = `ACK${ts}`;
  return `MSH|^~\\&|MEDICLINIC|CLINIC|||${ts}||ACK^R01|${id}|P|2.5\rMSA|${ok ? 'AA' : 'AE'}|${controlId ?? ''}\r`;
}

// ---- FHIR ----------------------------------------------------------------------------------------------------------

const FHIR_NORMAL = new Set(['N', 'NEG', 'NORMAL', 'S']);

function fhirValue(o: any): { value: string; unit: string; notes: string } {
  if (o.valueQuantity && o.valueQuantity.value !== undefined) {
    return { value: clean(o.valueQuantity.value, 500), unit: clean(o.valueQuantity.unit ?? o.valueQuantity.code, 50), notes: '' };
  }
  if (typeof o.valueString === 'string') {
    const s = o.valueString.trim();
    return s.length > 60 || s.includes('\n') ? { value: '', unit: '', notes: clean(s, 2000) } : { value: clean(s, 500), unit: '', notes: '' };
  }
  if (o.valueCodeableConcept) return { value: clean(o.valueCodeableConcept.text ?? o.valueCodeableConcept.coding?.[0]?.display ?? o.valueCodeableConcept.coding?.[0]?.code, 500), unit: '', notes: '' };
  if (typeof o.valueBoolean === 'boolean') return { value: o.valueBoolean ? 'Positive' : 'Negative', unit: '', notes: '' };
  if (typeof o.valueInteger === 'number') return { value: String(o.valueInteger), unit: '', notes: '' };
  return { value: '', unit: '', notes: clean(o.note?.[0]?.text, 2000) };
}

function fhirRange(o: any): string {
  const r = o.referenceRange?.[0];
  if (!r) return '';
  if (typeof r.text === 'string') return clean(r.text, 100);
  const low = r.low?.value;
  const high = r.high?.value;
  if (low !== undefined && high !== undefined) return `${low}-${high}`;
  if (high !== undefined) return `<${high}`;
  if (low !== undefined) return `>${low}`;
  return '';
}

function patientIdentifier(ref: any, byRef: Map<string, any>): string {
  const direct = ref?.identifier?.value;
  if (direct) return clean(direct, 60);
  const reference: string = typeof ref?.reference === 'string' ? ref.reference : '';
  const resource = reference ? byRef.get(reference) : undefined;
  if (resource?.identifier?.[0]?.value) return clean(resource.identifier[0].value, 60);
  // "Patient/991001101111": the id after the slash is the identifier when the sender uses the IC as the id.
  const tail = reference.split('/').pop() ?? '';
  return reference.startsWith('urn:') ? '' : clean(tail, 60);
}

export function parseFhir(input: unknown): ParsedDeviceMessage {
  const errors: string[] = [];
  const observations: DeviceObservation[] = [];
  const resources: any[] = [];
  const byRef = new Map<string, any>();
  const roots = Array.isArray(input) ? input : [input];
  for (const root of roots as any[]) {
    if (root?.resourceType === 'Bundle') {
      (root.entry ?? []).forEach((e: any, i: number) => {
        const r = e?.resource;
        if (!r) return;
        if (e.fullUrl) byRef.set(e.fullUrl, r);
        if (r.id) byRef.set(`${r.resourceType}/${r.id}`, r);
        resources.push({ ...r, _bundle: root.id ?? 'bundle', _index: i });
      });
    } else if (root && typeof root === 'object') {
      resources.push(root);
    }
  }

  let n = 0;
  for (const r of resources) {
    if (r.resourceType !== 'Observation') continue;
    n += 1;
    const coding = r.code?.coding?.[0];
    const deviceCode = clean(coding?.code ?? r.code?.text, 100);
    if (!deviceCode) {
      errors.push(`Observation ${n} has no code and was skipped.`);
      continue;
    }
    const { value, unit, notes } = fhirValue(r);
    const interpretation = clean(r.interpretation?.[0]?.coding?.[0]?.code ?? r.interpretation?.[0]?.text, 20).toUpperCase();
    observations.push({
      messageId: clean(r.id ?? `${r._bundle ?? 'obs'}#${r._index ?? n}`, 120),
      patientRef: patientIdentifier(r.subject, byRef),
      deviceCode,
      value,
      unit,
      range: fhirRange(r),
      abnormal: interpretation !== '' && !FHIR_NORMAL.has(interpretation),
      observedAt: typeof (r.effectiveDateTime ?? r.issued) === 'string' ? (r.effectiveDateTime ?? r.issued) : undefined,
      notes,
    });
  }
  if (observations.length === 0 && errors.length === 0) errors.push('No Observation resources found.');
  if (observations.some((o) => !o.patientRef)) errors.push('Some observations have no patient identifier.');
  return { format: 'fhir', observations, errors };
}

// ---- plain JSON ----------------------------------------------------------------------------------------------------

/** { "messageId": "A1", "patient": "991001-10-1111", "results": [ { "code": "HBA1C", "value": "7.9", "unit": "%", "range": "4.0-5.6", "flag": "H" } ] } */
export function parseJsonMessage(input: unknown): ParsedDeviceMessage {
  const errors: string[] = [];
  const observations: DeviceObservation[] = [];
  const messages = Array.isArray(input) ? input : [input];
  messages.forEach((m: any, mi) => {
    const patientRef = clean(m?.patient ?? m?.patientId ?? m?.ic, 60);
    const base = clean(m?.messageId ?? m?.id, 100) || `json${mi + 1}`;
    const results: any[] = Array.isArray(m?.results) ? m.results : [];
    results.forEach((r, ri) => {
      const deviceCode = clean(r?.code ?? r?.test, 100);
      if (!deviceCode) {
        errors.push(`Message ${mi + 1}, result ${ri + 1} has no code and was skipped.`);
        return;
      }
      const flag = clean(r?.flag, 10).toUpperCase();
      observations.push({
        messageId: `${base}#${ri + 1}`,
        patientRef,
        deviceCode,
        value: clean(r?.value, 500),
        unit: clean(r?.unit, 50),
        range: clean(r?.range ?? r?.referenceRange, 100),
        abnormal: typeof r?.abnormal === 'boolean' ? r.abnormal : flag !== '' && !HL7_NORMAL.has(flag),
        observedAt: typeof r?.observedAt === 'string' ? r.observedAt : undefined,
        notes: clean(r?.notes ?? r?.report, 2000),
      });
    });
    if (results.length > 0 && !patientRef) errors.push(`Message ${mi + 1} has no patient identifier.`);
  });
  if (observations.length === 0 && errors.length === 0) errors.push('The message has no results.');
  return { format: 'json', observations, errors };
}

// ---- entry point ---------------------------------------------------------------------------------------------------

export function parseDeviceMessage(body: string, hint?: DeviceFormat, contentType = ''): ParsedDeviceMessage {
  if (body.length > MAX_MESSAGE_BYTES) return { format: hint ?? 'json', observations: [], errors: ['The message is too large.'] };
  const format = hint ?? detectFormat(body, contentType);
  if (!format) return { format: 'json', observations: [], errors: ['The message format was not recognised (expected HL7 v2, FHIR or JSON).'] };

  let parsed: ParsedDeviceMessage;
  if (format === 'hl7v2') {
    parsed = parseHl7(body);
  } else {
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      return { format, observations: [], errors: ['The message is not valid JSON.'] };
    }
    parsed = format === 'fhir' ? parseFhir(json) : parseJsonMessage(json);
  }
  if (parsed.observations.length > MAX_OBSERVATIONS) {
    return { ...parsed, observations: [], errors: [`Too many results in one message (the limit is ${MAX_OBSERVATIONS}).`] };
  }
  return parsed;
}

/** Whether a parsed message can be stored: it has results and every result names a patient. */
export function isUsable(p: ParsedDeviceMessage): boolean {
  return p.observations.length > 0 && p.observations.every((o) => o.patientRef !== '');
}
