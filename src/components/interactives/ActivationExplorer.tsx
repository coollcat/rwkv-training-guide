import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { samplePolyline, mapX, mapY, fmt } from './plot-utils';

type Fn = { name: string; f: (x: number) => number; df: (x: number) => number; tex: string; note: string };

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const FUNCS: Fn[] = [
  {
    name: 'Sigmoid',
    f: sigmoid,
    df: (x) => sigmoid(x) * (1 - sigmoid(x)),
    tex: '\\sigma(x) = \\frac{1}{1 + e^{-x}}',
    note: '输出压到 (0,1)。两端导数趋近 0 → 深层网络梯度消失的元凶之一，现代隐藏层已少用。',
  },
  {
    name: 'Tanh',
    f: Math.tanh,
    df: (x) => 1 - Math.tanh(x) ** 2,
    tex: '\\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}',
    note: '输出 (-1,1)，零中心比 sigmoid 好，但两端同样饱和。RNN 内部仍在用。',
  },
  {
    name: 'ReLU',
    f: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : 0),
    tex: '\\mathrm{ReLU}(x) = \\max(0, x)',
    texNote: undefined,
    note: '正区间导数恒为 1，梯度通畅；负区间彻底死亡（dying ReLU）。',
  } as Fn,
  {
    name: 'SiLU / Swish',
    f: (x) => x * sigmoid(x),
    df: (x) => sigmoid(x) + x * sigmoid(x) * (1 - sigmoid(x)),
    tex: '\\mathrm{SiLU}(x) = x \\cdot \\sigma(x)',
    note: 'ReLU 的平滑版，处处可微。RWKV、LLaMA 等现代架构的主力激活函数。',
  },
];

/** 激活函数观察器：函数曲线 + 导数曲线 + 单点切线 */
export default function ActivationExplorer() {
  const [idx, setIdx] = useState(0);
  const [x, setX] = useState(1.2);
  const fn = FUNCS[idx];

  const W = 560;
  const H = 300;
  const x0 = -6;
  const x1 = 6;
  const y0 = -2.2;
  const y1 = 4;

  const pts = useMemo(() => samplePolyline(fn.f, x0, x1, y0, y1, W, H), [fn]);
  const dpts = useMemo(() => samplePolyline(fn.df, x0, x1, y0, y1, W, H), [fn]);

  const y = fn.f(x);
  const dy = fn.df(x);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FUNCS.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setIdx(i)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              i === idx
                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                : 'border-border bg-card/60 text-muted-foreground hover:border-emerald-400/40'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-black/30">
        <line x1={0} y1={mapY(0, y0, y1, H)} x2={W} y2={mapY(0, y0, y1, H)} stroke="hsl(228 13% 30%)" />
        <line x1={mapX(0, x0, x1, W)} y1={0} x2={mapX(0, x0, x1, W)} y2={H} stroke="hsl(228 13% 30%)" />
        <polyline points={pts} fill="none" stroke="#34d399" strokeWidth="2.5" />
        <polyline points={dpts} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" />
        {/* 当前点 */}
        <circle cx={mapX(x, x0, x1, W)} cy={mapY(y, y0, y1, H)} r="5" fill="#fbbf24" />
        <line x1={mapX(x, x0, x1, W)} y1={0} x2={mapX(x, x0, x1, W)} y2={H} stroke="#fbbf24" strokeDasharray="3 4" opacity="0.5" />
        <text x={W - 150} y={24} fill="#34d399" fontSize="12">━ f(x)</text>
        <text x={W - 150} y={42} fill="#a78bfa" fontSize="12">┄ f′(x) 导数</text>
      </svg>

      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>探针位置 x</span>
          <span className="font-mono text-amber-300">{x.toFixed(2)}</span>
        </div>
        <Slider min={x0} max={x1} step={0.05} value={[x]} onValueChange={([v]) => setX(v)} />
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card/70 p-4 font-mono text-xs leading-6 text-slate-300 sm:grid-cols-2">
        <div>f({x.toFixed(2)}) = <span className="text-emerald-300">{fmt(y, 4)}</span></div>
        <div>f′({x.toFixed(2)}) = <span className={Math.abs(dy) < 0.05 ? 'text-red-300' : 'text-violet-300'}>{fmt(dy, 4)}</span>
          {Math.abs(dy) < 0.05 && <span className="ml-2 text-red-300">← 梯度几乎死了</span>}
        </div>
        <div className="sm:col-span-2 text-[11px] leading-5 text-muted-foreground">{fn.note}</div>
      </div>
    </div>
  );
}
