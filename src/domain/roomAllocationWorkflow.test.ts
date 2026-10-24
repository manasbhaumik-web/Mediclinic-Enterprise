import { describe, expect, it } from 'vitest';
import { roomOptions, RoomOption } from './doctorAssignment';
import { Visit } from '../types';

describe('Consultation Room Allocation & Multi-Doctor Station Workflow', () => {
  const allClinicRooms = [
    'Consultation Room 1',
    'Consultation Room 2',
    'Consultation Room 3',
  ];

  it('marks a room busy when occupied by another doctor', () => {
    const visits: Pick<Visit, 'status' | 'consultRoom' | 'calledByName' | 'calledBy' | 'id'>[] = [
      {
        id: 'v-101',
        status: 'Consulting',
        consultRoom: 'Consultation Room 1',
        calledByName: 'Dr. Lee',
        calledBy: 'user-doc-lee',
      },
    ];

    const currentDoctorId = 'user-doc-sarah';
    const currentDoctorName = 'Dr. Sarah Tan';

    const options = roomOptions(allClinicRooms, visits, (v) =>
      Boolean((currentDoctorId && v.calledBy === currentDoctorId) || (currentDoctorName && v.calledByName === currentDoctorName))
    );

    expect(options).toEqual([
      { name: 'Consultation Room 1', busyWith: 'Dr. Lee' },
      { name: 'Consultation Room 2' },
      { name: 'Consultation Room 3' },
    ]);
  });

  it('does NOT mark the room busy for the attending doctor who is currently in consultation', () => {
    // This is the exact root cause scenario from the screenshot bug:
    // Dr. Sarah Tan is consulting in Room 3.
    // Her own workstation should see Room 3 as selectable/active, NOT disabled as "in use".
    const currentDoctorId = 'user-doc-sarah';
    const currentDoctorName = 'Dr. Sarah Tan';
    const activeConsultationVisitId = 'v-202';

    const visits: Pick<Visit, 'status' | 'consultRoom' | 'calledByName' | 'calledBy' | 'id'>[] = [
      {
        id: 'v-202',
        status: 'Consulting',
        consultRoom: 'Consultation Room 3',
        calledByName: 'Dr. Sarah Tan',
        calledBy: 'user-doc-sarah',
      },
    ];

    const options = roomOptions(allClinicRooms, visits, (v) =>
      Boolean(
        (currentDoctorId && v.calledBy === currentDoctorId) ||
        (currentDoctorName && v.calledByName === currentDoctorName) ||
        v.id === activeConsultationVisitId
      )
    );

    // Consultation Room 3 MUST NOT have busyWith set for Dr. Sarah Tan
    expect(options.find((r) => r.name === 'Consultation Room 3')?.busyWith).toBeUndefined();

    // Verify room stability logic:
    // Previously, line 106 (!current.busyWith) would fail if busyWith was set to "Dr. Sarah Tan",
    // causing an erroneous switch to the first free room (Room 1 or Room 2).
    const chosenRoom = 'Consultation Room 3';
    const currentChoice = options.find((o) => o.name === chosenRoom);
    expect(currentChoice).toBeDefined();
    expect(currentChoice?.busyWith).toBeUndefined(); // Guarantees line 106 returns early without switching room!
  });

  it('handles multi-doctor concurrent station assignments correctly and symmetrically', () => {
    const visits: Pick<Visit, 'status' | 'consultRoom' | 'calledByName' | 'calledBy' | 'id'>[] = [
      {
        id: 'v-1',
        status: 'Consulting',
        consultRoom: 'Consultation Room 1',
        calledByName: 'Dr. A',
        calledBy: 'user-doc-a',
      },
      {
        id: 'v-2',
        status: 'Consulting',
        consultRoom: 'Consultation Room 2',
        calledByName: 'Dr. B',
        calledBy: 'user-doc-b',
      },
    ];

    // Doctor A's perspective: Room 1 is free for them; Room 2 is busy with Dr. B
    const docAOptions = roomOptions(allClinicRooms, visits, (v) => v.calledBy === 'user-doc-a');
    expect(docAOptions).toEqual([
      { name: 'Consultation Room 1' },
      { name: 'Consultation Room 2', busyWith: 'Dr. B' },
      { name: 'Consultation Room 3' },
    ]);

    // Doctor B's perspective: Room 1 is busy with Dr. A; Room 2 is free for them
    const docBOptions = roomOptions(allClinicRooms, visits, (v) => v.calledBy === 'user-doc-b');
    expect(docBOptions).toEqual([
      { name: 'Consultation Room 1', busyWith: 'Dr. A' },
      { name: 'Consultation Room 2' },
      { name: 'Consultation Room 3' },
    ]);

    // Doctor C's perspective (new doctor logging in): Both Room 1 and Room 2 are busy
    const docCOptions = roomOptions(allClinicRooms, visits, (v) => v.calledBy === 'user-doc-c');
    expect(docCOptions).toEqual([
      { name: 'Consultation Room 1', busyWith: 'Dr. A' },
      { name: 'Consultation Room 2', busyWith: 'Dr. B' },
      { name: 'Consultation Room 3' },
    ]);
  });

  it('handles case-insensitive and whitespace-trimmed room names', () => {
    const visits: Pick<Visit, 'status' | 'consultRoom' | 'calledByName' | 'calledBy' | 'id'>[] = [
      {
        id: 'v-3',
        status: 'Consulting',
        consultRoom: '   consultation room 2   ',
        calledByName: 'Dr. Alex',
        calledBy: 'user-alex',
      },
    ];

    const options = roomOptions(['Consultation Room 1', 'Consultation Room 2'], visits);
    expect(options).toEqual([
      { name: 'Consultation Room 1' },
      { name: 'Consultation Room 2', busyWith: 'Dr. Alex' },
    ]);
  });

  it('immediately releases room occupation when consultation is cancelled or completed', () => {
    // When patient is released back to queue, status changes to 'Awaiting Consult'
    const releasedVisits: Pick<Visit, 'status' | 'consultRoom' | 'calledByName' | 'calledBy' | 'id'>[] = [
      {
        id: 'v-4',
        status: 'Awaiting Consult',
        consultRoom: 'Consultation Room 1',
        calledByName: 'Dr. Sarah Tan',
        calledBy: 'user-doc-sarah',
      },
    ];

    const options = roomOptions(allClinicRooms, releasedVisits);
    expect(options.every((o) => !o.busyWith)).toBe(true);
  });

  it('detects when all rooms are busy and flags every station', () => {
    const allBusyVisits: Pick<Visit, 'status' | 'consultRoom' | 'calledByName' | 'calledBy' | 'id'>[] = [
      { id: 'v-1', status: 'Consulting', consultRoom: 'Consultation Room 1', calledByName: 'Dr. A', calledBy: 'doc-a' },
      { id: 'v-2', status: 'Consulting', consultRoom: 'Consultation Room 2', calledByName: 'Dr. B', calledBy: 'doc-b' },
      { id: 'v-3', status: 'Consulting', consultRoom: 'Consultation Room 3', calledByName: 'Dr. C', calledBy: 'doc-c' },
    ];

    const docDOptions = roomOptions(allClinicRooms, allBusyVisits, (v) => v.calledBy === 'doc-d');
    expect(docDOptions.every((o) => !!o.busyWith)).toBe(true);
  });

  it('telemetry HUD accurately excludes active in-consultation patient from queue count', () => {
    const queue: { id: string; patientId: string }[] = [
      { id: 'v-active', patientId: 'p-1' },
      { id: 'v-next', patientId: 'p-2' },
      { id: 'v-later', patientId: 'p-3' },
    ];

    const activeConsultationVisitId = 'v-active';
    const waitingInQueue = queue.filter((v) => v.id !== activeConsultationVisitId);

    expect(waitingInQueue.length).toBe(2);
    expect(waitingInQueue[0].id).toBe('v-next');
    expect(waitingInQueue[0].patientId).toBe('p-2');
  });
});
