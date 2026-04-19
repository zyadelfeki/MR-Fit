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
  const widths = { full: 160, icon: 40, text: 120 } as const;
  const fitClass = variant === "icon" ? "object-cover object-left" : "object-contain";

  return (
    <Image
      src="/logo.jpg"
      alt="MR.FIT — Your Ultimate Trainer"
      width={widths[variant]}
      height={height}
      className={`${fitClass} ${className}`.trim()}
      priority
    />
  );
}
