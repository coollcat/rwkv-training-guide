import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import React from 'react';

/** 行内公式 */
export function K({ tex }: { tex: string }) {
  return (
    <ErrorBoundary tex={tex}>
      <InlineMath math={tex} />
    </ErrorBoundary>
  );
}

/** 独立公式块 */
export function KBlock({ tex, caption }: { tex: string; caption?: string }) {
  return (
    <figure className="my-6 rounded-xl border border-border bg-card/60 px-4 py-3 overflow-x-auto">
      <div className="text-center text-[1.1rem]">
        <ErrorBoundary tex={tex}>
          <BlockMath math={tex} />
        </ErrorBoundary>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}

/** 公式渲染错误兜底：显示原始 TeX，避免整页崩溃 */
class ErrorBoundary extends React.Component<{ tex: string; children: React.ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch() {}
  render() {
    if (this.state.err) {
      return <code className="text-red-400 text-sm">{this.props.tex}</code>;
    }
    return this.props.children;
  }
}

/**
 * 轻量 Markdown 渲染：把 **粗体**、`代码`、$行内公式$、*强调*、[链接](url) 转成 React 节点。
 * 用于 text/callout/list/quiz 等所有自由文本字段。
 */
export function renderMd(md: string): React.ReactNode[] {
  // 先按行内公式切分（$...$，不含换行）
  const parts = md.split(/(\$[^$\n]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <K key={i} tex={part.slice(1, -1)} />;
    }
    return <React.Fragment key={i}>{renderInlineStyles(part, i)}</React.Fragment>;
  });
}

function renderInlineStyles(text: string, seed: number): React.ReactNode[] {
  // 顺序：**bold**、`code`、⌈code⌉（内容文件推荐，避免模板字符串冲突）、*em*、[text](url)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|⌈[^⌉]+⌉|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts
    .filter((p) => p !== '')
    .map((p, j) => {
      const key = `${seed}-${j}`;
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={key}>{p.slice(2, -2)}</strong>;
      if (p.startsWith('`') && p.endsWith('`')) return <code key={key}>{p.slice(1, -1)}</code>;
      if (p.startsWith('⌈') && p.endsWith('⌉')) return <code key={key}>{p.slice(1, -1)}</code>;
      if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={key}>{p.slice(1, -1)}</em>;
      const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        return (
          <a key={key} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        );
      }
      return <React.Fragment key={key}>{p}</React.Fragment>;
    });
}
