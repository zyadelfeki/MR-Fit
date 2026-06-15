import React from "react";

type LogoProps = {
  variant?: "full" | "icon" | "text";
  height?: number;
  className?: string;
};

export default function Logo({
  variant = "full",
  height = 40,
  className = "",
}: LogoProps) {
  // SVG Icon dimensions proportional to height
  const iconSize = height;

  const renderIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Stylized M (Gold) */}
      <path
        d="M 15,10 H 30 V 90 H 15 Z"
        fill="#FFB800"
      />
      <path
        d="M 70,10 H 85 V 90 H 70 Z"
        fill="#FFB800"
      />
      <path
        d="M 30,10 L 50,55 L 70,10 H 56 L 50,30 L 44,10 Z"
        fill="#FFB800"
      />
      
      {/* Barbell / Dumbbell element running behind the V but in front of columns */}
      <rect x="5" y="46" width="90" height="8" rx="2" fill="#FFB800" stroke="#0D0D0D" strokeWidth="2" />
      
      {/* Left Plate Stack */}
      <rect x="2" y="25" width="8" height="50" rx="3" fill="#FFB800" stroke="#0D0D0D" strokeWidth="2" />
      <rect x="10" y="30" width="4" height="40" rx="2" fill="#FFB800" stroke="#0D0D0D" strokeWidth="1" />
      
      {/* Right Plate Stack */}
      <rect x="90" y="25" width="8" height="50" rx="3" fill="#FFB800" stroke="#0D0D0D" strokeWidth="2" />
      <rect x="86" y="30" width="4" height="40" rx="2" fill="#FFB800" stroke="#0D0D0D" strokeWidth="1" />
      
      {/* Barbell Collar Knurl */}
      <circle cx="50" cy="50" r="4" fill="#FFB800" />
    </svg>
  );

  const renderText = () => (
    <span 
      className="font-heading font-black tracking-widest text-[#FFB800] uppercase select-none"
      style={{ fontSize: `${height * 0.55}px`, lineHeight: 1 }}
    >
      MR<span className="text-white">.</span>FIT
    </span>
  );

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      {(variant === "full" || variant === "icon") && renderIcon()}
      {(variant === "full" || variant === "text") && renderText()}
    </div>
  );
}
