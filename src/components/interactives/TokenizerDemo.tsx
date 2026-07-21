import { useMemo, useState } from 'react';
import { seededRandom, fmt, heatColor } from './plot-utils';

/**
 * Token 化 + Embedding 查表演示：
 * 输入文本 → 字符级 token → id → one-hot → 查 embedding 表得到稠密向量。
 * 真实模型用 BPE，教学用字符级最能看清每一步。
 */
export default function TokenizerDemo() {
  const [text, setText] = useState('猫吃鱼');
  const [selTok, setSelTok] = useState(0);

  const tokens = useMemo(() => Array.from(text).slice(0, 12), [text]);

  // 动态构建词表（教学演示）
  const vocab = useMemo(() => {
    const v = new Map<string, number>();
    let id = 0;
    for (const ch of tokens) if (!v.has(ch)) v.set(ch, id++);
    return v;
  }, [tokens]);
  const vocabSize = Math.max(vocab.size, 2);
  const D_MODEL = 8;

  const ids = tokens.map((ch) => vocab.get(ch)!);

  // 确定性伪 embedding 表
  const table = useMemo(() => {
    const rnd = seededRandom(2024);
    return Array.from({ length: vocabSize }, () =>
      Array.from({ length: D_MODEL }, () => rnd() * 2 - 1),
    );
  }, [vocabSize]);

  const curId = ids[Math.min(selTok, ids.length - 1)] ?? 0;

  return (
    <div className="space-y-4">
      <input
        value={text}
        onChange={(e) => { setText(e.target.value); setSelTok(0); }}
        maxLength={12}
        className="w-72 rounded-lg border border-border bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-400"
        placeholder="输入文本（≤12字）"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {/* ① token 序列 */}
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="mb-2 text-xs font-semibold text-sky-300">① 切分成 token</div>
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((ch, i) => (
              <button
                key={i}
                onClick={() => setSelTok(i)}
                className={`rounded-md border px-2 py-1 text-sm transition ${
                  i === selTok ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-border bg-black/30 text-slate-300 hover:border-emerald-400/40'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* ② id 与 one-hot */}
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="mb-2 text-xs font-semibold text-amber-300">② 查词表得 id → one-hot</div>
          <div className="font-mono text-xs leading-6 text-slate-300">
            <div>id 序列：[{ids.join(', ')}]</div>
            <div className="mt-1">「{tokens[Math.min(selTok, tokens.length - 1)]}」的 one-hot：</div>
            <div className="mt-1 flex gap-1">
              {Array.from({ length: vocabSize }, (_, j) => (
                <div
                  key={j}
                  className={`flex h-7 w-6 items-center justify-center rounded text-[11px] ${
                    j === curId ? 'bg-amber-400 font-bold text-black' : 'bg-black/40 text-muted-foreground'
                  }`}
                >
                  {j === curId ? 1 : 0}
                </div>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">词表大小 {vocabSize} → 向量长度 {vocabSize}</div>
          </div>
        </div>

        {/* ③ embedding 查表 */}
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="mb-2 text-xs font-semibold text-emerald-300">③ Embedding 查表</div>
          <div className="font-mono text-[11px] leading-5 text-slate-300">
            <div>取出矩阵第 {curId} 行（d_model={D_MODEL}）：</div>
            <div className="mt-1 flex gap-0.5">
              {table[curId]?.map((v, j) => (
                <div
                  key={j}
                  className="flex h-8 w-8 items-center justify-center rounded text-[9px]"
                  style={{ background: heatColor((v + 1) / 2, 160) }}
                  title={fmt(v, 3)}
                >
                  {fmt(v, 1)}
                </div>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">这 8 个数就是「{tokens[Math.min(selTok, tokens.length - 1)]}」进入网络的样子</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/70 p-3 text-xs leading-6 text-muted-foreground">
        要点：one-hot 只是「查表」的形式化写法——one-hot 向量乘 embedding 矩阵，结果就是矩阵的第 id 行。
        所以代码里从不需要真的构造 one-hot，一行 <code className="text-amber-300/90">x = embed[token_ids]</code> 就完事。
        真实 RWKV 用词表 65536、BPE 分词；字符级只是让你看清机制。
      </div>
    </div>
  );
}
