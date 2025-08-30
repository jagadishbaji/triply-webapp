import React from "react";

type MiniCarIconProps = React.SVGProps<SVGSVGElement>;

const MiniCarIcon: React.FC<MiniCarIconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={64}
      height={64}
      viewBox="0 0 128 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Car Body */}
      <rect
        x="16"
        y="28"
        width="96"
        height="20"
        rx="6"
        fill="white"
        stroke="currentColor"
      />

      {/* Roof & Windows */}
      <path d="M32 28 L44 16 H84 L96 28" fill="white" stroke="currentColor" />
      <line x1="60" y1="16" x2="60" y2="28" />
      <line x1="72" y1="16" x2="72" y2="28" />

      {/* Wheels */}
      <circle cx="32" cy="52" r="8" fill="white" stroke="currentColor" />
      <circle cx="96" cy="52" r="8" fill="white" stroke="currentColor" />

      {/* Wheel hubs */}
      <circle cx="32" cy="52" r="3" fill="currentColor" />
      <circle cx="96" cy="52" r="3" fill="currentColor" />
    </svg>
  );
};

export default MiniCarIcon;
