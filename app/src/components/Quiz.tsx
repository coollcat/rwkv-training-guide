import { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle } from 'lucide-react';
import type { QuizDef } from '@/data/types';
import { renderMd } from './math/K';

export default function Quiz({ quiz }: { quiz: QuizDef }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = answered && quiz.options[picked].correct;

  return (
    <div className="my-8 rounded-xl border border-indigo-400/25 bg-indigo-500/[0.06] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
        <HelpCircle className="h-4 w-4" />
        随堂检测
      </div>
      <div className="lesson-text mb-4 text-[0.95rem]">{renderMd(quiz.question)}</div>
      <div className="space-y-2">
        {quiz.options.map((opt, i) => {
          let cls = 'border-border bg-card/60 hover:border-indigo-400/50 hover:bg-indigo-500/10';
          if (answered) {
            if (opt.correct) cls = 'border-emerald-400/60 bg-emerald-500/10';
            else if (i === picked) cls = 'border-red-400/60 bg-red-500/10';
            else cls = 'border-border bg-card/40 opacity-60';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${cls}`}
            >
              <span className="mt-0.5 shrink-0">
                {answered && opt.correct ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : answered && i === picked ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                )}
              </span>
              <span className="lesson-text">{renderMd(opt.text)}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
            correct
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-400/30 bg-amber-500/10 text-amber-100'
          }`}
        >
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="lesson-text">
            <strong>{correct ? '回答正确！' : '再想想——'}</strong>
            {renderMd(quiz.explanation)}
          </div>
        </div>
      )}
    </div>
  );
}
