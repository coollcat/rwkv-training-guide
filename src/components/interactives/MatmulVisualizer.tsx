import { useMemo, useState } from 'react';
import { fmt } from './plot-utils';

/** 矩阵乘法可视化：A(3×3) @ B(3×3) = C，点选 C 的元素看「行 × 列」如何求和 */
export default function MatmulVisualizer() {
  const [A, setA] = useState<number[][]>([
    [1, 2, -1],
    [0, 3, 1],
    [2, -1, 0],
  ]);
  const [B, setB] = useState<number[][]>([
    [1, 0, 2],
    [-1, 1, 0],
    [0, 2, 1],
  ]);
  const [sel, setSel] = useState<[number, number]>([0, 0]);

  const C = useMemo(() => {
    return A.map((row) => B[0].map((_, j) => row.reduce((s, _, k) => s + row[k] * B[k][j], 0)));
  }, [A, B]);

  const [si, sj] = sel;
  const products = A[si].map((a, k) => ({ a, b: B[k][sj], p: a * B[k][sj] }));

  const cell = (
    v: number,
    opts: { active?: boolean; onClick?: () => void; editable?: (nv: number) => void; key?: string },
  ) => (
    <input
      key={opts.key}
      type="number"
      value={v}
      onClick={opts.onClick}
      onChange={(e) => opts.editable?.(parseFloat(e.target.value) || 0)}
      readOnly={!opts.editable}
      className={`h-10 w-12 rounded-md border text-center font-mono text-sm outline-none transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
        opts.active
          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
          : 'border-border bg-black/30 text-slate-200'
      } ${opts.onClick ? 'cursor-pointer hover:border-emerald-400/60' : ''}`}
    />
  );

  const setVal = (m: number[][], set: (x: number[][]) => void, i: number, j: number) => (nv: number) => {
    const next = m.map((r) => [...r]);
    next[i][j] = nv;
    set(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* A */}
        <div>
          <div className="mb-2 text-center text-xs text-muted-foreground">A（3×3）</div>
          <div className="grid grid-cols-3 gap-1.5">
            {A.map((row, i) =>
              row.map((v, j) =>
                cell(v, { key: `a${i}${j}`, active: i === si, editable: setVal(A, setA, i, j) }),
              ),
            )}
          </div>
        </div>
        <div className="text-2xl text-muted-foreground">×</div>
        {/* B */}
        <div>
          <div className="mb-2 text-center text-xs text-muted-foreground">B（3×3）</div>
          <div className="grid grid-cols-3 gap-1.5">
            {B.map((row, i) =>
              row.map((v, j) =>
                cell(v, { key: `b${i}${j}`, active: j === sj, editable: setVal(B, setB, i, j) }),
              ),
            )}
          </div>
        </div>
        <div className="text-2xl text-muted-foreground">=</div>
        {/* C */}
        <div>
          <div className="mb-2 text-center text-xs text-muted-foreground">C = A·B（点我）</div>
          <div className="grid grid-cols-3 gap-1.5">
            {C.map((row, i) =>
              row.map((v, j) =>
                cell(v, { key: `c${i}${j}`, active: i === si && j === sj, onClick: () => setSel([i, j]) }),
              ),
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/70 p-4 text-center">
        <div className="mb-1 text-xs text-muted-foreground">
          C[{si + 1},{sj + 1}] = A 的第 {si + 1} 行 · B 的第 {sj + 1} 列
        </div>
        <div className="font-mono text-sm text-slate-200">
          {products.map((p, k) => (
            <span key={k}>
              <span className="text-emerald-300">({fmt(p.a, 0)}×{fmt(p.b, 0)})</span>
              {k < 2 && <span className="text-muted-foreground"> + </span>}
            </span>
          ))}
          <span className="text-muted-foreground"> = </span>
          {products.map((p) => fmt(p.p, 0)).join(' + ')}
          <span className="text-muted-foreground"> = </span>
          <span className="text-lg font-bold text-amber-300">{fmt(C[si][sj], 0)}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          修改 A、B 中任意元素试试。神经网络的每一层，本质上就是一次这样的矩阵乘法再加一个偏置。
        </div>
      </div>
    </div>
  );
}
