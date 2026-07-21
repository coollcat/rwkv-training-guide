import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { fmt } from './plot-utils';

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Time-Mixing 单通道全程实验室：
 *   lerp：x_t 与 x_{t−1} 按 μ 插值 → r, k, v → wkv（用单步近似展示）→ σ(r) 门控
 * 所有参数可拖，直观看到「当前词」与「上一个词」如何混合出 r/k/v。
 */
export default function TimeMixingLab() {
  const [xt, setXt] = useState(1.2);
  const [xp, setXp] = useState(-0.4);
  const [muK, setMuK] = useState(0.7);
  const [muV, setMuV] = useState(0.6);
  const [muR, setMuR] = useState(0.5);
  const [w, setW] = useState(0.7);
  const [u, setU] = useState(0.5);
  const [stateA, setStateA] = useState(0.3);
  const [stateB, setStateB] = useState(0.5);

  const res = useMemo(() => {
    // 为教学清晰，投影权重取 1（真实模型是可学习矩阵）
    const k = muK * xt + (1 - muK) * xp;
    const v = muV * xt + (1 - muV) * xp;
    const r = muR * xt + (1 - muR) * xp;
    const bonus = Math.exp(u + k);
    const wkv = (stateA + bonus * v) / (stateB + bonus);
    const out = sigmoid(r) * wkv;
    return { k, v, r, bonus, wkv, out, sig: sigmoid(r) };
  }, [xt, xp, muK, muV, muR, w, u, stateA, stateB]);

  void w; // w 参与下一步状态更新，单步演示中仅展示公式

  const Row = ({ label, val, set, min = -2, max = 2 }: { label: string; val: number; set: (v: number) => void; min?: number; max?: number }) => (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span><span className="font-mono text-amber-300">{val.toFixed(2)}</span>
      </div>
      <Slider min={min} max={max} step={0.05} value={[val]} onValueChange={([v]) => set(v)} />
    </div>
  );

  return (
    <div className="grid gap-5 md:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <Row label="x_t（当前 token 的输入）" val={xt} set={setXt} />
        <Row label="x_{t−1}（上一个 token，来自状态）" val={xp} set={setXp} />
        <Row label="μ_k（k 更偏向当前的程度）" val={muK} set={setMuK} min={0} max={1} />
        <Row label="μ_v" val={muV} set={setMuV} min={0} max={1} />
        <Row label="μ_r" val={muR} set={setMuR} min={0} max={1} />
        <Row label="u（当前 token 奖励）" val={u} set={setU} />
        <Row label="w（衰减率，供状态更新用）" val={w} set={setW} min={0.05} max={2} />
        <Row label="旧状态 A" val={stateA} set={setStateA} min={-2} max={3} />
        <Row label="旧状态 B" val={stateB} set={setStateB} min={0.05} max={3} />
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-sky-400/25 bg-sky-500/[0.06] p-3">
          <div className="mb-1 text-xs font-semibold text-sky-300">① Token Shift 混合（lerp）</div>
          <div className="font-mono text-xs leading-6 text-slate-300">
            <div>k = μ_k·x_t + (1−μ_k)·x_(t−1) = {muK.toFixed(2)}×{xt.toFixed(2)} + {(1 - muK).toFixed(2)}×({xp.toFixed(2)}) = <span className="text-sky-300">{fmt(res.k, 3)}</span></div>
            <div>v = <span className="text-sky-300">{fmt(res.v, 3)}</span>，r = <span className="text-sky-300">{fmt(res.r, 3)}</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.06] p-3">
          <div className="mb-1 text-xs font-semibold text-emerald-300">② WKV 时间混合</div>
          <div className="font-mono text-xs leading-6 text-slate-300">
            <div>wkv = (A + e^(u+k)·v) / (B + e^(u+k)) = <span className="text-emerald-300">{fmt(res.wkv, 4)}</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-400/25 bg-amber-500/[0.06] p-3">
          <div className="mb-1 text-xs font-semibold text-amber-300">③ Receptance 门控输出</div>
          <div className="font-mono text-xs leading-6 text-slate-300">
            <div>σ(r) = {fmt(res.sig, 3)} → out = σ(r) × wkv = <span className="text-lg font-bold text-amber-300">{fmt(res.out, 4)}</span></div>
          </div>
        </div>
        <div className="text-[11px] leading-5 text-muted-foreground">
          真实模型中 r、k、v 都是几百维的向量，由可学习矩阵 W_r、W_k、W_v 投影得到；这里把权重设为 1 只保留骨架。
          试着只拖 μ_r：它不改变 wkv 的值，却能通过 σ(r) 一键「关掉」整个输出——门控就是信息的水龙头。
        </div>
      </div>
    </div>
  );
}
