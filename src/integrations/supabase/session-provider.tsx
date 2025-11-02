"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { showLoading, dismissToast } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  setIsGuest: (isGuest: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for guest status in local storage on initial load
    const storedGuest = localStorage.getItem('nanoedit-is-guest');
    if (storedGuest === 'true') {
      setIsGuest(true);
      setIsLoading(false);
      return;
    }

    const initialLoadToast = showLoading("Checking session...");

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      dismissToast(initialLoadToast);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      dismissToast(initialLoadToast);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetIsGuest = (guestStatus: boolean) => {
    setIsGuest(guestStatus);
    localStorage.setItem('nanoedit-is-guest', String(guestStatus));
  };

  return (
    <SessionContext.Provider value={{ session, user, isLoading, isGuest, setIsGuest: handleSetIsGuest }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};