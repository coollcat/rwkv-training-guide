import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { LESSON_INDEX, FLAT_LESSONS } from '@/data/curriculum';
import LessonRenderer from '@/components/LessonRenderer';
import { useProgressCtx } from '@/hooks/ProgressContext';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from 'lucide-react';

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const progress = useProgressCtx();
  const entry = lessonId ? LESSON_INDEX.get(lessonId) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [lessonId]);

  if (!entry) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        未找到该课时。<Link to="/" className="text-emerald-400 underline">返回首页</Link>
      </div>
    );
  }

  const { chapter, lesson } = entry;
  const flatIdx = FLAT_LESSONS.findIndex((f) => f.lesson.id === lesson.id);
  const prev = flatIdx > 0 ? FLAT_LESSONS[flatIdx - 1] : null;
  const next = flatIdx < FLAT_LESSONS.length - 1 ? FLAT_LESSONS[flatIdx + 1] : null;
  const done = progress.isDone(lesson.id);

  return (
    <div>
      {/* 面包屑 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono" style={{ color: `hsl(${chapter.accent})` }}>第 {chapter.num} 章</span>
        <span>·</span>
        <span>{chapter.title}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> 约 {lesson.minutes} 分钟</span>
      </div>

      <h1 className="mb-8 text-2xl font-black leading-snug md:text-3xl">
        <span className="mr-2 font-mono text-emerald-400">{lesson.id}</span>
        {lesson.title}
      </h1>

      <LessonRenderer blocks={lesson.blocks} />

      {/* 完成标记 + 上下翻页 */}
      <div className="mt-14 border-t border-border pt-6">
        <button
          onClick={() => progress.toggle(lesson.id)}
          className={`mb-6 flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-bold transition ${
            done
              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
              : 'border-border bg-card text-slate-200 hover:border-emerald-400/50'
          }`}
        >
          <CheckCircle2 className={`h-5 w-5 ${done ? 'text-emerald-400' : 'opacity-40'}`} />
          {done ? '本节已完成 · 点击取消标记' : '标记本节为已完成'}
        </button>
        <div className="grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              to={`/lesson/${prev.lesson.id}`}
              className="group flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm transition hover:border-emerald-400/40"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-400" />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground">上一节</div>
                <div className="truncate text-[13px] text-slate-200">{prev.lesson.title}</div>
              </div>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              to={`/lesson/${next.lesson.id}`}
              className="group flex items-center justify-end gap-2 rounded-xl border border-border bg-card/60 px-4 py-3 text-right text-sm transition hover:border-emerald-400/40"
            >
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground">下一节</div>
                <div className="truncate text-[13px] text-slate-200">{next.lesson.title}</div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-400" />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
