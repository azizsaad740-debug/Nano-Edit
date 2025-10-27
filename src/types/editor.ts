export type LayerType = "image" | "text" | "drawing" | "smart-object" | "vector-shape" | "group" | "gradient" | "adjustment";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  isLocked: boolean;
  type: LayerType;
  opacity: number;
  blendMode: string;
}