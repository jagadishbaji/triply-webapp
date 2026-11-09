import React from "react";
import Link from "next/link";

interface RidevoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  theme?: "dark" | "light"; // dark = for dark backgrounds (navbar/hero), light = for white backgrounds
  showTagline?: boolean;
  href?: string;
}

export function RidevoLogo({
  className = "",
  size = "md",
  theme = "dark",
  showTagline = true,
  href = "/",
}: RidevoLogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const taglineSizes = {
    sm: "text-[9px] tracking-[0.2em]",
    md: "text-[10px] tracking-[0.22em]",
    lg: "text-xs tracking-[0.25em]",
  };

  const logoContent = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Dynamic Emblem */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b1329" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>
            <linearGradient id="logoEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f279" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="logoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d1fae5" />
            </linearGradient>
            <linearGradient id="logoRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00f279" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Squircle Rim & Base */}
          <rect x="20" y="20" width="472" height="472" rx="112" fill="url(#logoBg)" />
          <rect x="20" y="20" width="472" height="472" rx="112" fill="none" stroke="url(#logoRim)" strokeWidth="14" />

          {/* High-Speed R Monogram */}
          {/* Vertical Highway Pillar */}
          <rect x="130" y="116" width="68" height="280" rx="34" fill="url(#logoEmerald)" />

          {/* Loop of R */}
          <path
            d="M 170 116 L 286 116 C 360 116 404 154 404 218 C 404 280 358 316 286 316 L 170 316 Z"
            fill="none"
            stroke="url(#logoEmerald)"
            strokeWidth="64"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Forward-Thrust Accelerator Arrow Leg */}
          <path
            d="M 264 286 L 368 396"
            fill="none"
            stroke="url(#logoEmerald)"
            strokeWidth="64"
            strokeLinecap="round"
          />

          {/* Inner Highway Centerline Highlight */}
          <rect x="148" y="140" width="18" height="232" rx="9" fill="url(#logoAccent)" opacity="0.9" />

          {/* GPS Speed Node Accent */}
          <circle cx="390" cy="116" r="28" fill="#00f279" />
          <circle cx="390" cy="116" r="14" fill="#ffffff" />
        </svg>
      </div>

      {/* Corporate Wordmark */}
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black ${textSizes[size]} tracking-tight flex items-baseline`}>
          <span className={theme === "dark" ? "text-white" : "text-slate-900"}>RIDE</span>
          <span className="text-emerald-400 font-extrabold ml-0.5">VO</span>
        </div>
        {showTagline && (
          <div
            className={`font-bold ${taglineSizes[size]} uppercase mt-0.5 ${
              theme === "dark" ? "text-emerald-400/80" : "text-emerald-700/80"
            }`}
          >
            Hubli Cabs
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default RidevoLogo;
