import { supabase } from "@/integrations/supabase/client";
import { showError } from "./toast";

const EDGE_FUNCTION_URL = "https://bwgdgbgwkgiwkwabynvv.supabase.co/functions/v1/ai-orchestrator";

/**
 * Calls the AI Orchestrator Edge Function for image generation.
 */
export const generateImageApi = async (prompt: string, width: number, height: number): Promise<string> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Supabase client handles Authorization header automatically if session is active
        'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
      },
      body: JSON.stringify({
        command: 'generate_image',
        prompt,
        width,
        height,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `AI Orchestrator failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.resultUrl;
  } catch (error) {
    console.error("Generate Image API Error:", error);
    showError(error.message || "Failed to generate image via orchestrator.");
    throw error;
  }
};

/**
 * Calls the AI Orchestrator Edge Function for generative fill.
 */
export const generativeFillApi = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
      },
      body: JSON.stringify({
        command: 'generative_fill',
        prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `AI Orchestrator failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.resultUrl;
  } catch (error) {
    console.error("Generative Fill API Error:", error);
    showError(error.message || "Failed to perform generative fill via orchestrator.");
    throw error;
  }
};