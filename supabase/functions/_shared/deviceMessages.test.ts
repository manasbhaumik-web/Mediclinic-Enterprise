import { describe, it, expect } from 'vitest';
import { buildHl7Ack, detectFormat, isUsable, parseDeviceMessage, parseFhir, parseHl7, parseJsonMessage } from './deviceMessages';

const HL7 = [
  'MSH|^~\\&|ANALYZER|LAB|MEDICLINIC|CLINIC|20261119103000||ORU^R01|CTRL42|P|2.5',
  'PID|1||991001-10-1111^^^IC||Tan^Ah Kow',
  'OBR|1|||CBC^Complete blood count',
  'OBX|1|NM|HGB^Haemoglobin||11.2|g/dL|12-16|L|||F|||20261119102500',
  'OBX|2|NM|WBC^White cells||6.1|10*9/L|4-11|N|||F',
  'OBX|3|TX|IMP^Impression||Clear lung fields\\.br\\No effusion||||||F',
].join('\r');

describe('HL7 v2', () => {
  const p = parseHl7(HL7);

  it('reads the patient, control id and each result', () => {
    expect(p.errors).toEqual([]);
    expect(p.controlId).toBe('CTRL42');
    expect(p.observations).toHaveLength(3);
    expect(p.observations[0]).toMatchObject({ patientRef: '991001-10-1111', deviceCode: 'HGB', value: '11.2', unit: 'g/dL', range: '12-16', abnormal: true, messageId: 'CTRL42#1' });
    expect(p.observations[0].observedAt).toBe('2026-11-19T10:25:00Z');
  });

  it('treats a normal flag as normal', () => {
    expect(p.observations[1]).toMatchObject({ deviceCode: 'WBC', abnormal: false });
  });

  it('puts a text report in the notes, not the value', () => {
    expect(p.observations[2].value).toBe('');
    expect(p.observations[2].notes).toContain('Clear lung fields');
  });

  it('copes with line feeds instead of carriage returns', () => {
    expect(parseHl7(HL7.replace(/\r/g, '\n')).observations).toHaveLength(3);
  });

  it('reports a message that is not HL7, not a result, or has no patient', () => {
    expect(parseHl7('hello').errors[0]).toMatch(/no MSH/);
    expect(parseHl7('MSH|^~\\&|A|B|C|D|20261119||ADT^A01|1|P|2.5\rPID|1||X\rOBX|1|NM|A||1').errors.join(' ')).toMatch(/not a result message/);
    const noPid = parseHl7('MSH|^~\\&|A|B|C|D|20261119||ORU^R01|1|P|2.5\rOBX|1|NM|A||1');
    expect(noPid.errors.join(' ')).toMatch(/no patient identifier/);
    expect(isUsable(noPid)).toBe(false);
  });

  it('builds an acknowledgement that quotes the control id', () => {
    const ack = buildHl7Ack('CTRL42', true, new Date('2026-11-19T10:30:00Z'));
    expect(ack).toContain('MSA|AA|CTRL42');
    expect(buildHl7Ack('CTRL42', false)).toContain('MSA|AE|CTRL42');
  });
});

describe('FHIR', () => {
  const observation = {
    resourceType: 'Observation', id: 'obs1', code: { coding: [{ code: '4548-4', display: 'HbA1c' }] },
    subject: { identifier: { value: '991001101111' } }, valueQuantity: { value: 7.9, unit: '%' },
    referenceRange: [{ low: { value: 4 }, high: { value: 5.6 } }], interpretation: [{ coding: [{ code: 'H' }] }], effectiveDateTime: '2026-11-19T10:00:00Z',
  };

  it('reads a single Observation', () => {
    const p = parseFhir(observation);
    expect(p.observations[0]).toMatchObject({ messageId: 'obs1', patientRef: '991001101111', deviceCode: '4548-4', value: '7.9', unit: '%', range: '4-5.6', abnormal: true });
  });

  it('reads a Bundle and finds the patient on a Patient entry', () => {
    const bundle = {
      resourceType: 'Bundle', id: 'b1', entry: [
        { fullUrl: 'urn:uuid:p1', resource: { resourceType: 'Patient', id: 'p1', identifier: [{ value: '991001101111' }] } },
        { resource: { resourceType: 'Observation', code: { text: 'GLU' }, subject: { reference: 'urn:uuid:p1' }, valueQuantity: { value: 5.1, unit: 'mmol/L' } } },
      ],
    };
    const p = parseFhir(bundle);
    expect(p.observations).toHaveLength(1);
    expect(p.observations[0]).toMatchObject({ patientRef: '991001101111', deviceCode: 'GLU', value: '5.1', abnormal: false });
  });

  it('keeps a long text result as notes', () => {
    const p = parseFhir({ ...observation, valueQuantity: undefined, valueString: 'x'.repeat(100) });
    expect(p.observations[0].value).toBe('');
    expect(p.observations[0].notes).toHaveLength(100);
  });

  it('reports a resource that has no observations', () => {
    expect(parseFhir({ resourceType: 'Patient' }).errors[0]).toMatch(/No Observation/);
  });
});

describe('plain JSON', () => {
  it('reads results and a flag', () => {
    const p = parseJsonMessage({ messageId: 'A1', patient: '991001-10-1111', results: [{ code: 'HBA1C', value: '7.9', unit: '%', range: '4.0-5.6', flag: 'H' }, { code: 'CRP', value: '2' }] });
    expect(p.errors).toEqual([]);
    expect(p.observations.map((o) => [o.messageId, o.deviceCode, o.abnormal])).toEqual([['A1#1', 'HBA1C', true], ['A1#2', 'CRP', false]]);
  });

  it('skips a result with no code and says so', () => {
    const p = parseJsonMessage({ patient: 'X', results: [{ value: '1' }, { code: 'A', value: '2' }] });
    expect(p.observations).toHaveLength(1);
    expect(p.errors[0]).toMatch(/no code/);
  });
});

describe('parseDeviceMessage', () => {
  it('detects the format', () => {
    expect(detectFormat(HL7)).toBe('hl7v2');
    expect(detectFormat('{"resourceType":"Observation"}')).toBe('fhir');
    expect(detectFormat('{"patient":"x","results":[]}')).toBe('json');
    expect(detectFormat('hello')).toBeNull();
  });

  it('reads what the message is, even when the device is set to another format', () => {
    expect(parseDeviceMessage(HL7, 'json').format).toBe('hl7v2');
    expect(parseDeviceMessage(JSON.stringify({ patient: 'X', results: [{ code: 'A', value: '1' }] }), 'hl7v2').format).toBe('json');
  });

  it('rejects an unknown, invalid or oversized message without throwing', () => {
    expect(parseDeviceMessage('hello').errors[0]).toMatch(/not recognised/);
    expect(parseDeviceMessage('{bad', 'json').errors[0]).toMatch(/not valid JSON/);
    expect(parseDeviceMessage('x'.repeat(200_001), 'json').errors[0]).toMatch(/too large/);
  });

  it('limits how many results one message may carry', () => {
    const results = Array.from({ length: 201 }, (_, i) => ({ code: `C${i}`, value: '1' }));
    expect(parseDeviceMessage(JSON.stringify({ patient: 'X', results })).errors[0]).toMatch(/Too many/);
  });

  it('keeps patient details out of error text', () => {
    const p = parseDeviceMessage(JSON.stringify({ patient: '991001-10-1111', results: [{ value: '1' }] }));
    expect(p.errors.join(' ')).not.toContain('991001');
  });
});
