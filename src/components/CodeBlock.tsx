import { useMemo, useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 轻量 Python 语法高亮：
 * 先把注释/字符串抽成占位符（防止后续规则匹配到 span 属性里的内容），
 * 再对剩余代码套规则，最后把占位符替换回带颜色的 span。
 */
function highlight(code: string): string {
  const store: string[] = [];
  const key = (i: number) =>
    i.toString().split('').map((d) => String.fromCharCode(97 + Number(d))).join('');
  // 所有命中都先存进 store，以纯字母占位符代替——后续规则永远碰不到已插入的 HTML
  const stash = (html: string) => {
    store.push(html);
    return `\u0001${key(store.length - 1)}\u0001`;
  };

  // ① 注释与字符串
  let src = code.replace(/(#[^\n]*|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, (m) =>
    stash(`<span style="color:${m.startsWith('#') ? '#64748b' : '#fbbf24'}">${escapeHtml(m)}</span>`),
  );

  // ② 转义剩余 HTML
  src = escapeHtml(src);

  // ③ 关键字 / 数字 / 装饰器 / 函数调用（同样走占位符）
  const wrap = (re: RegExp, style: string) => {
    src = src.replace(re, (m) => stash(`<span style="${style}">${m}</span>`));
  };
  wrap(
    /\b(import|from|as|def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|with|lambda|yield|raise|try|except|pass|break|continue|self|assert|print)\b/g,
    'color:#7dd3fc;font-weight:600',
  );
  wrap(/\b\d+\.?\d*(?:e[+-]?\d+)?\b/g, 'color:#f472b6');
  wrap(/@\w+/g, 'color:#c4b5fd');
  wrap(/[a-zA-Z_][a-zA-Z0-9_]*(?=\()/g, 'color:#6ee7b7');

  // ④ 统一还原
  src = src.replace(/\u0001([a-z]+)\u0001/g, (_, k: string) => {
    const idx = Number(k.split('').map((c) => c.charCodeAt(0) - 97).join(''));
    return store[idx] ?? '';
  });

  return src;
}

export default function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => highlight(code.trim()), [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  return (
    <div className="code-block my-6">
      <div className="flex items-center justify-between border-b border-border/60 bg-white/[0.02] px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileCode2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{title ?? '代码演示'}</span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">python</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
