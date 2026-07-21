import type { Chapter } from '../types';

const r = String.raw;

export const ch10: Chapter = {
  id: 'ch10',
  num: '10',
  title: 'RWKV 版本演进与能力边界',
  subtitle: 'v1 到 v7 的升级路线，以及状态大小的极限思考',
  stage: 'RWKV 理论',
  accent: '150 70% 50%',
  lessons: [
    {
      id: '10-1',
      title: '版本演进：v1 → v7 每一步改了什么',
      minutes: 14,
      blocks: [
        { type: 'text', md: r`RWKV 从 2021 年的 v1 一路演进到 v7（代号 Goose）。理解演进路线能帮你读懂社区代码与论文——你会发现所有改动都在回答同一个问题：**如何让固定大小的状态记住更多、更准。**` },
        { type: 'table', head: ['版本', '年代', '关键改动'], rows: [
          ['v1 ~ v3', '2021-2022', '验证「RNN 化的注意力」可行；确立 R/W/K/V 框架'],
          ['v4 (Dove)', '2023', '确立现代形态：token shift + u 奖励 + 数值稳定递推。本课实现的版本'],
          ['v5 (Eagle)', '2024', '多头化衰减：不同头不同 w，记忆分工；状态改为矩阵，引入类 LRU 的对角化表示'],
          ['v6 (Finch)', '2024', '数据依赖的动态衰减与 token shift（μ、w 随输入变化），记忆更智能'],
          ['v7 (Goose)', '2025', '广义 delta rule：状态可按规则「先擦除再写入」，状态利用率大幅提升'],
        ], caption: '演进主线：状态的「读写规则」越来越精细。' },
        { type: 'callout', variant: 'tip', md: r`教学上我们选择 **v4**：它结构最干净，包含了 RWKV 全部核心思想（衰减、token shift、门控、稳定化），又没有 v5+ 的额外复杂度。掌握 v4 后读 v7 的论文会势如破竹。` },
        { type: 'text', md: r`v5 之后的一个重要视角：把 WKV 状态看成一个小型**键值关联记忆矩阵**，衰减是「遗忘」，新 KV 对是「写入」。v7 的 delta rule 进一步允许模型在写入前**针对性地擦除旧槽位**——这已经接近「可学习的数据库」了。` },
        { type: 'quiz', quiz: {
          question: 'RWKV v1→v7 演进的主线是？',
          options: [
            { text: '把词表越改越大', correct: false },
            { text: '让固定大小状态的读写规则越来越精细，记忆效率越来越高', correct: true },
            { text: '逐步去掉 RNN 成分', correct: false },
            { text: '不断增加层数', correct: false },
          ],
          explanation: '固定状态是 RWKV 的成本优势，也是其容量瓶颈。所有版本升级都在不增加状态大小的前提下，把状态的每一个字节用得更狠。',
        }},
      ],
    },
    {
      id: '10-2',
      title: '状态、成本与长上下文：RWKV 的账本',
      minutes: 13,
      blocks: [
        { type: 'text', md: r`让我们把 RWKV 与 Transformer 的成本算个总账。设序列长 $t$、模型宽 $d$、层数 $L$：` },
        { type: 'table', head: ['指标', 'Transformer`, `RWKV (v4)'], rows: [
          ['训练计算', r`$O(t^2 d)$`, r`$O(t d)$ ✅`],
          ['推理第 t 个 token 的计算', r`$O(t d L)$`, r`$O(d L)$，与 t 无关 ✅`],
          ['推理内存', 'KV cache 随 t 线性增长', '状态 = $L \times (2d + d + d)$ 个浮点数，恒定 ✅'],
          ['长文本上限', '受显存硬约束', '理论上无限长 ✅'],
        ]},
        { type: 'code', title: '算一算：状态到底有多小', code: r`L, d = 24, 2048          # 一个 3B 级 RWKV 的典型尺寸
floats_per_layer = 4 * d   # x_prev + A + B + p（channel-mixing 还有一份 x_prev，近似按 4d 估）
state_floats = L * floats_per_layer
state_mb = state_floats * 2 / 1024**2   # fp16
print(state_floats)        # 196,608 个数
print(f"{state_mb:.2f} MB")  # ≈ 0.38 MB —— 与上下文长度无关！

# 对比：同尺寸 Transformer 处理 128K 上下文的 KV cache 约需数十 GB` },
        { type: 'heading', text: '硬币的另一面：状态容量的天花板' },
        { type: 'text', md: r`诚实地说，固定状态也是局限：Transformer 理论上能从 10 万字前文里精确取出任意一个细节（无损翻书），RWKV 的状态是**有损压缩**，极端精细的「大海捞针」式检索仍是它的弱项（v5-v7 在持续改善）。选型时的判断标准：**长输入、高吞吐、端侧部署 → RWKV 香；极致精确检索 → Transformer 仍占优。**` },
        { type: 'quiz', quiz: {
          question: 'RWKV 推理时显存占用与上下文长度的关系是？',
          options: [
            { text: '线性增长', correct: false },
            { text: '平方增长', correct: false },
            { text: '恒定不变——状态大小只由模型宽度与层数决定', correct: true },
            { text: '先增后减', correct: false },
          ],
          explanation: 'KV cache 不存在了，只有一个固定大小的 (x, A, B, p) 状态在原地滚动更新。这是 RWKV 适合无限长流式推理的根本原因。',
        }},
      ],
    },
  ],
};
