import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, RotateCcw } from 'lucide-react';

interface Match {
  m: number;    // 匹配长度
  p: number;    // 历史中出现位置（起点）
  out: string;  // 该出现后面跟着的 token
}

/** 对每个位置 i，在严格历史 s[0..i) 中找「与当前后缀相同的最长片段」（取最近一次），输出其后一个 token */
function computeSteps(s: string): { i: number; best: Match | null }[] {
  const n = s.length;
  const steps: { i: number; best: Match | null }[] = [];
  for (let i = 1; i < n; i++) {
    let best: Match | null = null;
    for (let m = i; m >= 1 && !best; m--) {
      const pat = s.slice(i - m, i);
      for (let p = i - m - 1; p >= 0; p--) {
        if (s.slice(p, p + m) === pat && p + m < i) {
          best = { m, p, out: s[p + m] };
          break;
        }
      }
    }
    steps.push({ i, best });
  }
  return steps;
}

/** ROSA 后缀匹配实验室：朴素算法教学演示（真实实现用后缀自动机做到在线近线性） */
export default function RosaPlayground() {
  const [text, setText] = useState('ababcabxab');
  const [t, setT] = useState(1); // 当前处理到第几步（位置 i）

  const chars = useMemo(() => Array.from(text.replace(/\s/g, '')).slice(0, 20), [text]);
  const steps = useMemo(() => computeSteps(chars.join('')), [chars]);
  const cur = steps[Math.min(t - 1, steps.length - 1)];

  const inCurSuffix = (idx: number) => cur?.best && idx >= cur.i - cur.best.m && idx < cur.i;
  const inHistMatch = (idx: number) => cur?.best && idx >= cur.best.p && idx < cur.best.p + cur.best.m;
  const isSource = (idx: number) => cur?.best && idx === cur.best.p + cur.best.m;

  const hits = steps.filter((s) => s.best && s.best.out === chars[s.i]).length;
  const matched = steps.filter((s) => s.best).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setT(1); }}
          maxLength={20}
          className="w-64 rounded-lg border border-border bg-black/30 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400"
          placeholder="输入序列（≤20 字符）"
        />
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setT(1)}><RotateCcw className="h-3.5 w-3.5" /></Button>
          <Button size="sm" disabled={t >= steps.length} onClick={() => setT((s) => Math.min(s + 1, steps.length))}>
            下一个位置 <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 序列可视化 */}
      <div className="overflow-x-auto rounded-lg border border-border bg-black/30 p-4">
        <div className="flex gap-1">
          {chars.map((c, idx) => {
            let cls = 'border-border bg-card/50 text-slate-300';
            if (isSource(idx)) cls = 'border-sky-400 bg-sky-500/25 text-sky-200';
            else if (inHistMatch(idx)) cls = 'border-emerald-400 bg-emerald-500/25 text-emerald-200';
            else if (inCurSuffix(idx)) cls = 'border-amber-400 bg-amber-500/25 text-amber-200';
            return (
              <div key={idx} className={`flex h-11 w-9 flex-col items-center justify-center rounded-md border font-mono text-sm ${cls}`}>
                <span>{c}</span>
                <span className="text-[8px] text-muted-foreground">{idx}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400/70" /> 当前后缀（位置 {cur?.i} 之前）</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/70" /> 历史中匹配到的最长片段</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400/70" /> 它后面跟着的 token（预测来源）</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/70 p-3 font-mono text-xs leading-6 text-slate-300">
          {cur?.best ? (
            <>
              <div>位置 i = {cur.i}：当前后缀 ⌈{chars.slice(cur.i - cur.best.m, cur.i).join('')}⌉（长度 {cur.best.m}）</div>
              <div>历史中最近一次出现在 [{cur.best.p}, {cur.best.p + cur.best.m})</div>
              <div>其后一个 token 是 <span className="text-sky-300">⌈{cur.best.out}⌉</span> → ROSA 输出它</div>
              <div>真实下一个：<span className={cur.best.out === chars[cur.i] ? 'text-emerald-300' : 'text-red-300'}>⌈{chars[cur.i]}⌉ {cur.best.out === chars[cur.i] ? '✓ 命中' : '✗ 未中'}</span></div>
            </>
          ) : (
            <div>位置 i = {cur?.i}：历史中没有可匹配的后缀 → 输出 ⊥（无匹配，交给神经路径兜底）</div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-3 font-mono text-xs leading-6 text-slate-300">
          <div>全程统计：{steps.length} 个位置中 {matched} 个找到匹配，{hits} 个精确命中真实下一个 token</div>
          <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
            试着输入周期串（如 abcabcabc）——从第二个周期起 ROSA 几乎百发百中。
            这就是「永不遗忘、永能召回」：重复模式出现一次，终身可用，且无需 KV cache。
          </div>
        </div>
      </div>
    </div>
  );
}
