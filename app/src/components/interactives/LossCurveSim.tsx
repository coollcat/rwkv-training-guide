import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { seededRandom, fmt } from './plot-utils';

const OPTIMS = ['SGD', 'Momentum', 'Adam'] as const;

/**
 * 训练损失曲线模拟器：观察优化器、学习率、batch size 对收敛的影响。
 * 曲线为教学模拟：Adam 收敛快而稳；SGD 慢；lr 过大会震荡/发散。
 */
export default function LossCurveSim() {
  const [opt, setOpt] = useState<(typeof OPTIMS)[number]>('Adam');
  const [lrExp, setLrExp] = useState(-3); // 10^lrExp
  const [batch, setBatch] = useState(32);

  const lr = Math.pow(10, lrExp);
  const STEPS = 300;

  const curve = useMemo(() => {
    const rnd = seededRandom(7);
    // 各优化器的「有效步长」与噪声特性
    const speed = { SGD: 0.5, Momentum: 0.9, Adam: 1.6 }[opt];
    const noiseAmp = { SGD: 1.0, Momentum: 0.8, Adam: 0.55 }[opt] * (8 / Math.sqrt(batch));
    const wobble = Math.max(0, lrExp + 2.5) * 0.7; // lr 越大震荡越强
    const diverge = lrExp > -1.2 && opt !== 'Adam' ? true : lrExp > -0.5;

    const pts: number[] = [];
    let loss = 4.5;
    let velocity = 0;
    for (let i = 0; i < STEPS; i++) {
      const grad = -(loss - 1.2) * 0.02 * speed * Math.min(1, lr * 1000);
      velocity = velocity * 0.8 + grad;
      loss += velocity + (rnd() - 0.5) * noiseAmp * (0.35 + wobble) * Math.max(0.4, loss / 4.5);
      if (diverge && i > 30) loss += (i - 30) * 0.012 * (lrExp + 1.2);
      pts.push(loss);
    }
    return { pts, diverged: pts[STEPS - 1] > 8 || !Number.isFinite(pts[STEPS - 1]) };
  }, [opt, lrExp, batch, lr]);

  const W = 620;
  const H = 260;
  const yMax = 6;
  const px = (i: number) => (i / (STEPS - 1)) * (W - 40) + 30;
  const py = (l: number) => H - 20 - (Math.min(l, yMax) / yMax) * (H - 40);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex gap-2">
          {OPTIMS.map((o) => (
            <button
              key={o}
              onClick={() => setOpt(o)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                opt === o
                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                  : 'border-border bg-card/60 text-muted-foreground hover:border-emerald-400/40'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="w-48">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>学习率</span><span className="font-mono text-amber-300">{lr.toExponential(0)}</span>
          </div>
          <Slider min={-5} max={-0.3} step={0.1} value={[lrExp]} onValueChange={([v]) => setLrExp(v)} />
        </div>
        <div className="w-40">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>batch size</span><span className="font-mono text-amber-300">{batch}</span>
          </div>
          <Slider min={4} max={256} step={4} value={[batch]} onValueChange={([v]) => setBatch(v)} />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-black/30">
        {[1, 2, 3, 4, 5].map((g) => (
          <g key={g}>
            <line x1={30} y1={py(g)} x2={W - 10} y2={py(g)} stroke="hsl(228 13% 20%)" />
            <text x={6} y={py(g) + 4} fill="#64748b" fontSize="10" fontFamily="monospace">{g}</text>
          </g>
        ))}
        <text x={W - 90} y={H - 6} fill="#64748b" fontSize="10">训练步数 →</text>
        <polyline
          points={curve.pts.map((l, i) => `${px(i)},${py(l)}`).join(' ')}
          fill="none"
          stroke={curve.diverged ? '#f87171' : '#34d399'}
          strokeWidth="2"
        />
      </svg>

      <div className="rounded-lg border border-border bg-card/70 p-3 font-mono text-xs leading-6 text-slate-300">
        <div>最终 loss：<span className={curve.diverged ? 'text-red-300' : 'text-emerald-300'}>{fmt(curve.pts[STEPS - 1], 3)}</span>
          {curve.diverged && <span className="ml-2 text-red-300">发散了！lr 超过临界值，参数更新把 loss 越推越大。</span>}
        </div>
        <div className="text-[11px] leading-5 text-muted-foreground">
          试试：SGD + lr=1e-2（勉强能训但剧烈抖动）→ Adam + lr=1e-3（又快又稳）。
          batch 调小，曲线噪声立刻变大——小 batch 的梯度估计不准，这就是「梯度噪声」。
          这也是实战里 loss 曲线要配合「平滑窗口」看的原因。
        </div>
      </div>
    </div>
  );
}
