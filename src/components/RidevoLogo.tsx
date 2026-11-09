import React from "react";
import Link from "next/link";

interface RidevoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  theme?: "dark" | "light"; // dark = for dark backgrounds, light = for light backgrounds
  showTagline?: boolean;
  href?: string;
}

export function RidevoLogo({
  className = "",
  size = "md",
  theme = "dark",
  showTagline = false,
  href = "/",
}: RidevoLogoProps) {
  const textSizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  const logoContent = (
    <div className={`inline-flex items-center select-none group ${className}`}>
      <div className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
        <span className={theme === "dark" ? "text-white" : "text-slate-900"}>RIDE</span>
        <span className="text-emerald-400 ml-0.5">VO</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none flex items-center">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default RidevoLogo;
