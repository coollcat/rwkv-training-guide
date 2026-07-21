import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { seededRandom, fmt } from './plot-utils';

const T = 6;

/**
 * WKV 递推实验室（RWKV-4 单通道教学版）：
 *   输出：wkv_t = (A + e^{u+k_t} v_t) / (B + e^{u+k_t})
 *   状态：A ← e^{−w} A + e^{k_t} v_t，B ← e^{−w} B + e^{k_t}
 * A、B 就是 RWKV 的「RNN 状态」——注意力被压缩成了两个数。
 */
export default function WKVStepper() {
  const [w, setW] = useState(0.7);   // 衰减率 w（实际模型存的是 exp(-w)）
  const [u, setU] = useState(0.5);   // 当前 token 奖励 u
  const [t, setT] = useState(1);

  const seq = useMemo(() => {
    const rnd = seededRandom(42);
    return Array.from({ length: T }, () => ({
      k: rnd() * 2 - 0.5,
      v: rnd() * 2 - 1,
      r: rnd() * 2 - 1,
    }));
  }, []);

  const steps = useMemo(() => {
    let A = 0;
    let B = 0;
    return seq.map(({ k, v, r }, i) => {
      const bonus = Math.exp(u + k);
      const wkv = (A + bonus * v) / (B + bonus);
      const out = 1 / (1 + Math.exp(-r)) * wkv; // receptance 门控
      const rec = { t: i + 1, k, v, r, Ain: A, Bin: B, wkv, out };
      A = Math.exp(-w) * A + Math.exp(k) * v;
      B = Math.exp(-w) * B + Math.exp(k);
      return { ...rec, Aout: A, Bout: B };
    });
  }, [seq, w, u]);

  const cur = steps[t - 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5">
        <div className="w-44">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>衰减率 w（越大忘得越快）</span><span className="font-mono text-amber-300">{w.toFixed(2)}</span></div>
          <Slider min={0.05} max={2} step={0.05} value={[w]} onValueChange={([v]) => setW(v)} />
        </div>
        <div className="w-44">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>当前奖励 u</span><span className="font-mono text-amber-300">{u.toFixed(2)}</span></div>
          <Slider min={-1} max={2} step={0.05} value={[u]} onValueChange={([v2]) => setU(v2)} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setT(1)}><RotateCcw className="h-3.5 w-3.5" /></Button>
          <Button size="sm" disabled={t >= T} onClick={() => setT((s) => Math.min(s + 1, T))}>
            下一个 token <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setT(i + 1)}
            className={`flex-1 rounded-lg border px-1 py-2 text-center font-mono text-[11px] transition ${
              i + 1 === t
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                : i + 1 < t
                  ? 'border-emerald-400/30 bg-emerald-500/5 text-emerald-300/70'
                  : 'border-border bg-card/40 text-muted-foreground'
            }`}
          >
            <div className="font-bold">t={s.t}</div>
            <div>k={fmt(s.k, 2)}</div>
            <div>v={fmt(s.v, 2)}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-sky-400/25 bg-sky-500/[0.06] p-3">
          <div className="mb-1 text-xs font-semibold text-sky-300">① 读入状态（上一步留下的）</div>
          <div className="font-mono text-xs leading-6 text-slate-300">
            <div>A = {fmt(cur.Ain, 4)}（分子记忆）</div>
            <div>B = {fmt(cur.Bin, 4)}（分母记忆）</div>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.06] p-3">
          <div className="mb-1 text-xs font-semibold text-emerald-300">② 计算 wkv_t（注意力的化身）</div>
          <div className="font-mono text-xs leading-6 text-slate-300">
            <div>wkv = (A + e^(u+k)·v) / (B + e^(u+k))</div>
            <div>= ({fmt(cur.Ain, 3)} + {fmt(Math.exp(u + cur.k), 3)}×{fmt(cur.v, 3)}) / ({fmt(cur.Bin, 3)} + {fmt(Math.exp(u + cur.k), 3)})</div>
            <div>= <span className="text-emerald-300">{fmt(cur.wkv, 4)}</span></div>
            <div>σ(r)·wkv = <span className="text-amber-300">{fmt(cur.out, 4)}</span>（r 门控后输出）</div>
          </div>
        </div>
        <div className="rounded-lg border border-violet-400/25 bg-violet-500/[0.06] p-3">
          <div className="mb-1 text-xs font-semibold text-violet-300">③ 更新状态（写给下一步）</div>
          <div className="font-mono text-xs leading-6 text-slate-300">
            <div>A ← e^(−w)·A + e^k·v = <span className="text-violet-300">{fmt(cur.Aout, 4)}</span></div>
            <div>B ← e^(−w)·B + e^k = <span className="text-violet-300">{fmt(cur.Bout, 4)}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/70 p-3 text-xs leading-6 text-muted-foreground">
        把 <span className="text-amber-300">w 调大</span>：几步之后早期 token 的贡献几乎清零——衰减率控制「记忆长度」；
        把 <span className="text-amber-300">u 调大</span>：当前 token 在输出中的话语权变大。
        在真实 RWKV 里，每个通道都有自己独立的 w 和 u，有的记短期、有的记长期——这就是它能处理长文的秘诀。
      </div>
    </div>
  );
}
