import { QR } from "@/lib/marketing/qr.generated";

/** Scans to /pobierz, which opens the store of the phone that scanned it. */
export function QrCode({
  code = "site",
  label,
  className,
}: {
  code?: keyof typeof QR;
  label: string;
  className?: string;
}) {
  const { size, path } = QR[code];
  return (
    <svg
      className={className}
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      width={size * 4}
      height={size * 4}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#1f2b45" />
    </svg>
  );
}
