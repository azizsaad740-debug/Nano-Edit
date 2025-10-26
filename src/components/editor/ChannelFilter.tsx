"use client";

import * as React from "react";
import type { EditState } from "@/types/editor";

interface ChannelFilterProps {
  channels: EditState['channels'];
}

export const ChannelFilter = ({ channels }: ChannelFilterProps) => {
  const { r, g, b } = channels;

  // Only render the filter if not all channels are active
  if (r && g && b) {
    return null;
  }

  const rVal = r ? 1 : 0;
  const gVal = g ? 1 : 0;
  const bVal = b ? 1 : 0;

  const matrix = [
    rVal, 0, 0, 0, 0,
    0, gVal, 0, 0, 0,
    0, 0, bVal, 0, 0,
    0, 0, 0, 1, 0,
  ].join(' ');

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="channel-filter">
        <feColorMatrix type="matrix" values={matrix} />
      </filter>
    </svg>
  );
};