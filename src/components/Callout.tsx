import { Info, AlertTriangle, Lightbulb, KeyRound } from 'lucide-react';
import { renderMd } from './math/K';

const STYLES = {
  info: {
    icon: Info,
    border: 'border-sky-400/30',
    bg: 'bg-sky-500/[0.07]',
    text: 'text-sky-300',
    label: '说明',
  },
  warn: {
    icon: AlertTriangle,
    border: 'border-amber-400/30',
    bg: 'bg-amber-500/[0.07]',
    text: 'text-amber-300',
    label: '注意',
  },
  tip: {
    icon: Lightbulb,
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-500/[0.07]',
    text: 'text-emerald-300',
    label: '直觉理解',
  },
  key: {
    icon: KeyRound,
    border: 'border-violet-400/30',
    bg: 'bg-violet-500/[0.07]',
    text: 'text-violet-300',
    label: '核心要点',
  },
} as const;

export default function Callout({
  variant,
  title,
  md,
}: {
  variant: keyof typeof STYLES;
  title?: string;
  md: string;
}) {
  const s = STYLES[variant];
  const Icon = s.icon;
  return (
    <div className={`my-6 rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className={`mb-1.5 flex items-center gap-2 text-sm font-semibold ${s.text}`}>
        <Icon className="h-4 w-4" />
        {title ?? s.label}
      </div>
      <div className="lesson-text text-[0.93rem]">{renderMd(md)}</div>
    </div>
  );
}
