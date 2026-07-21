/**
 * 课程内容类型定义
 * 所有章节的教程内容都以 Block[] 的形式声明式描述，
 * 由 LessonRenderer 统一渲染。新增章节/课时只需在 data/chapters 下
 * 新增文件并在 curriculum.ts 注册，无需改动渲染层。
 * 详见根目录 MAINTENANCE.md
 */

/** 交互组件名（与 components/interactives/registry.tsx 一一对应） */
export type InteractiveName =
  | 'vector-playground'
  | 'matmul-visualizer'
  | 'gradient-descent'
  | 'softmax-demo'
  | 'backprop-stepper'
  | 'activation-explorer'
  | 'rnn-unroll'
  | 'attention-heatmap'
  | 'wkv-stepper'
  | 'time-mixing-lab'
  | 'loss-curve-sim'
  | 'tokenizer-demo';

export interface QuizOption {
  text: string;          // 支持 $...$ 行内公式
  correct: boolean;
}

export interface QuizDef {
  question: string;      // 支持 $...$ 行内公式
  options: QuizOption[];
  explanation: string;   // 解析，支持 $...$ 行内公式
}

/** 课时内容块（联合类型） */
export type Block =
  | { type: 'text'; md: string }                                   // 段落：支持 **粗体**、`代码`、$行内公式$、[链接](url)
  | { type: 'heading'; text: string }                              // 小节标题
  | { type: 'formula'; tex: string; caption?: string }             // 独立公式（KaTeX display）
  | { type: 'code'; code: string; title?: string; lang?: string }  // 代码演示块
  | { type: 'callout'; variant: 'info' | 'warn' | 'tip' | 'key'; title?: string; md: string }
  | { type: 'list'; items: string[]; ordered?: boolean }           // 列表项支持行内公式
  | { type: 'table'; head: string[]; rows: string[][]; caption?: string }
  | { type: 'interactive'; name: InteractiveName; title: string; desc?: string }
  | { type: 'quiz'; quiz: QuizDef };

export interface Lesson {
  id: string;          // 全站唯一，如 "1-2"，用于路由与进度记录
  title: string;
  minutes: number;     // 预计阅读分钟数
  blocks: Block[];
}

export interface Chapter {
  id: string;          // 如 "ch01"
  num: string;         // 展示编号，如 "01"
  title: string;
  subtitle: string;    // 一句话描述本章目标
  stage: string;       // 所属阶段（数学地基 / 机器学习 / 序列与注意力 / RWKV / 工程实战）
  accent: string;      // 章节主题色（HSL 字符串，用于 UI 点缀）
  lessons: Lesson[];
}
