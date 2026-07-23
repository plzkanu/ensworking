interface SoosanLogoProps {
  className?: string;
  height?: number;
}

export function SoosanLogo({
  className = "h-6 w-auto object-contain",
  height,
}: SoosanLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/soosan-logo.png"
      alt="SOOSAN"
      className={className}
      style={height ? { height, width: "auto" } : undefined}
    />
  );
}
