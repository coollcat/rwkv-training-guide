import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { softmax, fmt } from './plot-utils';

const WORDS = ['的', '是', '猫', '跑'];

/** Softmax + 交叉熵实验台：拖动 logits，观察概率分布与 loss 如何变化 */
export default function SoftmaxDemo() {
  const [logits, setLogits] = useState<number[]>([2.0, 1.0, 0.5, -1.0]);
  const [temp, setTemp] = useState(1.0);
  const [target, setTarget] = useState(0);

  const probs = useMemo(() => softmax(logits, temp), [logits, temp]);
  const loss = -Math.log(Math.max(probs[target], 1e-12));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="text-xs font-semibold text-muted-foreground">模型输出的 logits（原始分数）</div>
        {logits.map((z, i) => (
          <div key={i}>
            <div className="mb-1 flex justify-between text-xs">
              <span className={i === target ? 'font-bold text-emerald-300' : 'text-muted-foreground'}>
                「{WORDS[i]}」{i === target && ' ← 正确答案'}
              </span>
              <span className="font-mono text-amber-300">{z.toFixed(1)}</span>
            </div>
            <Slider
              min={-4}
              max={4}
              step={0.1}
              value={[z]}
              onValueChange={([v]) => setLogits(logits.map((x, j) => (j === i ? v : x)))}
            />
          </div>
        ))}
        <div className="pt-2">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">温度 T（&lt;1 更尖锐，&gt;1 更平滑）</span>
            <span className="font-mono text-amber-300">{temp.toFixed(2)}</span>
          </div>
          <Slider min={0.2} max={3} step={0.05} value={[temp]} onValueChange={([v]) => setTemp(v)} />
        </div>
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="text-muted-foreground">正确词：</span>
          {WORDS.map((w, i) => (
            <button
              key={w}
              onClick={() => setTarget(i)}
              className={`rounded-md border px-2.5 py-1 transition ${
                target === i
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                  : 'border-border bg-card/60 text-muted-foreground hover:border-emerald-400/40'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">softmax 后的概率分布</div>
        <div className="flex h-44 items-end gap-3 rounded-lg border border-border bg-black/30 p-4">
          {probs.map((p, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="font-mono text-[11px] text-slate-300">{(p * 100).toFixed(1)}%</div>
              <div
                className="w-full rounded-t-md transition-all duration-200"
                style={{
                  height: `${Math.max(2, p * 120)}px`,
                  background: i === target ? 'hsl(160 84% 45%)' : 'hsl(217 40% 45%)',
                }}
              />
              <div className={`text-sm ${i === target ? 'font-bold text-emerald-300' : 'text-muted-foreground'}`}>{WORDS[i]}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-border bg-card/70 p-3 font-mono text-xs leading-6 text-slate-300">
          <div>交叉熵 loss = −ln(p_正确) = −ln({fmt(probs[target], 3)})</div>
          <div className="text-lg">= <span className={loss < 0.5 ? 'text-emerald-300' : loss < 1.5 ? 'text-amber-300' : 'text-red-300'}>{fmt(loss, 3)}</span></div>
          <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
            把正确词的概率推高，loss 就下降。语言模型训练的全部目标：对语料里每个真实 next-token 最小化这个值。
          </div>
        </div>
      </div>
    </div>
  );
}
