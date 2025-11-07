import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/integrations/supabase/session-provider";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const LOCAL_STORAGE_GEMINI_KEY = "nanoedit-gemini-api-key";
const LOCAL_STORAGE_STABILITY_KEY = "nanoedit-stability-api-key";
const DEFAULT_STABILITY_KEY = "sk-qS5I7Tp5qPxxp01k1r9bhTJMfIuFItkBoHqEfHp3hcVbSXhd";

export const useSettings = () => {
  const { user, isGuest } = useSession();
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [stabilityApiKey, setStabilityApiKey] = useState<string>("");
  const [isFetching, setIsFetching] = useState(true);

  // 1. Fetch keys from Supabase or load from local storage
  useEffect(() => {
    const fetchKeys = async () => {
      setIsFetching(true);
      
      let fetchedGeminiKey = "";
      let fetchedStabilityKey = DEFAULT_STABILITY_KEY;

      if (user) {
        // Authenticated user: fetch from Supabase profile
        const { data, error } = await supabase
          .from('profiles')
          .select('ai_api_key, stability_api_key')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching API keys:", error);
        } else if (data) {
          fetchedGeminiKey = data.ai_api_key || "";
          fetchedStabilityKey = data.stability_api_key || DEFAULT_STABILITY_KEY;
        }
        
        // Clear local storage keys if authenticated
        localStorage.removeItem(LOCAL_STORAGE_GEMINI_KEY);
        localStorage.removeItem(LOCAL_STORAGE_STABILITY_KEY);
      } else if (isGuest) {
        // Guest user: load from local storage
        fetchedGeminiKey = localStorage.getItem(LOCAL_STORAGE_GEMINI_KEY) || "";
        fetchedStabilityKey = localStorage.getItem(LOCAL_STORAGE_STABILITY_KEY) || DEFAULT_STABILITY_KEY;
      }

      setGeminiApiKey(fetchedGeminiKey);
      setStabilityApiKey(fetchedStabilityKey);
      setIsFetching(false);
    };

    if (user !== undefined) { // Wait until user status is determined
      fetchKeys();
    }
  }, [user, isGuest]);

  // 2. Save keys to Supabase or local storage
  const saveApiKey = useCallback(async (key: string, type: 'gemini' | 'stability') => {
    const trimmedKey = key.trim();
    
    if (type === 'gemini') {
      setGeminiApiKey(trimmedKey);
    } else {
      setStabilityApiKey(trimmedKey);
    }

    if (user) {
      // Authenticated user: save to Supabase
      const updateData: { [key: string]: string | Date } = { updated_at: new Date().toISOString() };
      if (type === 'gemini') {
        updateData.ai_api_key = trimmedKey;
      } else {
        updateData.stability_api_key = trimmedKey;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error(`Error saving ${type} API key:`, error);
        showError(`Failed to save ${type} API key to profile.`);
      } else {
        showSuccess(`${type} API Key saved to your profile.`);
      }
    } else if (isGuest) {
      // Guest user: save to local storage
      const storageKey = type === 'gemini' ? LOCAL_STORAGE_GEMINI_KEY : LOCAL_STORAGE_STABILITY_KEY;
      localStorage.setItem(storageKey, trimmedKey);
      showSuccess(`${type} API Key saved locally.`);
    }
  }, [user, isGuest]);

  return { 
    geminiApiKey, 
    stabilityApiKey, 
    saveApiKey, 
    isFetching 
  };
};