import React from "react";
import Image from "next/image";

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
  // The processed logo has a 1.5:1 aspect ratio (1536 x 1024)
  const width = Math.round(height * 1.5);

  return (
    <div className={`inline-flex items-center ${className}`.trim()}>
      <Image
        src="/logo.png"
        alt="MR.FIT Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
