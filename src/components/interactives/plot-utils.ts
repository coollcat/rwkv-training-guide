/** 交互组件共用的绘图/数值小工具 */

/** 在 [x0,x1] 上采样函数，返回 SVG polyline points（映射到给定像素框） */
export function samplePolyline(
  f: (x: number) => number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  width: number,
  height: number,
  n = 200,
  pad = 8,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = f(x);
    const px = pad + ((x - x0) / (x1 - x0)) * (width - 2 * pad);
    const py = height - pad - ((y - y0) / (y1 - y0)) * (height - 2 * pad);
    if (Number.isFinite(py)) pts.push(`${px.toFixed(1)},${Math.max(-50, Math.min(height + 50, py)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function mapX(x: number, x0: number, x1: number, width: number, pad = 8) {
  return pad + ((x - x0) / (x1 - x0)) * (width - 2 * pad);
}
export function mapY(y: number, y0: number, y1: number, height: number, pad = 8) {
  return height - pad - ((y - y0) / (y1 - y0)) * (height - 2 * pad);
}

/** 固定种子的伪随机数（保证注意力热力图等每次渲染一致） */
export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** softmax */
export function softmax(xs: number[], temperature = 1): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp((x - m) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function fmt(x: number, digits = 3): string {
  if (Math.abs(x) >= 1000) return x.toExponential(2);
  return x.toFixed(digits);
}

/** 数值热力配色：0→透明，1→亮 */
export function heatColor(v: number, hue = 160): string {
  const clamped = Math.max(0, Math.min(1, v));
  return `hsl(${hue} 85% ${12 + clamped * 45}% / ${0.15 + clamped * 0.85})`;
}
