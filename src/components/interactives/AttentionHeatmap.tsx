import { useMemo, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { seededRandom, softmax, heatColor, fmt } from './plot-utils';

/**
 * 注意力热力图：输入一句中文（按字切分），生成确定性的模拟注意力分数，
 * 可切换因果掩码（causal mask）观察「不能偷看未来」的效果。
 * 悬停格子查看 softmax 前后的数值。
 */
export default function AttentionHeatmap() {
  const [text, setText] = useState('小猫追着毛线球跑');
  const [causal, setCausal] = useState(true);
  const [hover, setHover] = useState<[number, number] | null>(null);

  const tokens = useMemo(() => Array.from(text.replace(/\s/g, '')).slice(0, 10), [text]);

  // 确定性伪注意力：让相邻字、主谓之间分数略高，更像真实语言模型
  const raw = useMemo(() => {
    const rnd = seededRandom(tokens.length * 977 + 13);
    return tokens.map((_, i) =>
      tokens.map((_, j) => {
        let s = rnd() * 1.2;
        if (i === j) s += 1.2;             // 自关注
        if (j === i - 1) s += 0.9;         // 相邻上文
        if (i > 0 && j === 0) s += 0.5;    // 句首汇聚（真实模型常见）
        return s;
      }),
    );
  }, [tokens]);

  const weights = useMemo(
    () =>
      raw.map((row, i) =>
        causal
          ? softmax(row.map((s, j) => (j <= i ? s : -Infinity)))
          : softmax(row),
      ),
    [raw, causal],
  );

  const cell = 44;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={10}
          placeholder="输入不超过10个字"
          className="w-56 rounded-lg border border-border bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-400"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={causal} onCheckedChange={setCausal} />
          因果掩码（生成模型必须开）
        </label>
        <span className="text-xs text-muted-foreground">共 {tokens.length} 个 token，矩阵 {tokens.length}×{tokens.length}</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ display: 'inline-block' }} className="rounded-lg border border-border bg-black/30 p-4">
          <div className="flex">
            <div style={{ width: cell }} />
            {tokens.map((tk, j) => (
              <div key={j} style={{ width: cell }} className="text-center text-sm text-sky-300">{tk}</div>
            ))}
          </div>
          {tokens.map((tk, i) => (
            <div key={i} className="flex items-center">
              <div style={{ width: cell }} className="text-center text-sm text-emerald-300">{tk}</div>
              {tokens.map((_, j) => {
                const masked = causal && j > i;
                const w = weights[i][j];
                return (
                  <div
                    key={j}
                    onMouseEnter={() => setHover([i, j])}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      width: cell,
                      height: cell,
                      background: masked ? 'hsl(228 13% 10%)' : heatColor(w, 210),
                      border: '1px solid hsl(228 13% 20%)',
                    }}
                    className="flex items-center justify-center font-mono text-[10px] text-slate-200 transition hover:ring-2 hover:ring-amber-300"
                  >
                    {masked ? '—' : fmt(w, 2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/70 p-3 font-mono text-xs leading-6 text-slate-300">
        {hover ? (
          <div>
            第 {hover[0] + 1} 行「{tokens[hover[0]]}」→ 第 {hover[1] + 1} 列「{tokens[hover[1]]}」：
            原始分数 {causal && hover[1] > hover[0] ? '−∞（被掩码）' : fmt(raw[hover[0]][hover[1]], 2)}，
            softmax 后权重 {causal && hover[1] > hover[0] ? '0' : fmt(weights[hover[0]][hover[1]], 3)}
          </div>
        ) : (
          <div>悬停任意格子查看数值。行 = 当前 token（query），列 = 它在「看」谁（key）。每行权重和为 1。</div>
        )}
        <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
          {causal
            ? '右上角被掩码成 0：位置 i 只能看 ≤ i 的历史。注意力一次算出整行——O(n²) 的矩阵就是这么来的。'
            : '关掉掩码后每个 token 能看到全句（像 BERT 编码器）。对比一下：因果掩码是「生成」与「理解」的分水岭。'}
          <span className="text-amber-300/80">（此处权重为教学模拟，真实权重由 Q·Kᵀ 算出）</span>
        </div>
      </div>
    </div>
  );
}
