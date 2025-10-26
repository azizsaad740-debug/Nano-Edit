import { showSuccess, showError } from "@/utils/toast";
import type { HistoryItem } from "@/types/editor";

export interface ProjectFile {
  version: string;
  sourceImage: string | null;
  history: HistoryItem[];
  currentHistoryIndex: number;
  fileInfo: { name: string; size: number } | null;
}

const PROJECT_FILE_VERSION = "1.0.0";

export const saveProjectToFile = (projectState: Omit<ProjectFile, 'version'>) => {
  try {
    const projectData: ProjectFile = {
      ...projectState,
      version: PROJECT_FILE_VERSION,
    };
    const jsonString = JSON.stringify(projectData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = projectState.fileInfo?.name.split('.')[0] || 'untitled';
    link.download = `${fileName}.nanoedit`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess("Project saved successfully.");
  } catch (error) {
    console.error("Failed to save project:", error);
    showError("Could not save the project.");
  }
};

export const loadProjectFromFile = (file: File): Promise<ProjectFile> => {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith(".nanoedit")) {
      reject(new Error("Invalid file type. Please select a .nanoedit file."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          throw new Error("Failed to read file content.");
        }
        const projectData: ProjectFile = JSON.parse(result);
        
        if (!projectData.version || !projectData.history || projectData.currentHistoryIndex === undefined) {
          throw new Error("Invalid or corrupted project file.");
        }

        if (projectData.version !== PROJECT_FILE_VERSION) {
          console.warn(`Loading project from a different version. Expected ${PROJECT_FILE_VERSION}, got ${projectData.version}.`);
        }

        resolve(projectData);
      } catch (error) {
        reject(new Error("Invalid or corrupted project file."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read the project file."));
    };
    reader.readAsText(file);
  });
};