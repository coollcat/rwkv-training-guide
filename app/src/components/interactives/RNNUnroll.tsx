import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { fmt } from './plot-utils';

const X_SEQ = [1.5, -0.8, 0.6, 1.0, -1.2, 0.4];

/**
 * RNN 时间展开演示：h_t = tanh(wx·x_t + wh·h_{t−1} + b)
 * 左侧逐步展开前向传播；右侧展示梯度连乘如何消失/爆炸。
 */
export default function RNNUnroll() {
  const [wx, setWx] = useState(0.8);
  const [wh, setWh] = useState(0.6);
  const [t, setT] = useState(1);

  const hs = useMemo(() => {
    const arr = [0];
    for (let i = 0; i < X_SEQ.length; i++) {
      arr.push(Math.tanh(wx * X_SEQ[i] + wh * arr[i]));
    }
    return arr;
  }, [wx, wh]);

  // 从最后一步传回第 1 步的梯度（每步乘 wh·(1−h²)）
  const grads = useMemo(() => {
    const g = new Array(X_SEQ.length + 1).fill(0);
    g[X_SEQ.length] = 1;
    for (let i = X_SEQ.length; i >= 1; i--) {
      g[i - 1] = g[i] * wh * (1 - hs[i] ** 2);
    }
    return g;
  }, [wh, hs]);

  const W = 640;
  const H = 180;
  const boxW = 78;
  const gap = (W - 40 - X_SEQ.length * boxW) / (X_SEQ.length - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-40">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>w_x（输入权重）</span><span className="font-mono">{wx.toFixed(2)}</span></div>
          <Slider min={-2} max={2} step={0.05} value={[wx]} onValueChange={([v]) => setWx(v)} />
        </div>
        <div className="w-40">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>w_h（循环权重）</span><span className="font-mono">{wh.toFixed(2)}</span></div>
          <Slider min={-2} max={2} step={0.05} value={[wh]} onValueChange={([v]) => setWh(v)} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setT(1)}><RotateCcw className="h-3.5 w-3.5" /></Button>
          <Button size="sm" disabled={t >= X_SEQ.length} onClick={() => setT((s) => s + 1)}>
            推进一个时间步 <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-black/30">
        {X_SEQ.map((x, i) => {
          const step = i + 1;
          const bx = 20 + i * (boxW + gap);
          const active = step <= t;
          return (
            <g key={i} opacity={active ? 1 : 0.25}>
              {/* 输入 */}
              <rect x={bx} y={120} width={boxW} height="26" rx="6" fill="hsl(217 40% 20%)" stroke="#60a5fa" strokeWidth="1" />
              <text x={bx + boxW / 2} y={137} textAnchor="middle" fill="#93c5fd" fontSize="11" fontFamily="monospace">x{step}={fmt(x, 1)}</text>
              <line x1={bx + boxW / 2} y1={120} x2={bx + boxW / 2} y2={92} stroke="#60a5fa" strokeWidth="1" />
              {/* 隐藏状态 */}
              <rect x={bx} y={40} width={boxW} height="52" rx="8" fill="hsl(160 40% 14%)" stroke="#34d399" strokeWidth="1.5" />
              <text x={bx + boxW / 2} y={58} textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="700">h{step}</text>
              <text x={bx + boxW / 2} y={74} textAnchor="middle" fill="#6ee7b7" fontSize="11" fontFamily="monospace">{active ? fmt(hs[step], 3) : '?'}</text>
              <text x={bx + boxW / 2} y={88} textAnchor="middle" fill="#f87171" fontSize="10" fontFamily="monospace">
                {active ? `∇=${fmt(grads[step], 4)}` : ''}
              </text>
              {/* 循环箭头 */}
              {i < X_SEQ.length - 1 && (
                <g>
                  <line x1={bx + boxW} y1={66} x2={bx + boxW + gap} y2={66} stroke={step < t ? '#fbbf24' : 'hsl(228 13% 35%)'} strokeWidth="2" markerEnd="url(#rnn-arr)" />
                  <text x={bx + boxW + gap / 2} y={58} textAnchor="middle" fontSize="10" fill={step < t ? '#fbbf24' : 'hsl(217 12% 50%)'} fontFamily="monospace">×w_h</text>
                </g>
              )}
            </g>
          );
        })}
        <defs>
          <marker id="rnn-arr" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#fbbf24" />
          </marker>
        </defs>
        <text x={20} y={20} fill="#94a3b8" fontSize="11">
          绿色数字：前向隐藏状态 h_t ｜ 红色数字：从末端传回该步的梯度 ∂L/∂h_t
        </text>
      </svg>

      <div className="rounded-lg border border-border bg-card/70 p-4 font-mono text-xs leading-6 text-slate-300">
        <div>本步递推：h{t} = tanh({wx.toFixed(2)}×{fmt(X_SEQ[t - 1], 1)} + {wh.toFixed(2)}×{fmt(hs[t - 1], 3)}) = <span className="text-emerald-300">{fmt(hs[t], 4)}</span></div>
        <div>回传到 h1 的梯度连乘：∏ w_h·tanh′ ≈ <span className={Math.abs(grads[0]) < 0.01 ? 'text-red-300' : Math.abs(grads[0]) > 5 ? 'text-amber-300' : 'text-emerald-300'}>{fmt(grads[0], 5)}</span></div>
        <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
          {Math.abs(grads[0]) < 0.01
            ? '把序列拉长到几百步，这个梯度就是 0——RNN 记不住久远的信息，这就是梯度消失。'
            : Math.abs(grads[0]) > 5
              ? 'w_h 大于 1 时梯度指数膨胀，训练直接爆炸。RNN 的权重被夹在「消失」与「爆炸」之间，非常难训。'
              : '当前的 w_h 下梯度尚可存活——但只要序列足够长，连乘终究会失控。'}
        </div>
      </div>
    </div>
  );
}
