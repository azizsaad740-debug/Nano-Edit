import { useState, useEffect } from "react";

export const useSettings = () => {
  const [apiKey, setApiKey] = useState<string>("AIzaSyC0LHnoaK3YYF3J93J5CflDgEIGU5ymGGk");

  // Load stored key on mount
  useEffect(() => {
    const stored = localStorage.getItem("nanoedit-api-key");
    if (stored) setApiKey(stored);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("nanoedit-api-key", key);
  };

  return { apiKey, saveApiKey };
};