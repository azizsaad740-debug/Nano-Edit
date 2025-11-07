import * as React from 'react';

// Minimal stub for EditorContext
export const EditorContext = React.createContext<any>(null);

export const useEditorContext = () => {
  const context = React.useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorContext.Provider');
  }
  return context;
};