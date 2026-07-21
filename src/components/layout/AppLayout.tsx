import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router';
import { CURRICULUM, TOTAL_LESSONS } from '@/data/curriculum';
import { useProgress } from '@/hooks/useProgress';
import { CheckCircle2, Circle, BookOpen, GraduationCap, Menu, X, Library } from 'lucide-react';
import { ProgressContext } from '@/hooks/ProgressContext';

export default function AppLayout() {
  const progress = useProgress();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pct = Math.round((progress.count / TOTAL_LESSONS) * 100);

  const nav = (
    <nav className="space-y-5 pb-10">
      {CURRICULUM.map((ch) => (
        <div key={ch.id}>
          <div className="mb-1.5 flex items-baseline gap-2 px-2">
            <span className="font-mono text-[10px]" style={{ color: `hsl(${ch.accent})` }}>
              {ch.num}
            </span>
            <span className="text-[13px] font-semibold text-slate-200">{ch.title}</span>
          </div>
          <ul className="space-y-0.5">
            {ch.lessons.map((l) => {
              const active = location.pathname === `/lesson/${l.id}`;
              const done = progress.isDone(l.id);
              return (
                <li key={l.id}>
                  <Link
                    to={`/lesson/${l.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition ${
                      active
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    )}
                    <span className="leading-snug">{l.id} {l.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Link
        to="/resources"
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-semibold transition ${
          location.pathname === '/resources'
            ? 'bg-amber-500/15 text-amber-200'
            : 'text-amber-300/80 hover:bg-white/5'
        }`}
      >
        <Library className="h-4 w-4" /> 论文与资料库
      </Link>
    </nav>
  );

  return (
    <ProgressContext.Provider value={progress}>
      <div className="flex min-h-screen">
        {/* 桌面侧边栏 */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border bg-sidebar-background lg:flex" style={{ background: 'hsl(228 20% 8%)' }}>
          <Link to="/" className="flex items-center gap-2.5 border-b border-border px-4 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </span>
            <div>
              <div className="text-sm font-bold text-slate-100">RWKV 研习社</div>
              <div className="text-[10px] text-muted-foreground">从零到手搓训练框架</div>
            </div>
          </Link>
          <div className="border-b border-border px-4 py-3">
            <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>学习进度</span>
              <span className="font-mono text-emerald-300">{progress.count}/{TOTAL_LESSONS} · {pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
        </aside>

        {/* 移动端顶栏 */}
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border px-4 py-3 lg:hidden" style={{ background: 'hsl(228 20% 8%)' }}>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <GraduationCap className="h-5 w-5 text-emerald-400" /> RWKV 研习社
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg border border-border p-1.5">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-30 overflow-y-auto px-4 pb-8 pt-16 lg:hidden" style={{ background: 'hsl(228 20% 8% / 0.98)' }}>
            {nav}
          </div>
        )}

        {/* 主内容 */}
        <main className="min-w-0 flex-1 pt-14 lg:pl-72 lg:pt-0">
          <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
            <Outlet />
          </div>
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground lg:ml-72">
            <BookOpen className="mr-1 inline h-3.5 w-3.5" />
            RWKV 研习社 · 一门从零基础到手搓训练框架的渐进式课程
          </footer>
        </main>
      </div>
    </ProgressContext.Provider>
  );
}
