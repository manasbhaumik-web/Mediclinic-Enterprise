import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GlobalSpinner from '../components/ui/GlobalSpinner';
import Button from '../components/ui/Button';

const MIN_LENGTH = 10;

/** Problems with a proposed password, as readable sentences. */
export function passwordProblems(password: string, confirm: string): string[] {
  const problems: string[] = [];
  if (password.length < MIN_LENGTH) problems.push(`Use at least ${MIN_LENGTH} characters.`);
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) problems.push('Include an uppercase letter, a lowercase letter and a number.');
  if (password !== confirm) problems.push('The two passwords do not match.');
  return problems;
}

/**
 * Landing page for the invitation and password-reset emails. Supabase signs the person in from the link,
 * and this page lets them choose their own password before they continue.
 */
export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // The client reads the session from the link; give it a moment, and also listen for the sign-in event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) setStatus('ready');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) setStatus('ready');
      else setTimeout(() => { if (!cancelled) setStatus((s) => (s === 'checking' ? 'invalid' : s)); }, 2500);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problems = passwordProblems(password, confirm);
    if (problems.length) { setError(problems.join(' ')); return; }
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message.includes('weak') || updateError.message.includes('pwned')
        ? 'That password is too easy to guess. Choose a different one.'
        : 'Could not save the password. The link may have expired; ask for a new invitation.');
      setSaving(false);
      return;
    }
    // Sign out so they log in once with the new password and land on their own home page.
    await supabase.auth.signOut();
    navigate('/login', { replace: true, state: { passwordSet: true } });
  };

  if (status === 'checking') return <GlobalSpinner />;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-sans text-ink">
      <div className="max-w-md w-full bg-surface border border-line-subtle shadow-2xl p-8 space-y-5">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="type-page-title text-ink">Set your password</h1>
        </div>

        {status === 'invalid' ? (
          <div className="space-y-3">
            <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
              This link is invalid or has expired.
            </p>
            <p className="text-xs text-muted">Ask your administrator to send a new invitation, or use "Forgot password" if you already have an account.</p>
            <Button size="sm" onClick={() => navigate('/login')}>Go to sign in</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-xs text-muted">Choose a password for your Mediclinic account. Nobody else, including administrators, will ever see it.</p>
            <label className="block text-2xs font-bold uppercase tracking-wider text-muted" htmlFor="new-password">New password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-accent absolute left-3 top-1/2 -translate-y-1/2" />
              <input id="new-password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-surface border border-line-subtle rounded-none text-xs font-bold outline-none focus:border-brand focus:ring-2 focus:ring-brand/30" />
            </div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-muted" htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-line-subtle rounded-none text-xs font-bold outline-none focus:border-brand focus:ring-2 focus:ring-brand/30" />
            <p className="text-2xs text-subtle">At least {MIN_LENGTH} characters with an uppercase letter, a lowercase letter and a number.</p>
            {error && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">{error}</p>}
            <Button type="submit" fullWidth disabled={saving}>{saving ? 'Saving…' : 'Save password and continue'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
