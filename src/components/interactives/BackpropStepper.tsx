import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { fmt } from './plot-utils';

/**
 * 反向传播逐步演示：f = (a + b) × c
 * 前向 3 步 + 反向 3 步，每条边上标注局部梯度，节点上显示值与累积梯度。
 */
export default function BackpropStepper() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [c, setC] = useState(4);
  const [step, setStep] = useState(0); // 0..5

  const v = useMemo(() => {
    const q = a + b;
    const f = q * c;
    // 反向梯度
    const df = 1;
    const dq = c * df;
    const dc = q * df;
    const da = 1 * dq;
    const db = 1 * dq;
    return { q, f, df, dq, dc, da, db };
  }, [a, b, c]);

  const W = 640;
  const H = 260;
  const nodes = {
    a: { x: 90, y: 60 },
    b: { x: 90, y: 200 },
    c: { x: 520, y: 200 },
    q: { x: 300, y: 90 },
    f: { x: 520, y: 90 },
  };

  const fwdVisible = (n: string) =>
    ({ a: step >= 0, b: step >= 0, c: step >= 0, q: step >= 1, f: step >= 2 } as Record<string, boolean>)[n];
  const bwdVisible = (n: string) =>
    ({ a: step >= 5, b: step >= 5, c: step >= 4, q: step >= 4, f: step >= 3 } as Record<string, boolean>)[n];

  const NodeBox = ({
    n, label, value, grad,
  }: { n: keyof typeof nodes; label: string; value: string; grad: string | null }) => {
    const p = nodes[n];
    const on = fwdVisible(n);
    return (
      <g opacity={on ? 1 : 0.25}>
        <rect x={p.x - 44} y={p.y - 30} width="88" height="60" rx="10"
          fill={bwdVisible(n) ? 'hsl(270 50% 18%)' : 'hsl(228 18% 14%)'}
          stroke={bwdVisible(n) ? '#a78bfa' : '#34d399'} strokeWidth="1.5" />
        <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="700">{label}</text>
        <text x={p.x} y={p.y + 6} textAnchor="middle" fill="#34d399" fontSize="12" fontFamily="monospace">值 {value}</text>
        {grad && bwdVisible(n) && (
          <text x={p.x} y={p.y + 22} textAnchor="middle" fill="#c4b5fd" fontSize="12" fontFamily="monospace">∇ {grad}</text>
        )}
      </g>
    );
  };

  const Edge = ({
    from, to, label, active,
  }: { from: keyof typeof nodes; to: keyof typeof nodes; label: string; active: boolean }) => {
    const p1 = nodes[from];
    const p2 = nodes[to];
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2 - 10;
    return (
      <g>
        <line x1={p1.x + 44} y1={p1.y} x2={p2.x - 44} y2={p2.y}
          stroke={active ? '#a78bfa' : 'hsl(228 13% 35%)'} strokeWidth={active ? 2.5 : 1.5}
          markerEnd={active ? 'url(#bp-arrow)' : undefined} />
        <text x={mx} y={my} textAnchor="middle" fontSize="11" fontFamily="monospace"
          fill={active ? '#c4b5fd' : 'hsl(217 12% 55%)'}>{label}</text>
      </g>
    );
  };

  const stepDesc = [
    '第 0 步：准备好输入 a、b、c。',
    '前向 ①：计算 q = a + b。每个节点只知道自己局部的运算。',
    '前向 ②：计算 f = q × c，得到最终输出。',
    '反向 ①：从输出出发，∂f/∂f = 1——「我变一点，我自己就变一点」。',
    '反向 ②：局部梯度 ∂f/∂q = c，∂f/∂c = q。把上游梯度 1 乘上局部梯度。',
    '反向 ③：q 的梯度继续往回传：∂f/∂a = ∂f/∂q × ∂q/∂a = c × 1。链式法则完成！',
  ];

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-black/30">
        <defs>
          <marker id="bp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#a78bfa" />
          </marker>
        </defs>
        <Edge from="a" to="q" label="∂q/∂a = 1" active={step >= 5} />
        <Edge from="b" to="q" label="∂q/∂b = 1" active={step >= 5} />
        <Edge from="q" to="f" label={`∂f/∂q = c = ${fmt(c, 1)}`} active={step >= 4} />
        <Edge from="c" to="f" label={`∂f/∂c = q = ${fmt(v.q, 1)}`} active={step >= 4} />
        <NodeBox n="a" label="a" value={fmt(a, 1)} grad={fmt(v.da, 1)} />
        <NodeBox n="b" label="b" value={fmt(b, 1)} grad={fmt(v.db, 1)} />
        <NodeBox n="c" label="c" value={fmt(c, 1)} grad={fmt(v.dc, 1)} />
        <NodeBox n="q" label="q = a+b" value={fmt(v.q, 1)} grad={fmt(v.dq, 1)} />
        <NodeBox n="f" label="f = q×c" value={fmt(v.f, 1)} grad={fmt(v.df, 1)} />
      </svg>

      <div className="flex flex-wrap items-center gap-4">
        {([['a', a, setA], ['b', b, setB], ['c', c, setC]] as const).map(([label, val, set]) => (
          <div key={label} className="w-32">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{label}</span><span className="font-mono">{val}</span>
            </div>
            <Slider min={-4} max={6} step={0.5} value={[val]} onValueChange={([x]) => set(x)} />
          </div>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setStep(0)}><RotateCcw className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" disabled={step === 5} onClick={() => setStep((s) => s + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-violet-400/25 bg-violet-500/[0.07] p-3 text-sm text-violet-200">
        {stepDesc[step]}
        {step === 5 && (
          <span className="mt-1 block text-xs text-muted-foreground">
            试试把 c 调成 0：a 和 b 的梯度立刻也变成 0——梯度被「乘法门」杀死了。这在深层网络里就是梯度消失。
          </span>
        )}
      </div>
    </div>
  );
}
