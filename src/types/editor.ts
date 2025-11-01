// src/types/editor.ts (Index file)

import type { Dispatch, SetStateAction } from "react";

// Re-export all modular types and constants
export * from './editor/core';
export * from './editor/tools';
export * from './editor/adjustments';
export * from './editor/layers';
export * from './editor/state';
export * from './editor/initialState';

// Re-export utility types
export type { Dispatch, SetStateAction };