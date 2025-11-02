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
  isAdmin: boolean;
  setIsGuest: (isGuest: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      setIsAdmin(false);
    } else if (data) {
      setIsAdmin(data.is_admin || false);
    }
  };

  useEffect(() => {
    // Check for guest status in local storage on initial load
    const storedGuest = localStorage.getItem('nanoedit-is-guest');
    if (storedGuest === 'true') {
      setIsGuest(true);
      setIsLoading(false);
      return;
    }

    const initialLoadToast = showLoading("Checking session...");

    const handleSession = async (session: Session | null) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
      dismissToast(initialLoadToast);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetIsGuest = (guestStatus: boolean) => {
    setIsGuest(guestStatus);
    localStorage.setItem('nanoedit-is-guest', String(guestStatus));
  };

  return (
    <SessionContext.Provider value={{ session, user, isLoading, isGuest, isAdmin, setIsGuest: handleSetIsGuest }}>
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