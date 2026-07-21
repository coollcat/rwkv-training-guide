import { Link } from 'react-router';
import { CURRICULUM, TOTAL_LESSONS } from '@/data/curriculum';
import { useProgressCtx } from '@/hooks/ProgressContext';
import { ArrowRight, BookOpen, CheckCircle2, FlaskConical, Library, Sparkles } from 'lucide-react';

const STAGES = ['数学地基', '机器学习内功', '序列与注意力', 'RWKV 理论', '工程实战', '前沿视野'];

export default function Home() {
  const progress = useProgressCtx();
  const firstUndone = CURRICULUM.flatMap((c) => c.lessons.map((l) => ({ c, l }))).find(
    ({ l }) => !progress.isDone(l.id),
  );

  return (
    <div>
      {/* Hero */}
      <section className="bg-grid relative mb-12 overflow-hidden rounded-3xl border border-border px-6 py-14 text-center md:px-12">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-xs text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> 渐进式 · 可交互 · 数学优先
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight md:text-5xl">
            从不懂机器学习，
            <br />
            到<span className="text-emerald-400">手搓 RWKV 训练框架</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            一条平滑的学习阶梯：线性代数 → 微积分 → 概率论 → 优化 → 序列建模 →
            注意力机制 → RWKV 架构全解 → 亲手写出可运行的训练框架。
            每个公式都配一个可以上手玩的实验室。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to={firstUndone ? `/lesson/${firstUndone.l.id}` : '/lesson/0-1'}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-400"
            >
              {progress.count > 0 ? '继续学习' : '开始第一课'} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-amber-400/50 hover:text-amber-200"
            >
              <Library className="h-4 w-4" /> 论文资料库
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-emerald-400" /> {TOTAL_LESSONS} 节渐进课程</span>
            <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5 text-emerald-400" /> 12 个交互实验室</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 已完成 {progress.count} 节</span>
          </div>
        </div>
      </section>

      {/* 路线图 */}
      {STAGES.map((stage) => {
        const chapters = CURRICULUM.filter((c) => c.stage === stage);
        if (!chapters.length) return null;
        return (
          <section key={stage} className="mb-10">
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
              <span className="h-4 w-1 rounded-full bg-emerald-400" />
              {stage}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {chapters.map((ch) => {
                const doneCount = ch.lessons.filter((l) => progress.isDone(l.id)).length;
                return (
                  <Link
                    key={ch.id}
                    to={`/lesson/${ch.lessons[0].id}`}
                    className="group rounded-2xl border border-border bg-card/60 p-5 transition hover:border-emerald-400/40 hover:bg-card"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs" style={{ color: `hsl(${ch.accent})` }}>
                        第 {ch.num} 章
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {doneCount}/{ch.lessons.length} 节
                      </span>
                    </div>
                    <div className="mb-1 font-bold text-slate-100 group-hover:text-emerald-200">{ch.title}</div>
                    <div className="mb-3 text-xs leading-6 text-muted-foreground">{ch.subtitle}</div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(doneCount / ch.lessons.length) * 100}%`,
                          background: `hsl(${ch.accent})`,
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
