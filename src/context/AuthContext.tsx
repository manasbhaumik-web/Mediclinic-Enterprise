import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { RBACPermissionEngine } from '../lib/rbacPermissionEngine';
import { UserRole } from '../types';

const VALID_ROLES: UserRole[] = ['doctor', 'pharmacist', 'clinic-assistant', 'admin', 'hr'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** Role read from `profiles.role` for the signed-in Supabase user. Never set from the client. */
  role: UserRole | null;
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
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPII, setShowPIIState] = useState(false);

  // Resolves the role (and display name) for a user; returns null when there is no valid profile.
  const fetchProfile = useCallback(async (userId: string): Promise<{ role: UserRole; fullName: string | null } | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();
      if (error || !data || !VALID_ROLES.includes(data.role as UserRole)) return null;
      return { role: data.role as UserRole, fullName: (data.full_name as string | null)?.trim() || null };
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
        setFullName(null);
        setShowPIIState(false);
        setIsLoading(false);
        return;
      }
      const resolved = await fetchProfile(next.user.id);
      if (cancelled) return;
      setRole(resolved?.role ?? null);
      setFullName(resolved?.fullName ?? null);
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
    const { data, error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
    if (error || !data.user) {
      if (error?.name === 'AuthRetryableFetchError') return 'Cannot reach the server. Check your connection and try again.';
      return 'Invalid email or password.';
    }

    const resolved = await fetchProfile(data.user.id);
    if (!resolved) {
      // Authenticated but not provisioned as clinic staff: do not leave a session open.
      await supabase.auth.signOut();
      return 'This account has no staff role assigned. Contact your administrator.';
    }

    setSession(data.session);
    setUser(data.user);
    setRole(resolved.role);
    setFullName(resolved.fullName);
    setShowPIIState(false);
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setFullName(null);
    setShowPIIState(false);
  };

  // Unmasking is only honoured for roles holding VIEW_FULL_NRIC; masking is always allowed.
  const setShowPII = (show: boolean) => {
    setShowPIIState(show && RBACPermissionEngine.hasPermission(role, 'VIEW_FULL_NRIC'));
  };

  return (
    <AuthContext.Provider value={{ session, user, role, fullName, isLoading, showPII, setShowPII, signIn, signOut }}>
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
