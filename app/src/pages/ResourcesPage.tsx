import { useEffect } from 'react';
import { PAPERS } from '@/data/papers';
import { ExternalLink, Library } from 'lucide-react';

const TAG_STYLE: Record<string, string> = {
  RWKV: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  前置必读: 'border-sky-400/40 bg-sky-500/10 text-sky-300',
  代码仓库: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  进阶: 'border-violet-400/40 bg-violet-500/10 text-violet-300',
};

export default function ResourcesPage() {
  useEffect(() => {
    document.title = '论文与资料库 · RWKV 研习社';
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-amber-300">
        <Library className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Library</span>
      </div>
      <h1 className="mb-3 text-2xl font-black md:text-3xl">论文与资料库</h1>
      <p className="mb-8 text-sm leading-7 text-muted-foreground">
        课程中所有断言的原始出处。建议的阅读时机：RWKV 主论文在第 9 章后读，Transformer 论文在第 8 章后读，
        其余按「毕业路线图」推进。所有链接均为公开的 arXiv / 官方仓库。
      </p>

      <div className="space-y-3">
        {PAPERS.map((p) => (
          <a
            key={p.title}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-xl border border-border bg-card/60 p-4 transition hover:border-emerald-400/40 hover:bg-card"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${TAG_STYLE[p.tag]}`}>
                {p.tag}
              </span>
              <span className="text-[11px] text-muted-foreground">{p.year}</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="mb-1 text-[15px] font-bold text-slate-100 group-hover:text-emerald-200">{p.title}</div>
            <div className="mb-2 text-xs text-muted-foreground">{p.authors}</div>
            <div className="text-xs leading-6 text-slate-400">{p.note}</div>
          </a>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-4 text-xs leading-6 text-amber-100/90">
        提示：arXiv 页面右上角有 PDF 下载；GitHub 仓库建议先读 README 再看代码。
        遇到看不懂的公式，回到对应章节——本课程的符号体系与这些论文严格对齐。
      </div>
    </div>
  );
}
