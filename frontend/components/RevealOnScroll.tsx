"use client";

import React from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delayClass?: string;
};

export default function RevealOnScroll({
  children,
  className = "",
  delayClass = "",
}: RevealProps) {
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
  });

  return (
    <div
      ref={ref as any}
      className={`reveal-init ${isIntersecting ? "reveal-active" : ""} ${delayClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
