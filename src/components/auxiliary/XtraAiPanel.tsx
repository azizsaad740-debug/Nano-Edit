import * as React from "react";
import { Button } from "@/components/ui/button";
import { Zap, Scissors, User, Palette, Smile, Settings } from "lucide-react";
import { aiOrchestratorCall } from "@/utils/aiOrchestrator";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import type { Dimensions } from "@/types/editor";

interface XtraAiPanelProps {
  hasImage: boolean;
  base64Image: string | null;
  dimensions: Dimensions | null;
  geminiApiKey: string;
  onImageResult: (resultUrl: string, historyName: string) => void;
  onMaskResult: (maskDataUrl: string, historyName: string) => void;
  onOpenSettings: () => void;
}

interface AiFeature {
  command: string;
  name: string;
  icon: React.ElementType;
  resultType: 'image' | 'mask' | 'adjustment';
  description: string;
}

const aiFeatures: AiFeature[] = [
  { command: 'remove_background', name: 'Remove Background', icon: Scissors, resultType: 'image', description: 'Removes the background, leaving the subject transparent.' },
  { command: 'select_subject', name: 'Select Subject', icon: User, resultType: 'mask', description: 'Automatically detects and selects the main subject.' },
  { command: 'harmonize_colors', name: 'Harmonize Colors', icon: Palette, resultType: 'adjustment', description: 'Analyzes and corrects color balance for a cohesive look.' },
  { command: 'beautify_portrait', name: 'Beautify Portrait', icon: Smile, resultType: 'image', description: 'Applies subtle enhancements to facial features and skin tone.' },
];

const XtraAiPanel: React.FC<XtraAiPanelProps> = ({
  hasImage,
  base64Image,
  dimensions,
  geminiApiKey,
  onImageResult,
  onMaskResult,
  onOpenSettings,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAiFeatureCall = async (feature: AiFeature) => {
    if (!hasImage || !base64Image || !dimensions) {
      showError("Please load an image first.");
      return;
    }
    // Note: We check geminiApiKey as a proxy for 'AI keys set', though the orchestrator handles auth.
    if (!geminiApiKey) {
      showError("Please set your Gemini API key in Settings first.");
      return;
    }

    setIsLoading(true);
    const toastId = showLoading(`Executing AI command: ${feature.name}...`);

    try {
      const payload = {
        command: feature.command,
        base64Image,
        dimensions,
      };
      
      const result = await aiOrchestratorCall(payload);

      if (feature.resultType === 'image' && result.resultUrl) {
        // Preload image before applying
        const img = new Image();
        img.onload = () => {
          onImageResult(result.resultUrl!, feature.name);
          showSuccess(`${feature.name} applied successfully.`);
        };
        img.onerror = () => {
          showError(`Failed to load result image for ${feature.name}.`);
        };
        img.src = result.resultUrl;
        
      } else if (feature.resultType === 'mask' && result.maskDataUrl) {
        onMaskResult(result.maskDataUrl, feature.name);
        showSuccess(`${feature.name} selection created.`);
        
      } else if (feature.resultType === 'adjustment') {
        // Stub: Apply color adjustments (e.g., update HSL/Grading state)
        showSuccess(`${feature.name} executed (Adjustment Stub).`);
        
      } else {
        throw new Error("AI command returned an unexpected result.");
      }

    } catch (error) {
      console.error(error);
      showError(`Failed to execute ${feature.name}.`);
    } finally {
      dismissToast(toastId);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Zap className="h-4 w-4" /> Xtra AI Features
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {aiFeatures.map((feature) => (
          <Button
            key={feature.command}
            variant="outline"
            size="sm"
            className="h-16 flex flex-col items-start justify-center text-left p-2"
            onClick={() => handleAiFeatureCall(feature)}
            disabled={isLoading || !hasImage}
          >
            <feature.icon className="h-4 w-4 mb-1 text-primary" />
            <span className="text-sm font-medium leading-tight">{feature.name}</span>
            <span className="text-xs text-muted-foreground leading-tight mt-0.5">{feature.description.split(' ').slice(0, 4).join(' ')}...</span>
          </Button>
        ))}
      </div>
      
      <div className="pt-4 border-t">
        <Button variant="outline" className="w-full" onClick={onOpenSettings}>
          <Settings className="h-4 w-4 mr-2" /> Configure AI Keys
        </Button>
      </div>
    </div>
  );
};

export default XtraAiPanel;