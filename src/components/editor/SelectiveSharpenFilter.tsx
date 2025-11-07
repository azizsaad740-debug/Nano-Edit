"use client";

import * as React from "react";

interface SelectiveSharpenFilterProps {
  maskDataUrl: string;
  sharpenAmount: number; // 0-100
  imageNaturalDimensions: { width: number; height: number };
}

export const SelectiveSharpenFilter = ({
  maskDataUrl,
  sharpenAmount,
  imageNaturalDimensions,
}: SelectiveSharpenFilterProps) => {
  if (!maskDataUrl || sharpenAmount === 0) return null;

  // Sharpening is typically implemented using unsharp mask (blur + composite)
  // Scale sharpen amount: 100% sharpen amount = 1.5 strength
  const sharpenStrength = sharpenAmount / 100 * 1.5; 
  const sharpenRadius = 0.75; // Small radius for fine sharpening
  const filterId = "selective-sharpen-filter";

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id={filterId} filterUnits="userSpaceOnUse">
        {/* 1. Load the sharpen mask (grayscale image) */}
        <feImage 
          href={maskDataUrl} 
          result="sharpenMask" 
          x="0" 
          y="0" 
          width={imageNaturalDimensions.width} 
          height={imageNaturalDimensions.height} 
        />
        
        {/* 2. Convert mask luminance to alpha channel */}
        <feColorMatrix 
          in="sharpenMask" 
          type="luminanceToAlpha" 
          result="alphaMask" 
        />
        
        {/* 3. Sharpen the source graphic (Unsharp Mask technique) */}
        <feGaussianBlur in="SourceGraphic" stdDeviation={sharpenRadius} result="sharpenBlur" />
        <feComposite in="SourceGraphic" in2="sharpenBlur" operator="arithmetic" k1="0" k2={1 + sharpenStrength} k3={-sharpenStrength} k4="0" result="sharpenedImage" />
        
        {/* 4. Use the alpha mask to clip the sharpened image (Sharpened * Mask) */}
        <feComposite 
          in="sharpenedImage" 
          in2="alphaMask" 
          operator="in" 
          result="sharpenedArea" 
        />
        
        {/* 5. Invert the alpha mask (1 - Mask) */}
        <feComponentTransfer in="alphaMask" result="invertedAlphaMask">
          <feFuncA type="table" tableValues="1 0" />
        </feComponentTransfer>
        
        {/* 6. Use the inverted mask to clip the original image (Original * (1 - Mask)) */}
        <feComposite 
          in="SourceGraphic" 
          in2="invertedAlphaMask" 
          operator="in" 
          result="originalArea" 
        />
        
        {/* 7. Combine the two results */}
        <feMerge>
          <feMergeNode in="sharpenedArea" />
          <feMergeNode in="originalArea" />
        </feMerge>
      </filter>
    </svg>
  );
};