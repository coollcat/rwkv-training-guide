# MAINTENANCE.md — RWKV 研习社维护手册

> 写给后续维护本站的 AI（或人类开发者）。读完这份文档即可在不熟悉代码的情况下安全地扩展课程内容。
> 本站是纯前端静态站（React + TypeScript + Vite + Tailwind + shadcn/ui），**无后端、无数据库**，学习进度存在浏览器 localStorage。

---

## 1. 项目结构地图

```
app/
├── MAINTENANCE.md            ← 本文件
├── index.html                ← 入口（深色主题，lang="zh-CN"）
├── vite.config.ts            ← base 必须为 '/'（否则子路由下资源 404）
└── src/
    ├── App.tsx               ← 路由：/  /lesson/:lessonId  /resources
    ├── index.css             ← 主题变量（深色）+ KaTeX/代码块/排版样式
    ├── data/
    │   ├── types.ts          ← ★ 内容系统核心：Block / Lesson / Chapter / Quiz 类型
    │   ├── curriculum.ts     ← ★ 章节注册表（新增章节在此登记）
    │   ├── papers.ts         ← 论文资料库数据（Resources 页）
    │   └── chapters/
    │       ├── ch00.ts … ch12.ts   ← ★ 全部课程内容，每章一个文件
    ├── components/
    │   ├── LessonRenderer.tsx      ← 把 Block[] 渲染成页面（唯一渲染入口）
    │   ├── CodeBlock.tsx           ← 代码块（自带轻量 Python 高亮）
    │   ├── Quiz.tsx                ← 随堂检测（单选）
    │   ├── Callout.tsx             ← 提示框（info/warn/tip/key 四种）
    │   ├── math/K.tsx              ← KaTeX 封装 + 轻量 Markdown 渲染 renderMd()
    │   ├── layout/AppLayout.tsx    ← 侧边栏目录 + 进度条 + 移动端抽屉
    │   └── interactives/
    │       ├── registry.tsx        ← ★ 交互组件注册表（name → 组件）
    │       ├── plot-utils.ts       ← 共享绘图/数值工具
    │       └── *.tsx               ← 13 个交互实验室组件（含 RosaPlayground）
    ├── hooks/
    │   ├── useProgress.ts          ← 进度持久化（localStorage）
    │   └── ProgressContext.ts      ← 全局进度上下文
    └── pages/
        ├── Home.tsx                ← 首页（Hero + 分阶段章节卡片）
        ├── LessonPage.tsx          ← 课时页（面包屑 + 内容 + 完成标记 + 翻页）
        └── ResourcesPage.tsx       ← 论文资料库
```

★ = 内容扩展时最常触碰的三个文件。

---

## 2. 内容模型（最重要）

**所有课程内容都是声明式的 `Block[]`**，由 `LessonRenderer` 统一渲染。写内容 = 组装 Block，不需要碰任何渲染代码。

### 2.1 Block 类型速查（完整定义见 `src/data/types.ts`）

| Block | 写法 | 说明 |
|---|---|---|
| 段落 | `{ type: 'text', md: r`...` }` | 支持行内公式与轻量 Markdown |
| 小节标题 | `{ type: 'heading', text: '...' }` | 带绿色竖线 |
| 独立公式 | `{ type: 'formula', tex: r`...`, caption: '...' }` | KaTeX display 模式，caption 可省略 |
| 代码 | `{ type: 'code', code: r`...`, title: '...' }` | Python 高亮 + 复制按钮 |
| 提示框 | `{ type: 'callout', variant: 'info'\|'warn'\|'tip'\|'key', title?, md }` | tip=直觉理解，key=核心要点 |
| 列表 | `{ type: 'list', items: [...], ordered? }` | 项内支持行内公式 |
| 表格 | `{ type: 'table', head: [...], rows: [[...]], caption? }` | 单元格支持行内公式 |
| 交互实验室 | `{ type: 'interactive', name: '...', title: '...', desc? }` | name 必须在注册表中 |
| 随堂检测 | `{ type: 'quiz', quiz: {...} }` | 单选，含解析 |

### 2.2 行内 Markdown 语法（text/callout/list/table/quiz 字段通用）

- 行内公式：`$...$`（KaTeX inline）
- 粗体：`**文字**`（渲染为翠绿色）
- 行内代码：`⌈代码⌉`（**请用这个**，不要用反引号——内容字符串都是模板字符串，反引号会截断字面量）
- 强调：`*文字*`（渲染为琥珀色）
- 链接：`[文字](https://...)`

### 2.3 ⚠️ 字符串书写铁律（踩过的坑，务必遵守）

1. **所有内容字符串一律用 `r` 前缀的模板字符串**（文件顶部已定义 `const r = String.raw`），保证 LaTeX 反斜杠原样保留：
   ```ts
   { type: 'text', md: r`点积是 $\mathbf{a} \cdot \mathbf{b}$` }
   ```
2. **内容中禁止出现反引号 ` 和 `${` 序列**——会截断/插值模板字符串。行内代码用 `⌈...⌉` 代替。
3. 不要用 `r'...'` 或 `r"..."`——`String.raw` 只能 tag 模板字符串（反引号）。
4. 代码块内容若含 `'lr'`、`'optimizer'` 这类「字母 r 结尾 + 引号」的字符串，请人工检查，不要用批量正则替换 `r'`（历史上一次批量替换误伤过代码块，教训见 git 记录）。
5. 超长公式用 `\begin{aligned} ... \end{aligned}` 拆行（`\\[6pt]` 换行），防止溢出公式卡片。

---

## 3. 常见维护任务 cookbook

### 3.1 新增一节（最常见）

1. 打开对应章节文件（如 `src/data/chapters/ch09.ts`）。
2. 在 `lessons` 数组中追加一个 Lesson 对象：
   ```ts
   {
     id: '9-5',                    // 全站唯一，格式「章-节」，用于路由和进度
     title: '新课时标题',
     minutes: 15,
     blocks: [ /* 按 2.1 组装 */ ],
   }
   ```
3. 完成。侧边栏、首页卡片、翻页、进度统计**全自动更新**，无需改其他任何文件。

### 3.2 新增一章

1. 新建 `src/data/chapters/chNN.ts`，仿照现有章节导出 `Chapter` 对象（`stage` 字段决定它出现在首页哪个阶段分组下，可复用现有五个阶段或新增）。
2. 在 `src/data/curriculum.ts` 中 import 并加入 `CURRICULUM` 数组（**数组顺序即学习顺序**）。
3. 若新增 `stage` 名，需同步修改 `src/pages/Home.tsx` 的 `STAGES` 常量。

### 3.3 新增一个交互实验室

1. 在 `src/components/interactives/` 新建组件（默认导出）。可复用 `plot-utils.ts` 的工具（采样折线、坐标映射、seededRandom、softmax、fmt、heatColor）。
2. 在 `src/data/types.ts` 的 `InteractiveName` 联合类型中加入新名字。
3. 在 `src/components/interactives/registry.tsx` 的 `INTERACTIVES` 中注册。
4. 在任意课时的 blocks 里引用：`{ type: 'interactive', name: '新名字', title: '...', desc: '...' }`。

交互组件约定：
- 用 shadcn 的 `Slider`/`Button`/`Switch`（`@/components/ui/...`）+ 内联 SVG 绘图，不引入新图表库；
- 面板容器由 `LessonRenderer` 统一提供（`.lab-panel`），组件内部不要再套大边框；
- 所有随机性用 `seededRandom(固定种子)`，保证每次渲染一致；
- 优先做单文件、零外部依赖、可拖可点的「公式玩具」。

### 3.4 增删论文/资料

编辑 `src/data/papers.ts` 的 `PAPERS` 数组。`tag` 只能是 `'RWKV' | '前置必读' | '代码仓库' | '进阶'`（配色在 `ResourcesPage.tsx` 的 `TAG_STYLE`）。

### 3.5 修改主题

改 `src/index.css` 顶部 `:root` 的 HSL 变量。章节点缀色在各 chapter 文件的 `accent` 字段（HSL 字符串）。

---

## 4. 构建与验证

```bash
cd /mnt/agents/output/app
npm install        # 首次或依赖变更后
npm run build      # 产物在 dist/
npx vite preview --port 4173   # 本地预览构建产物
```

**提交前验收清单：**
- [ ] `npm run build` 零 error（TS 错误一个都不能留）
- [ ] 新开浏览器会话访问**子路由**（如 `/lesson/9-2`）不白屏（验证 base='/' 未被改回）
- [ ] 至少点开一个含交互实验室、一个含代码块、一个含测验的课时目检
- [ ] 测验点击后能正确判定并显示解析
- [ ] 「标记完成」后首页进度数字更新
- [ ] 新增长公式在卡片内不溢出（溢出就改 aligned 拆行）

---

## 5. 架构决策记录（为什么这样设计）

| 决策 | 理由 |
|---|---|
| 内容即数据（Block[]） | 让内容扩展零渲染层改动；AI 维护时只需写数据文件 |
| 每章一个 TS 文件 | 单文件 < 30KB，便于 AI 整体读写；避免巨型 JSON |
| `String.raw` 模板字符串 | LaTeX 反斜杠原样保留，免除双重转义 |
| `⌈⌉` 替代反引号行内代码 | 与模板字符串共存（见 2.3-2） |
| localStorage 进度 | 无后端的最简方案；key 带版本号 `rwkv-course-progress-v1`，改结构时递增 |
| 自写代码高亮（~40 行） | 避免引入 prismjs/highlight.js 增加 200KB 包体积 |
| base='/' | 支持子路由直接访问/刷新（vite preview 与静态托管均按 SPA 回退处理） |
| 交互组件固定种子伪随机 | 教学演示可复现，避免每次渲染数值跳动 |

## 6. 已知边界与 roadmap 建议

- 移动端为可用级（抽屉式目录），**PC 体验优先**——新交互请保证桌面端鼠标可操作。
- 无搜索功能；如需全文搜索，建议构建期从 `curriculum.ts` 生成索引，不要引入服务端。
- 无黑暗/明亮双主题（纯深色），加双主题需重写 `index.css` 变量层。
- 内容深度边界：RWKV v4 为主（教学最优版本），v5+ 只做演进综述。若要加 v7 delta rule 的完整推导，建议新开一章而非改动 ch09。
