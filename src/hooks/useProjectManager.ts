"use client";

import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import type { EditState, Layer, HistoryItem, GradientToolState, BrushState } from "./useEditorState";
import { initialEditState, initialLayerState, initialHistoryItem, initialBrushState, initialGradientToolState } from "./useEditorState"; // Import initial states

export interface Project {
  id: string;
  name: string;
  image: string | null;
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  exifData: any | null;
  history: HistoryItem[];
  currentHistoryIndex: number;
  layers: Layer[];
  selectedLayerId: string | null;
  // Other transient states that should be per-project
  aspect: number | undefined;
  pendingCrop: any; // Crop type
  selectionPath: any; // Point[] | null
  selectionMaskDataUrl: string | null;
  foregroundColor: string;
  backgroundColor: string;
  gradientToolState: GradientToolState;
  brushStateInternal: Omit<BrushState, 'color'>;
  selectedShapeType: Layer['shapeType'] | null;
}

const createNewProject = (name: string = "Untitled"): Project => ({
  id: uuidv4(),
  name,
  image: null,
  dimensions: null,
  fileInfo: null,
  exifData: null,
  history: [initialHistoryItem],
  currentHistoryIndex: 0,
  layers: initialLayerState,
  selectedLayerId: null,
  aspect: undefined,
  pendingCrop: undefined,
  selectionPath: null,
  selectionMaskDataUrl: null,
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
  gradientToolState: initialGradientToolState,
  brushStateInternal: initialBrushState,
  selectedShapeType: 'rect',
});

export const useProjectManager = () => {
  const [projects, setProjects] = React.useState<Project[]>([createNewProject()]);
  const [activeProjectId, setActiveProjectId] = React.useState(projects[0].id);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const updateActiveProject = React.useCallback((updates: Partial<Project>) => {
    setProjects(prevProjects => prevProjects.map(p => 
      p.id === activeProjectId ? { ...p, ...updates } : p
    ));
  }, [activeProjectId]);

  const addProject = React.useCallback((project: Project) => {
    setProjects(prevProjects => [...prevProjects, project]);
    setActiveProjectId(project.id);
  }, []);

  const closeProject = React.useCallback((id: string) => {
    if (projects.length === 1) {
      // If only one project remains, reset it instead of closing
      setProjects([createNewProject()]);
      setActiveProjectId(projects[0].id);
      return;
    }

    const indexToClose = projects.findIndex(p => p.id === id);
    const newProjects = projects.filter(p => p.id !== id);
    
    if (id === activeProjectId) {
      // Switch to the next available project
      const newActiveIndex = Math.min(indexToClose, newProjects.length - 1);
      setActiveProjectId(newProjects[newActiveIndex].id);
    }
    
    setProjects(newProjects);
  }, [projects, activeProjectId]);

  const createNewTab = React.useCallback((name?: string) => {
    const newProject = createNewProject(name);
    addProject(newProject);
    return newProject;
  }, [addProject]);

  return {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    updateActiveProject,
    addProject,
    closeProject,
    createNewTab,
  };
};