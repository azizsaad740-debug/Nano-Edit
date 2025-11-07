export enum LayerType {
  Image = 'Image',
  Text = 'Text',
  Shape = 'Shape',
  Adjustment = 'Adjustment',
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  isVisible: boolean;
  data: any;
}