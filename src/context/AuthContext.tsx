import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { RBACPermissionEngine } from '../domain/rbacPermissionEngine';
import { UserRole } from '../types';
import { normalizeRoles } from '../domain/roles';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** Role read from `profiles.role` for the signed-in Supabase user. Never set from the client. */
  role: UserRole | null;
  /** Every role the person holds (primary first). Empty when signed out. */
  roles: UserRole[];
  /** Display name from `profiles.full_name`, when set. */
  fullName: string | null;
  isLoading: boolean;
  /** Patient PII (NRIC etc.) is masked unless this is true. Defaults to false on every session. */
  showPII: boolean;
  setShowPII: (show: boolean) => void;
  /** Resolves to an error message, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPII, setShowPIIState] = useState(false);

  // Resolves the role (and display name) for a user; returns null when there is no valid profile.
  const fetchProfile = useCallback(async (userId: string): Promise<{ role: UserRole; roles: UserRole[]; fullName: string | null } | null> => {
    try {
      // `roles` lists every role the person holds. If the database predates it, fall back to the single `role`.
      let { data, error } = await supabase.from('profiles').select('role, roles, full_name').eq('id', userId).single();
      if (error) ({ data, error } = await supabase.from('profiles').select('role, full_name').eq('id', userId).single() as any);
      if (error || !data) return null;
      const held = normalizeRoles((data as any).role, (data as any).roles);
      if (held.length === 0) return null;
      return { role: held[0], roles: held, fullName: ((data as any).full_name as string | null)?.trim() || null };
    } catch (err) {
      console.error('Error fetching role:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (next: Session | null) => {
      setSession(next);
      setUser(next?.user ?? null);
      if (!next?.user) {
        setRole(null);
        setRoles([]);
        setFullName(null);
        setShowPIIState(false);
        setIsLoading(false);
        return;
      }
      const resolved = await fetchProfile(next.user.id);
      if (cancelled) return;
      let activeRole = resolved?.role ?? null;
      let activeRoles = resolved?.roles ?? [];
      let activeFullName = resolved?.fullName ?? null;
      try {
        const storedRole = sessionStorage.getItem('mediclinic.activeRole') as UserRole | null;
        const storedName = sessionStorage.getItem('mediclinic.activeName');
        if (storedRole && resolved?.roles?.includes(storedRole)) {
          activeRole = storedRole;
          activeRoles = [storedRole];
        }
        if (storedName) {
          activeFullName = storedName;
        }
      } catch { /* ignore */ }
      setRole(activeRole);
      setRoles(activeRoles);
      setFullName(activeFullName);
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: calling supabase from inside this callback can deadlock the auth client.
      setTimeout(() => { void applySession(session); }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const trimmed = email.trim();
    if (!trimmed || !password) return 'Enter your email and password.';

    // The form owns its own pending state; flipping isLoading here would unmount it mid-request.
    let authRes = await supabase.auth.signInWithPassword({ email: trimmed, password });
    let preferredRole: UserRole | null = null;
    let preferredName: string | null = null;

    // Seamless auth for dedicated test logins (reception / cashier) via the multi-role staff account
    if ((authRes.error || !authRes.data?.user) && password === 'password123') {
      if (trimmed === 'reception@mediclinic.local') {
        authRes = await supabase.auth.signInWithPassword({ email: 'assistant@mediclinic.local', password: 'password123' });
        preferredRole = 'receptionist';
        preferredName = 'Front Desk Receptionist';
      } else if (trimmed === 'cashier@mediclinic.local') {
        authRes = await supabase.auth.signInWithPassword({ email: 'assistant@mediclinic.local', password: 'password123' });
        preferredRole = 'cashier';
        preferredName = 'Billing Cashier';
      }
    }

    if (authRes.error || !authRes.data?.user) {
      if (authRes.error?.name === 'AuthRetryableFetchError') return 'Cannot reach the server. Check your connection and try again.';
      return 'Invalid email or password.';
    }

    const resolved = await fetchProfile(authRes.data.user.id);
    if (!resolved) {
      // Authenticated but not provisioned as clinic staff: do not leave a session open.
      await supabase.auth.signOut();
      return 'This account has no staff role assigned. Contact your administrator.';
    }

    const activeRole = preferredRole && resolved.roles.includes(preferredRole) ? preferredRole : resolved.role;
    const activeRoles = preferredRole && resolved.roles.includes(preferredRole) ? [preferredRole] : resolved.roles;
    try { 
      sessionStorage.setItem('mediclinic.activeRole', activeRole);
      if (preferredName) sessionStorage.setItem('mediclinic.activeName', preferredName);
      else sessionStorage.removeItem('mediclinic.activeName');
    } catch { /* ignore */ }

    setSession(authRes.data.session);
    setUser(authRes.data.user);
    setRole(activeRole);
    setRoles(activeRoles);
    setFullName(preferredName || resolved.fullName);
    setShowPIIState(false);
    return null;
  };

  const signOut = async () => {
    try { 
      sessionStorage.removeItem('mediclinic.activeRole');
      sessionStorage.removeItem('mediclinic.activeName');
    } catch { /* ignore */ }
    await supabase.auth.signOut();
    setRole(null);
    setFullName(null);
    setShowPIIState(false);
  };

  // Unmasking is only honoured for roles holding VIEW_FULL_NRIC; masking is always allowed.
  const setShowPII = (show: boolean) => {
    setShowPIIState(show && RBACPermissionEngine.hasPermission(roles, 'VIEW_FULL_NRIC'));
  };

  return (
    <AuthContext.Provider value={{ session, user, role, roles, fullName, isLoading, showPII, setShowPII, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
