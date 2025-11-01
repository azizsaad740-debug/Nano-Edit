import { supabase } from "@/integrations/supabase/client";
import { showError } from "./toast";
import type { Dimensions } from "@/types/editor";

const EDGE_FUNCTION_URL = "https://bwgdgbgwkgiwkwabynvv.supabase.co/functions/v1/ai-orchestrator";

interface OrchestratorPayload {
  command: string;
  base64Image?: string;
  dimensions?: Dimensions;
  // Add other generic parameters as needed
}

interface OrchestratorResponse {
  resultUrl?: string;
  maskDataUrl?: string;
  colorAdjustments?: any; // Placeholder for color harmonization results
}

/**
 * Generic function to call the AI Orchestrator Edge Function with various commands.
 */
export const aiOrchestratorCall = async (payload: OrchestratorPayload): Promise<OrchestratorResponse> => {
  try {
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    if (!accessToken) {
      throw new Error("User not authenticated. Please log in or continue as guest.");
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `AI Orchestrator failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI Orchestrator API Error:", error);
    showError(error.message || "Failed to execute AI command via orchestrator.");
    throw error;
  }
};