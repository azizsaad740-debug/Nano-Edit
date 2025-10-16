"use client";

import * as React from "react";

interface SelectiveBlurFilterProps {
  maskDataUrl: string;
  blurAmount: number; // 0-100
  imageNaturalDimensions: { width: number; height: number };
}

export const SelectiveBlurFilter = ({
  maskDataUrl,
  blurAmount,
  imageNaturalDimensions,
}: SelectiveBlurFilterProps) => {
  if (!maskDataUrl || blurAmount === 0) return null;

  // Scale blur amount: 100% blur amount = 10px blur radius
  const stdDeviation = blurAmount / 100 * 10; 
  const filterId = "selective-blur-filter";

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id={filterId} filterUnits="userSpaceOnUse">
        {/* 1. Load the blur mask (grayscale image) */}
        <feImage 
          href={maskDataUrl} 
          result="blurMask" 
          x="0" 
          y="0" 
          width={imageNaturalDimensions.width} 
          height={imageNaturalDimensions.height} 
        />
        
        {/* 2. Convert mask luminance to alpha channel (white=opaque, black=transparent) */}
        <feColorMatrix 
          in="blurMask" 
          type="luminanceToAlpha" 
          result="alphaMask" 
        />
        
        {/* 3. Blur the source graphic (the image) */}
        <feGaussianBlur 
          in="SourceGraphic" 
          stdDeviation={stdDeviation} 
          result="blurredImage" 
        />
        
        {/* 4. Use the alpha mask to clip the blurred image (Blurred * Mask) */}
        <feComposite 
          in="blurredImage" 
          in2="alphaMask" 
          operator="in" 
          result="blurredArea" 
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
        
        {/* 7. Combine the two results (Blurred * Mask) + (Original * (1 - Mask)) */}
        <feMerge>
          <feMergeNode in="blurredArea" />
          <feMergeNode in="originalArea" />
        </feMerge>
      </filter>
    </svg>
  );
};