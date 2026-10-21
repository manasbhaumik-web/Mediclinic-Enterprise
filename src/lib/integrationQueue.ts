import { supabase } from './supabase';

/**
 * Ask the server to queue an outbound integration message for a record.
 * Only a reference (type + id) is sent: the worker reads the record from the database when it delivers it,
 * so patient data never passes through the browser on its way to a third party.
 *
 * Failures are logged and swallowed: a broken integration must never block clinical work.
 */
export async function enqueueIntegration(type: 'fhir', event: string, subjectType: 'visit', subjectId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('enqueue_integration_message', {
      p_type: type,
      p_event: event,
      p_subject_type: subjectType,
      p_subject_id: subjectId,
    });
    if (error) console.warn('Integration enqueue skipped:', error.message);
  } catch (err) {
    console.warn('Integration enqueue failed:', err);
  }
}
