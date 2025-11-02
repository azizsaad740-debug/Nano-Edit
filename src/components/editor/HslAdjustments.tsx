import React from 'react'; // Fix 138
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { HslAdjustment, HslAdjustmentsState, HslColorKey } from '@/types/editor';
import { isDefaultHsl } from '@/utils/filterUtils';
import { HslColorSelector } from './HslColorSelector';

interface HslAdjustmentsProps {
  hslAdjustments: HslAdjustmentsState;
  onAdjustmentChange: (colorKey: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onAdjustmentCommit: (colorKey: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
}

export const HslAdjustments: React.FC<HslAdjustmentsProps> = ({ hslAdjustments, onAdjustmentChange, onAdjustmentCommit, customColor, setCustomColor }) => {
  const [selectedColor, setSelectedColor] = React.useState<HslColorKey>('master'); // Fix 45, 139
  const currentAdjustment = hslAdjustments[selectedColor];
// ... (rest of file)