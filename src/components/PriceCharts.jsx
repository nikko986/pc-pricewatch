export function Sparkline({ product }) {
  const points = [...product.history].reverse().slice(-24);
  const width = 116;
  const height = 34;
  const padding = 2;
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const spread = max - min || 1;
  const x = (index) =>
    padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
  const y = (value) =>
    height - padding - ((value - min) / spread) * (height - padding * 2);
  const color = product.change !== null && product.change < 0 ? "#137a55" : "#bb3e4a";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline"
      role="img"
      aria-label={`${product.name} recent price trend`}
    >
      <line x1="0" x2={width} y1={height - 1} y2={height - 1} stroke="#e2e8ed" />
      <polyline
        points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PriceChart({ product }) {
  const points = [...product.history].reverse();
  const width = 680;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 62 };
  const minValue = Math.min(...points.map((point) => point.value));
  const maxValue = Math.max(...points.map((point) => point.value));
  const extra = Math.max((maxValue - minValue) * 0.12, maxValue * 0.02);
  const min = Math.max(0, minValue - extra);
  const max = maxValue + extra;
  const spread = max - min || 1;
  const x = (index) =>
    pad.left + (index / Math.max(1, points.length - 1)) * (width - pad.left - pad.right);
  const y = (value) =>
    pad.top + (1 - (value - min) / spread) * (height - pad.top - pad.bottom);
  const latest = points.at(-1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {[0, 1, 2].map((index) => {
        const value = max - (spread * index) / 2;
        const lineY = y(value);

        return (
          <g key={index}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={lineY}
              y2={lineY}
              stroke="#dfe5ec"
              strokeDasharray="4 5"
            />
            <text
              x={pad.left - 8}
              y={lineY + 4}
              textAnchor="end"
              fill="#7c8797"
              fontSize="10"
            >
              ₱{Math.round(value / 1000)}k
            </text>
          </g>
        );
      })}
      <polyline
        points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}
        fill="none"
        stroke="#087e74"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={x(points.length - 1)}
        cy={y(latest.value)}
        r="5"
        fill="#42d6c8"
        stroke="#087e74"
        strokeWidth="2"
      />
      <text x={pad.left} y={height - 6} fill="#7c8797" fontSize="10">
        {points[0].display}
      </text>
      <text
        x={width - pad.right}
        y={height - 6}
        textAnchor="end"
        fill="#7c8797"
        fontSize="10"
      >
        {latest.display}
      </text>
    </svg>
  );
}
