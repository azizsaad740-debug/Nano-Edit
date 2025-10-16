import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/integrations/supabase/session-provider";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const LOCAL_STORAGE_KEY = "nanoedit-api-key";

export const useSettings = () => {
  const { user, isGuest } = useSession();
  const [apiKey, setApiKey] = useState<string>("");
  const [isFetching, setIsFetching] = useState(true);

  // 1. Fetch key from Supabase or load from local storage
  useEffect(() => {
    const fetchKey = async () => {
      setIsFetching(true);
      if (user) {
        // Authenticated user: fetch from Supabase profile
        const { data, error } = await supabase
          .from('profiles')
          .select('ai_api_key')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching API key:", error);
          setApiKey("");
        } else if (data?.ai_api_key) {
          setApiKey(data.ai_api_key);
        } else {
          setApiKey("");
        }
        // Clear local storage key if authenticated
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else if (isGuest) {
        // Guest user: load from local storage
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) setApiKey(stored);
        else setApiKey("");
      } else {
        // Not loaded yet or unauthenticated (should redirect to login)
        setApiKey("");
      }
      setIsFetching(false);
    };

    if (user !== undefined) { // Wait until user status is determined
      fetchKey();
    }
  }, [user, isGuest]);

  // 2. Save key to Supabase or local storage
  const saveApiKey = useCallback(async (key: string) => {
    const trimmedKey = key.trim();
    setApiKey(trimmedKey);

    if (user) {
      // Authenticated user: save to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ ai_api_key: trimmedKey, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error("Error saving API key:", error);
        showError("Failed to save API key to profile.");
      } else {
        showSuccess("API Key saved to your profile.");
      }
    } else if (isGuest) {
      // Guest user: save to local storage
      localStorage.setItem(LOCAL_STORAGE_KEY, trimmedKey);
      showSuccess("API Key saved locally.");
    }
  }, [user, isGuest]);

  return { apiKey, saveApiKey, isFetching };
};