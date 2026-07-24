interface SoosanLogoProps {
  className?: string;
  height?: number;
  variant?: "default" | "sidebar";
}

export function SoosanLogo({
  className = "h-6 w-auto object-contain",
  height,
  variant = "default",
}: SoosanLogoProps) {
  if (variant === "sidebar") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/soosan-logo.png"
        alt="SOOSAN"
        className={`mx-auto block w-auto max-w-full ${className}`}
        style={{ height: height ?? 26, width: "auto" }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/soosan-logo.png"
      alt="SOOSAN"
      className={`block ${className}`}
      style={height ? { height, width: "auto" } : undefined}
    />
  );
}
