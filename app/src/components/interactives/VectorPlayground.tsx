import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { fmt } from './plot-utils';

/** 二维向量游乐场：加法、点积、夹角、余弦相似度 */
export default function VectorPlayground() {
  const [a, setA] = useState<[number, number]>([3, 2]);
  const [b, setB] = useState<[number, number]>([1, -2]);

  const W = 420;
  const H = 300;
  const scale = 34;
  const cx = W / 2;
  const cy = H / 2;
  const px = (x: number) => cx + x * scale;
  const py = (y: number) => cy - y * scale;

  const stats = useMemo(() => {
    const dot = a[0] * b[0] + a[1] * b[1];
    const na = Math.hypot(a[0], a[1]);
    const nb = Math.hypot(b[0], b[1]);
    const cos = na * nb === 0 ? 0 : dot / (na * nb);
    const angle = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    return { dot, na, nb, cos, angle };
  }, [a, b]);

  const Arrow = ({ v, color, label }: { v: [number, number]; color: string; label: string }) => (
    <g>
      <defs>
        <marker id={`arr-${label}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>
      <line x1={cx} y1={cy} x2={px(v[0])} y2={py(v[1])} stroke={color} strokeWidth="2.5" markerEnd={`url(#arr-${label})`} />
      <text x={px(v[0]) + 8} y={py(v[1]) - 6} fill={color} fontSize="13" fontWeight="700">
        {label}({v[0]}, {v[1]})
      </text>
    </g>
  );

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-black/30">
        {Array.from({ length: 13 }, (_, i) => i - 6).map((g) => (
          <g key={g} stroke="hsl(228 13% 22%)" strokeWidth="1">
            <line x1={px(g)} y1={0} x2={px(g)} y2={H} />
            <line x1={0} y1={py(g)} x2={W} y2={py(g)} />
          </g>
        ))}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="hsl(228 13% 35%)" strokeWidth="1.5" />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="hsl(228 13% 35%)" strokeWidth="1.5" />
        {/* 平行四边形法则 */}
        <line x1={px(a[0])} y1={py(a[1])} x2={px(a[0] + b[0])} y2={py(a[1] + b[1])} stroke="hsl(217 12% 45%)" strokeDasharray="4 4" />
        <line x1={px(b[0])} y1={py(b[1])} x2={px(a[0] + b[0])} y2={py(a[1] + b[1])} stroke="hsl(217 12% 45%)" strokeDasharray="4 4" />
        <Arrow v={a} color="#34d399" label="a" />
        <Arrow v={b} color="#60a5fa" label="b" />
        <Arrow v={[a[0] + b[0], a[1] + b[1]]} color="#fbbf24" label="a+b" />
      </svg>

      <div className="space-y-4">
        {([
          ['aₓ', a[0], (v: number) => setA([v, a[1]])],
          ['a_y', a[1], (v: number) => setA([a[0], v])],
          ['bₓ', b[0], (v: number) => setB([v, b[1]])],
          ['b_y', b[1], (v: number) => setB([b[0], v])],
        ] as const).map(([label, val, set]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{label}</span>
              <span className="font-mono">{val}</span>
            </div>
            <Slider min={-5} max={5} step={1} value={[val]} onValueChange={([v]) => set(v)} />
          </div>
        ))}
        <div className="rounded-lg border border-border bg-card/70 p-3 font-mono text-xs leading-6 text-slate-300">
          <div>a·b = {a[0]}×{b[0]} + {a[1]}×{b[1]} = <span className="text-amber-300">{fmt(stats.dot, 1)}</span></div>
          <div>|a| = {fmt(stats.na, 2)}，|b| = {fmt(stats.nb, 2)}</div>
          <div>夹角 θ = <span className="text-amber-300">{fmt(stats.angle, 1)}°</span></div>
          <div>cos(θ) = <span className={stats.cos > 0 ? 'text-emerald-300' : 'text-red-300'}>{fmt(stats.cos, 3)}</span></div>
          <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
            cos → 1 方向一致；cos → 0 正交；cos → -1 方向相反。注意力机制里的「相似度」就是它。
          </div>
        </div>
      </div>
    </div>
  );
}
