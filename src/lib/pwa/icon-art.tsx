/** Gedeelde tekening voor app-iconen (ImageResponse / Satori). */
export function IconArt({ size, padding = 0.22 }: { size: number; padding?: number }) {
  const inner = size * (1 - padding * 2);
  const r = inner * 0.3;
  const stroke = Math.max(4, inner * 0.075);
  const cy = inner * 0.58;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #c8527a 0%, #ae3b63 55%, #8f2e50 100%)",
      }}
    >
      <svg width={inner} height={inner} viewBox={`0 0 ${inner} ${inner}`}>
        <circle cx={inner / 2 - r * 0.55} cy={cy} r={r} fill="none" stroke="#ecdcb6" strokeWidth={stroke} />
        <circle cx={inner / 2 + r * 0.55} cy={cy} r={r} fill="none" stroke="#ffffff" strokeWidth={stroke} />
        <path
          d={`M ${inner / 2 + r * 0.55} ${cy - r - stroke * 2.6} l ${stroke * 1.1} ${stroke * 1.3} l ${-stroke * 1.1} ${stroke * 1.3} l ${-stroke * 1.1} ${-stroke * 1.3} z`}
          fill="#ecdcb6"
        />
      </svg>
    </div>
  );
}
