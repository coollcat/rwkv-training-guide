import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';
import { fmt } from './plot-utils';

/**
 * 梯度下降沙盒：在 f(x,y) = x² + 4y² 的等高线上跑梯度下降。
 * 直观感受：学习率太小走得慢、合适收敛快、太大来回震荡甚至发散。
 */
export default function GradientDescent() {
  const [lr, setLr] = useState(0.1);
  const [steps, setSteps] = useState(0);
  const [start, setStart] = useState<[number, number]>([2.4, 1.6]);
  const MAX = 40;

  const path = useMemo(() => {
    let [x, y] = start;
    const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < Math.min(steps, MAX); i++) {
      // ∇f = (2x, 8y)
      x = x - lr * 2 * x;
      y = y - lr * 8 * y;
      pts.push([x, y]);
      if (Math.abs(x) > 20 || Math.abs(y) > 20) break; // 发散了就不画太远
    }
    return pts;
  }, [lr, steps, start]);

  const last = path[path.length - 1];
  const f = last[0] ** 2 + 4 * last[1] ** 2;
  const diverged = Math.abs(last[0]) > 10 || Math.abs(last[1]) > 10;

  const W = 460;
  const H = 320;
  const scale = 62;
  const cx = W / 2;
  const cy = H / 2;
  const px = (x: number) => cx + x * scale;
  const py = (y: number) => cy - y * scale;

  // 等高线：x² + 4y² = c 是椭圆，画几个 c
  const contours = [0.25, 1, 2.5, 5, 9, 14];

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-black/30">
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="hsl(228 13% 30%)" />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="hsl(228 13% 30%)" />
        {contours.map((c) => (
          <ellipse
            key={c}
            cx={cx}
            cy={cy}
            rx={Math.sqrt(c) * scale}
            ry={(Math.sqrt(c) / 2) * scale}
            fill="none"
            stroke="hsl(217 30% 35%)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}
        {/* 路径 */}
        <polyline
          points={path.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}
          fill="none"
          stroke={diverged ? '#f87171' : '#34d399'}
          strokeWidth="2"
        />
        {path.map(([x, y], i) => (
          <circle key={i} cx={px(x)} cy={py(y)} r={i === 0 || i === path.length - 1 ? 5 : 3}
            fill={i === 0 ? '#fbbf24' : i === path.length - 1 ? (diverged ? '#f87171' : '#34d399') : '#94a3b8'} />
        ))}
        <text x={cx + 6} y={cy - 6} fill="#94a3b8" fontSize="11">最优点 (0,0)</text>
      </svg>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>学习率 η</span>
            <span className="font-mono text-amber-300">{lr.toFixed(3)}</span>
          </div>
          <Slider min={0.005} max={0.5} step={0.005} value={[lr]} onValueChange={([v]) => { setLr(v); setSteps(0); }} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSteps((s) => Math.min(s + 5, MAX))}>
            <Play className="mr-1 h-3.5 w-3.5" /> 走 5 步
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSteps(MAX)}>跑到底</Button>
          <Button size="sm" variant="outline" onClick={() => { setSteps(0); setStart([2.4 * (Math.random() > 0.5 ? 1 : -1), 1.6]); }}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-3 font-mono text-xs leading-6 text-slate-300">
          <div>步数：{path.length - 1}</div>
          <div>当前位置：({fmt(last[0], 3)}, {fmt(last[1], 3)})</div>
          <div>f(x,y) = <span className="text-amber-300">{fmt(f, 4)}</span></div>
          <div className={`mt-1 text-[11px] leading-5 ${diverged ? 'text-red-300' : 'text-muted-foreground'}`}>
            {diverged
              ? '发散了！η ≥ 0.25 时 1−8η ≤ −1，y 方向每步都在放大——这就是训练时 loss 突然 NaN 的原因。'
              : lr < 0.03
                ? '学习率太小：在收敛，但慢得令人着急。'
                : lr < 0.24
                  ? '学习率合适：快速稳定地逼近最优点。'
                  : '接近临界：开始来回震荡，再大一点就会发散！'}
          </div>
        </div>
      </div>
    </div>
  );
}
