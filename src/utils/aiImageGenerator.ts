import { supabase } from "@/integrations/supabase/client";
import { showError } from "./toast";

// Placeholder URL for the N8N Webhook endpoint
const EDGE_FUNCTION_URL = "https://n8n.example.com/webhook/ai-orchestrator-prod";

/**
 * Calls the AI Orchestrator Edge Function for image generation.
 */
export const generateImageApi = async (prompt: string, width: number, height: number): Promise<string> => {
  try {
    // NOTE: Authorization logic is simplified here. If your N8N webhook requires authentication, 
    // you must include the appropriate headers (e.g., API key).
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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