"use client";

import React from "react";
import XpAsset, { XpAssetName } from "./XpAsset";

export type SquidAssetName = XpAssetName;
export { XpAsset };

interface SquidAssetProps {
  name: SquidAssetName | string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function SquidAsset({
  name,
  alt = "XPedition Icon",
  className = "",
  width = 24,
  height = 24,
}: SquidAssetProps) {
  return <XpAsset name={name} alt={alt} className={className} width={width} height={height} />;
}
