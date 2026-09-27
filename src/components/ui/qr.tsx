"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** QR-code (SVG) met optionele downloadknop als PNG, bijv. voor op de trouwkaart. */
export function QrCode({ value, size = 160, filename, className }: { value: string; size?: number; filename?: string; className?: string }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    import("qrcode").then((QR) =>
      QR.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#2b1d22", light: "#ffffff" } }).then(
        (s) => !cancelled && setSvg(s),
      ),
    );
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function download() {
    const QR = await import("qrcode");
    const url = await QR.toDataURL(value, { width: 1024, margin: 2, errorCorrectionLevel: "M", color: { dark: "#2b1d22", light: "#ffffff" } });
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? "qr-code.png";
    a.click();
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div
        className="rounded-2xl bg-white p-2 ring-1 ring-line"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`QR-code voor ${value}`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {filename && (
        <button type="button" onClick={download} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-rose-700 hover:bg-rose-50">
          <Download className="size-4" aria-hidden /> Download PNG
        </button>
      )}
    </div>
  );
}
