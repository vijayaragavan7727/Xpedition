"use client";

import React from "react";
import Image from "next/image";

export type SquidAssetName =
  | "piggybank"
  | "younghee"
  | "guard_circle"
  | "guard_triangle"
  | "guard_square"
  | "glass_bridge"
  | "dalgona"
  | "invitation"
  | "frontman"
  | "tug_of_war"
  | "vip_mask"
  | "player_avatar";

interface SquidAssetProps {
  name: SquidAssetName;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

const ASSET_PATHS: Record<SquidAssetName, string> = {
  piggybank: "/images/squid-game/squid_hero_piggybank.svg",
  younghee: "/images/squid-game/squid_doll_younghee.svg",
  guard_circle: "/images/squid-game/squid_guard_circle.svg",
  guard_triangle: "/images/squid-game/squid_guard_triangle.svg",
  guard_square: "/images/squid-game/squid_guard_square.svg",
  glass_bridge: "/images/squid-game/squid_glass_bridge.svg",
  dalgona: "/images/squid-game/squid_dalgona_candy.svg",
  invitation: "/images/squid-game/squid_card_invitation.svg",
  frontman: "/images/squid-game/squid_frontman_mask.svg",
  tug_of_war: "/images/squid-game/squid_tug_of_war.svg",
  vip_mask: "/images/squid-game/squid_vip_mask.svg",
  player_avatar: "/images/squid-game/squid_player_avatar.svg",
};

export default function SquidAsset({
  name,
  alt,
  className = "",
  width = 64,
  height = 64,
  priority = false,
}: SquidAssetProps) {
  const src = ASSET_PATHS[name];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 max-w-full ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 hover:scale-105"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}
