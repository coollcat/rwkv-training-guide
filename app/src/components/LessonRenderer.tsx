import type { Block } from '@/data/types';
import { KBlock, renderMd } from './math/K';
import CodeBlock from './CodeBlock';
import Callout from './Callout';
import Quiz from './Quiz';
import { INTERACTIVES } from './interactives/registry';
import { FlaskConical } from 'lucide-react';

/** 把课时的 Block[] 渲染为完整页面内容 */
export default function LessonRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'text':
            return (
              <p key={i} className="lesson-text my-4 text-[0.98rem]">
                {renderMd(b.md)}
              </p>
            );
          case 'heading':
            return (
              <h2 key={i} className="mb-2 mt-10 flex items-center gap-2 text-xl font-bold text-foreground">
                <span className="h-5 w-1 rounded-full bg-emerald-400" />
                {b.text}
              </h2>
            );
          case 'formula':
            return <KBlock key={i} tex={b.tex} caption={b.caption} />;
          case 'code':
            return <CodeBlock key={i} code={b.code} title={b.title} />;
          case 'callout':
            return <Callout key={i} variant={b.variant} title={b.title} md={b.md} />;
          case 'list':
            return b.ordered ? (
              <ol key={i} className="lesson-text my-4 list-decimal space-y-2 pl-6 marker:text-emerald-400">
                {b.items.map((it, j) => (
                  <li key={j}>{renderMd(it)}</li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="lesson-text my-4 list-disc space-y-2 pl-6 marker:text-emerald-400">
                {b.items.map((it, j) => (
                  <li key={j}>{renderMd(it)}</li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={i} className="my-6 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-white/[0.04]">
                      {b.head.map((h, j) => (
                        <th key={j} className="px-4 py-2.5 text-left font-semibold text-emerald-300">
                          {renderMd(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r} className="border-b border-border/50 last:border-0">
                        {row.map((c, j) => (
                          <td key={j} className="lesson-text px-4 py-2.5">
                            {renderMd(c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {b.caption && (
                  <div className="border-t border-border/50 px-4 py-2 text-xs text-muted-foreground">{b.caption}</div>
                )}
              </div>
            );
          case 'interactive': {
            const Comp = INTERACTIVES[b.name];
            return (
              <section key={i} className="lab-panel my-8 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
                    <FlaskConical className="h-4 w-4 text-emerald-400" />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-emerald-200">动手实验室 · {b.title}</div>
                    {b.desc && <div className="text-xs text-muted-foreground">{b.desc}</div>}
                  </div>
                </div>
                <Comp />
              </section>
            );
          }
          case 'quiz':
            return <Quiz key={i} quiz={b.quiz} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
