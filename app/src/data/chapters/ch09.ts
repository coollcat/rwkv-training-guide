import type { Chapter } from '../types';

const r = String.raw;

export const ch09: Chapter = {
  id: 'ch09',
  num: '09',
  title: 'RWKV 核心原理',
  subtitle: 'WKV、Time-Mixing、Channel-Mixing——把公式拆到骨头里',
  stage: 'RWKV 理论',
  accent: '160 84% 45%',
  lessons: [
    {
      id: '9-1',
      title: 'RWKV 的设计哲学：RNN 与 Transformer 的孩子',
      minutes: 16,
      blocks: [
        { type: 'text', md: r`回顾第 8 章的矛盾：Transformer 检索历史能力强但成本随长度增长；RNN 状态恒定但记忆有损。RWKV 的破局点来自对 softmax 注意力的一个深刻观察：**如果把「两两比较」换成「带时间衰减的累加」，注意力就能写成递推形式。**` },
        { type: 'heading', text: '从注意力到线性注意力' },
        { type: 'formula', tex: r`o_t = \sum_{i=1}^{t} \frac{e^{q_t k_i}}{\sum_j e^{q_t k_j}} v_i`, caption: '标准注意力：每个 t 都要与所有 i 两两比较，O(t²)。' },
        { type: 'text', md: r`RWKV 抛弃了 query，改用一条规则：**越近的历史记得越牢，越远的历史指数衰减**——衰减因子 $e^{-w(t-i)}$ 直接代替了「q 与 k 的相似度」。于是输出变成：` },
        { type: 'formula', tex: r`wkv_t = \frac{\displaystyle\sum_{i=1}^{t-1} e^{-(t-1-i)w + k_i}\, v_i \;+\; e^{u + k_t}\, v_t}{\displaystyle\sum_{i=1}^{t-1} e^{-(t-1-i)w + k_i} \;+\; e^{u + k_t}}`, caption: 'RWKV-4 的 WKV 公式。w 是逐通道衰减率（W），u 是给当前 token 的额外奖励。' },
        { type: 'callout', variant: 'key', md: r`和 softmax 注意力对比着读：分母同样是归一化项；分子同样是「权重 × value 的累加」。唯一的区别是**权重的来源**——不再逐对计算相似度，而是用「指数衰减 + key 强度」。正是这个改动，让分式里的和可以递推维护（下一节证明），O(t²) 变成 O(t)。` },
        { type: 'text', md: r`名字的含义至此全部揭晓：**R**eceptance（接受度，门控输出）、**W**eight（时间衰减权重）、**K**ey（信息强度）、**V**alue（信息内容）。四个字母，每个都是公式里的一个符号。` },
        { type: 'quiz', quiz: {
          question: 'RWKV 相对 Transformer 的关键改动是？',
          options: [
            { text: '去掉了所有矩阵乘法', correct: false },
            { text: '用「指数时间衰减 + key 强度」代替逐对的 Q·K 相似度，使注意力可递推', correct: true },
            { text: '把词表变小了', correct: false },
            { text: '不再使用 softmax', correct: false },
          ],
          explanation: '逐对比较 → 规则化衰减，这是 O(t²) 变 O(t) 的唯一来源。分母归一化、加权求 value 的骨架与注意力完全一致。',
        }},
      ],
    },
    {
      id: '9-2',
      title: 'Time-Mixing 详解：一块积木的完整解剖',
      minutes: 20,
      blocks: [
        { type: 'text', md: r`Time-Mixing 是 RWKV 的「注意力层」，负责沿时间轴混合信息。它有三个零件：**Token Shift、WKV、Receptance 门**。我们逐个拆开。` },
        { type: 'heading', text: '零件一：Token Shift（当前与上一刻的插值）' },
        { type: 'formula', tex: r`r = W_r \big(\mu_r \odot x_t + (1-\mu_r) \odot x_{t-1}\big), \quad k, v \text{ 同理}`, caption: 'μ 是逐通道可学习参数。r/k/v 各自拥有一套 μ，自由决定「多看现在还是多看过去」。' },
        { type: 'text', md: r`这个小技巧（lerp，线性插值）让每个通道都能感知「刚刚发生了什么」，弥补状态压缩丢失的局部细节。注意：序列开头需要一个初始的 $x_0$——这就是 RWKV 状态的第一部分，推理时必须随身携带。` },
        { type: 'heading', text: '零件二：WKV——两种写法，一个东西' },
        { type: 'formula', tex: r`\begin{aligned} wkv_t &= \frac{A_t + e^{u+k_t}\, v_t}{B_t + e^{u+k_t}} \\[6pt] A_t &= e^{-w} A_{t-1} + e^{k_t} v_t, \qquad B_t = e^{-w} B_{t-1} + e^{k_t} \end{aligned}`, caption: '递推形式：只需维护两个累加器 A（分子记忆）、B（分母记忆）。与 9-1 的求和形式严格等价。' },
        { type: 'callout', variant: 'tip', md: r`为什么等价？把求和形式拆开看：第 $t$ 步时，昨天所有项的衰减因子整体多乘一个 $e^{-w}$——这正是「旧累加器乘 $e^{-w}$」。当前项单独享受 $e^{u}$ 的奖励。**衰减整体复用，新信息增量写入**——这就是把 O(t²) 变 O(t) 的魔术。` },
        { type: 'interactive', name: 'wkv-stepper', title: 'WKV 递推实验室', desc: '一步一步推进时间，亲眼看 A、B 两个状态如何承载全部历史。' },
        { type: 'heading', text: '零件三：Receptance 门控与输出投影' },
        { type: 'formula', tex: r`o_t = W_o \big(\sigma(r_t) \odot wkv_t\big)`, caption: 'σ(r) 是 sigmoid 门：r 决定「这一时刻的信息放多少出去」。最后 W_o 投影回 d 维。' },
        { type: 'interactive', name: 'time-mixing-lab', title: 'Time-Mixing 单通道全程实验室', desc: '从 token shift 到门控输出，全链路拖参数看数值。' },
        { type: 'quiz', quiz: {
          question: 'RWKV 推理时需要携带的 Time-Mixing 状态包括？',
          options: [
            { text: '全部历史 token 的 KV 缓存', correct: false },
            { text: '上一个输入 x_{t−1}、累加器 A、累加器 B（都是固定大小）', correct: true },
            { text: '完整的注意力矩阵', correct: false },
            { text: '所有层的输出', correct: false },
          ],
          explanation: '状态只有 (x_prev, A, B)，大小只取决于模型宽度，与已读长度无关——这是 RWKV 推理成本恒定的根源。',
        }},
      ],
    },
    {
      id: '9-3',
      title: 'Channel-Mixing 与 Block 整体结构',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`Time-Mixing 沿**时间轴**搅拌信息；Channel-Mixing 沿**特征轴**（通道）搅拌信息，扮演 Transformer 中 MLP 的角色。它同样用了 token shift 和门控。` },
        { type: 'formula', tex: r`k = W_k(\mu_k \odot x_t + (1-\mu_k) \odot x_{t-1}), \quad r = W_r(\text{同样插值})`, caption: '第一步：token shift 后投影。k 被放大到 4d 维（信息展开），r 保持在 d 维做门。' },
        { type: 'formula', tex: r`o = \sigma(r) \odot W_v \big(\max(k, 0)^2\big)`, caption: '平方 ReLU：max(k,0)²。平方让强信号更强，近似「通道间的注意力」。' },
        { type: 'heading', text: '组装一个 RWKV Block' },
        { type: 'code', title: 'RWKV Block 的数据流（对应第 11 章的真实代码）', code: r`def block(x, state):
    # x: (t, d)   state: 本层的全部 RNN 状态
    x = x + time_mixing(layer_norm1(x), state)    # 沿时间轴混合 + 残差
    x = x + channel_mixing(layer_norm2(x), state) # 沿通道轴混合 + 残差
    return x

# 完整模型：embedding → L 个 block → LayerNorm → 投影到词表
def rwkv(tokens, states):
    x = embed[tokens]                 # 查表（第 7 章）
    for layer in layers:
        x = block(x, states[layer])   # L 层堆叠
    logits = head(layer_norm_f(x))    # (t, V)
    return logits` },
        { type: 'callout', variant: 'key', md: r`对比 Transformer block（第 8 章）：骨架一模一样——LN、残差、两个小模块。**RWKV 的创新全部集中在 time_mixing 内部**。这意味着你已经学过的 LayerNorm、残差、embedding、输出头，全部原样复用。` },
        { type: 'text', md: r`**LayerNorm**（层归一化）这里补一句：它把每个位置的特征向量归一化到均值 0、方差 1，再缩放平移。作用是让几十层堆叠时信号尺度稳定，训练不炸。公式：$\mathrm{LN}(x) = \gamma \odot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta$。` },
        { type: 'quiz', quiz: {
          question: 'Channel-Mixing 中平方 ReLU（max(k,0)²）的作用是？',
          options: [
            { text: '节省显存', correct: false },
            { text: '非线性放大强激活，形成通道间的相对竞争，增强表达能力', correct: true },
            { text: '让梯度为零', correct: false },
            { text: '替代 LayerNorm', correct: false },
          ],
          explanation: '平方让「大者更大」，效果接近 softmax 的尖锐化但无需归一化分母。RWKV 论文用它在小改动下显著提升了表现。',
        }},
      ],
    },
    {
      id: '9-4',
      title: '数值稳定与并行化：从公式到能跑的算法',
      minutes: 16,
      blocks: [
        { type: 'text', md: r`9-2 的递推式直接写代码会出事：$e^{k_t}$ 的 $k$ 稍大就溢出（第 4 章的数值稳定课派上用场了）。RWKV 的解法和 softmax 减最大值一脉相承——**状态里多存一个「目前见过的最大指数」p**：` },
        { type: 'formula', tex: r`A_t = e^{-w + p_{t-1} - p_t} A_{t-1} + e^{k_t - p_t} v_t, \qquad p_t = \max(p_{t-1} - w,\ k_t)`, caption: '把 A、B 里的公共大指数 p 提出来单存。所有 e 的指数都减去 p，永远 ≤ 0，绝不溢出。' },
        { type: 'callout', variant: 'warn', md: r`所以 RWKV 每个通道的 Time-Mixing 状态其实是**三个数**：(A, B, p)，外加 token shift 用的 $x_{t-1}$。第 11 章写推理代码时你会亲手维护它们。` },
        { type: 'heading', text: '训练时如何并行：WKV 的求和形式再就业' },
        { type: 'text', md: r`递推形式推理省内存，但逐 token 串行没法用满 GPU。训练时的技巧：回到**求和形式**，把整个序列的 WKV 用并行前缀和（或分块 chunkwise）一次算完——数学上与递推完全等价，工程上吃满并行。这就是「训练像 Transformer，推理像 RNN」的真正含义。` },
        { type: 'table', head: ['阶段', '使用的形式', '计算模式', '复杂度'], rows: [
          ['训练', '求和形式（并行扫描）', '全序列并行', r`$O(t \cdot d)$`],
          ['推理', '递推形式（RNN 模式）', '逐 token，O(1) 状态', r`$O(d)$ 每步`],
        ]},
        { type: 'callout', variant: 'tip', md: r`第 11 章我们的教学框架在 GPU 上直接用「递推循环 + 向量化通道」写训练前向（清晰优先，性能够用）；官方实现则用 CUDA kernel 做并行扫描。原理相同，优化程度不同——先理解，再优化。` },
        { type: 'quiz', quiz: {
          question: 'RWKV 数值稳定技巧与哪个经典技巧思想相同？',
          options: [
            { text: '梯度裁剪', correct: false },
            { text: 'softmax 的减最大值技巧：把公共大指数提出去，保证 e 的指数 ≤ 0', correct: true },
            { text: '权重初始化', correct: false },
            { text: 'Dropout', correct: false },
          ],
          explanation: '都是「数学恒等变换 + 数值安全」的白嫖操作。你在第 4 章学的 softmax 技巧，正是 RWKV 状态设计里 (A, B, p) 三元组的原型。',
        }},
      ],
    },
  ],
};
