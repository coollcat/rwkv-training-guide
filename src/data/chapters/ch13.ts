import type { Chapter } from '../types';

const r = String.raw;

export const ch13: Chapter = {
  id: 'ch13',
  num: '13',
  title: '前沿探索：RWKV-8、无限上下文与多模态',
  subtitle: 'DeepEmbed、ROSA 符号机制、infctx 与 RWKV 的模态扩张',
  stage: '前沿视野',
  accent: '55 90% 58%',
  lessons: [
    {
      id: '13-1',
      title: 'RWKV-8（Heron）：DeepEmbed 与混合架构',
      minutes: 16,
      blocks: [
        { type: 'text', md: r`第 10 章的演进表止步于 v7。2025 年起，RWKV-8（代号 **Heron**，鹭——H 是第 8 个字母）以一种新节奏登场：**它不是一次性的架构发布，而是一系列可插拔新特性的合集**，逐个公布、逐个验证。截至目前的三大特性：**DeepEmbed、DeepEmbedAttention（DEA）、ROSA**。本节讲前两个，ROSA 分量太重，留给下一节。` },
        { type: 'callout', variant: 'info', md: r`以下特性来自 RWKV 官方 Wiki 与彭博的公开分享，属于**快速演进的活跃研究前沿**。阅读时注意时效，以官方仓库 RWKV-v8 目录为最终事实来源。` },
        { type: 'heading', text: 'DeepEmbed：不占显存的「免费」知识库' },
        { type: 'text', md: r`动机来自 MoE 的困境：混合专家模型靠稀疏激活获得大容量，但**全部专家都必须住进显存**——端侧设备根本装不下。DeepEmbed（2025 年 5 月公布）的思路：在每一层 FFN 中，**为词表中的每个 token 训练一个可学习向量**。推理时按当前 token 的 id 查表，对 FFN 输出做逐通道乘性调制：` },
        { type: 'code', title: 'DeepEmbed：改两行代码的稀疏化', code: r`# 原始 ReLU² FFN（你在 11-3 写的 ChannelMixing 就是它）
x = torch.relu(self.key(x)) ** 2
return self.value(x)

# DeepEmbed_1x：多一张 embedding 表 + 一次逐通道乘法
self.deepemb = nn.Embedding(d_vocab, d_emb)
...
x = torch.relu(self.key(x)) ** 2
return self.value(x) * self.deepemb(idx)   # idx 是当前 token 的 id` },
        { type: 'text', md: r`关键点：**查表操作不吃显存**。这些向量可以存在内存甚至 SSD 里，用 mmap 按需加载——每个 token 只引入几十 KB 的额外访存。于是模型获得了一个「规模庞大但稀疏的知识库」，参数层面接近免费，却可以像 MoE 一样按 token 调用专门的知识。词表很大时还可叠加 LoRA 降开销，甚至引入 bigram/trigram 表增强词组建模。` },
        { type: 'callout', variant: 'tip', md: r`对比你在第 11 章写的 embedding 层：⌈nn.Embedding⌉ 本来就是一次查表。DeepEmbed 的洞察是——**查表是全神经网络里最便宜的操作，可以奢侈地用**：不止输入端查一次，每一层都可以查。` },
        { type: 'heading', text: 'DeepEmbedAttention（DEA）：为混合架构而生' },
        { type: 'text', md: r`2025 年 6 月公布的 DEA 把 DeepEmbed 的思路延伸到注意力侧：一种**KV 缓存极小**的注意力变体。纯 RNN 模型在超长上下文的精确检索上有短板（第 10 章说过），DEA 让「RWKV + 少量注意力层」的**混合模型**（如 RWKV-7s 混合版）能把长上下文能力补齐到 Transformer 水准，同时付出的 KV cache 代价远低于标准注意力。这也是当前业界的共识路线：纯线性 or 纯注意力都不如按需混合。` },
        { type: 'table', head: ['特性', '公布时间', '一句话本质', '解决什么'], rows: [
          ['DeepEmbed', '2025-05', '每层 FFN 按 token 查表做乘性调制', 'MoE 级知识容量，端侧可部署'],
          ['DEA', '2025-06', 'DeepEmbed 思路的注意力变体', '混合模型的极小 KV cache'],
          ['ROSA', '2025-10', '后缀自动机符号检索（下一节）', '无限长无损召回'],
        ]},
        { type: 'quiz', quiz: {
          question: 'DeepEmbed 声称「不占显存」的根本原因是？',
          options: [
            { text: '它把参数压缩成了 1-bit', correct: false },
            { text: 'embedding 查表可按需从 RAM/SSD 加载，每个 token 只需预读极少量参数', correct: true },
            { text: '它删除了 FFN 层', correct: false },
            { text: '它把计算移到了 CPU', correct: false },
          ],
          explanation: '查表只需取出当前 token 对应的一行（几十 KB），其余向量躺在内存/硬盘里。这是与 MoE「全部专家驻留显存」的本质区别。',
        }},
      ],
    },
    {
      id: '13-2',
      title: 'ROSA 与「二进制思考」：模型发明的内部符号语言',
      minutes: 18,
      blocks: [
        { type: 'text', md: r`2025 年 10 月，RWKV-8 放出了迄今最大胆的特性：**ROSA（Rapid Online Suffix Automaton，快速在线后缀自动机，代号蔷薇）**——一个旨在**取代注意力机制**的神经符号信息传播器。它的口号是「**永不遗忘，永能召回**」。` },
        { type: 'heading', text: '规则：一条初中生能懂的检索' },
        { type: 'text', md: r`ROSA 的核心规则简单得不像深度学习。处理到位置 $i$ 时：**在历史中寻找「与当前后缀相同的最长片段」，输出它后面跟着的那个 token**；找不到就输出一个「无匹配」标记：` },
        { type: 'formula', tex: r`y_i = \begin{cases} x_{j+1}, & \text{若历史中存在与当前后缀匹配的最长片段（取最近的一次）} \\ \bot, & \text{无匹配} \end{cases}`, caption: 'ROSA 的教学简化版规则。底层用经典的后缀自动机（Suffix Automaton）数据结构实现「在线」增量检索。' },
        { type: 'interactive', name: 'rosa-playground', title: 'ROSA 后缀匹配实验室', desc: '输入一段序列，逐步看 ROSA 如何在历史里找最长重复模式并预测下一个符号。' },
        { type: 'text', md: r`注意它和 WKV 的互补关系：WKV 的状态是**有损压缩**（模糊记得），ROSA 是**无损检索**（精确召回重复模式）。推理时 ROSA 不需要 KV cache，只需缓存与输入序列对应的 ⌈rosa_token_id⌉——时空复杂度都极低，CPU 上都能高效并行。` },
        { type: 'heading', text: '「二进制思考」：离散符号的回归' },
        { type: 'text', md: r`社区把 ROSA 称为 RWKV 的「二进制思考」，有两层含义。其一，ROSA 的运算是**离散的**：匹配/不匹配、是这个符号或不是——是 0/1 式的符号判断，而非连续向量运算（社区甚至有专门的 1bit 形式可视化工具）。其二，更惊人的发现是：多层堆叠 ROSA 后，**模型会在层与层之间自动发明一种内部符号语言**来传递匹配信息——一种人类读不懂、但模型自己用来「思考」的编码。` },
        { type: 'callout', variant: 'key', md: r`这条路线与 BitNet 代表的「权重低比特化」（1.58bit：权重取 {-1, 0, +1}，配合直通估计器 STE 训练）共同指向同一个趋势：**用最少的比特完成推理**。一个离散化「思考过程」，一个离散化「参数本身」。对恒定状态、低功耗取向的 RWKV 来说，两者都是端侧部署的天然盟友。` },
        { type: 'heading', text: '效果与生态' },
        { type: 'list', items: [
          r`*小参数解难题**：RWKV-7 + ROSA 仅 1.1M 参数（4 层 128 宽）做 40 位随机数加减法，无 CoT 直出答案，数字准确率 99%，训练曲线出现两次 grokking 顿悟；39564 个参数即可 99.8% 准确率颠倒 60 位数字序列`,
          r`*可堆叠**：多层 ROSA 直接可 scale，堆得越多越强`,
          r`*ROSA-Tuning**：让任意现成 LLM（如 Qwen3）用滑动窗口注意力 + ROSA 处理任意长输入，性能反超完整全局注意力`,
          r`*rosa_soft**：端到端可微实现——前向执行离散 Hard ROSA，反向用 Suffix Attention（SUFA）做梯度代理`,
          r`区另有 rosa-plus、RASP 等第三方实现涌现`,
        ]},
        { type: 'quiz', quiz: {
          question: 'ROSA 与 WKV 状态在「记忆」上的根本区别是？',
          options: [
            { text: 'ROSA 更省显存', correct: false },
            { text: 'WKV 是有损压缩的连续状态，ROSA 是对重复模式的无损符号检索', correct: true },
            { text: 'ROSA 需要更大的词表', correct: false },
            { text: 'WKV 不能并行训练', correct: false },
          ],
          explanation: '两者互补：WKV 记「模糊的印象」，ROSA 精确召回「历史上重复出现过的模式」。无 KV cache、无点积 softmax 是 ROSA 的工程红利。',
        }},
      ],
    },
    {
      id: '13-3',
      title: '无限上下文：理想、现实与 infctx 训练',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`「RWKV 支持无限上下文」——这句话对了一半。彭博本人的原话更严谨：**理论上上下文长度无限；实际上受限于训练时的上下文长度、数值精度和隐藏状态大小**。超出训练长度的文本，性能会逐渐下降。这一节把「无限」拆开讲清楚。` },
        { type: 'heading', text: '三道现实的天花板' },
        { type: 'list', ordered: true, items: [
          r`*训练长度**：模型只见过 4K 长度的训练序列，外推到 100K 时衰减通道的时间尺度会失配——就像只短跑过的人去跑马拉松。`,
          r`*数值精度**：WKV 的累加器 A、B 在超长序列上持续累乘累加，浮点误差缓慢积累。9-4 的 (A,B,p) 技巧能缓解但不能根除。`,
          r`*状态容量**：固定大小的状态终究是有损压缩（第 10 章），LooGLE、RULER 等长文基准显示，超长上下文中 RWKV 的精确检索能力仍会衰减——诚实面对，这正是 v8 要解决的问题。`,
        ]},
        { type: 'heading', text: 'infctx：用 BPTT 把训练长度也拉到「无限」' },
        { type: 'text', md: r`既然第一道天花板是训练长度，那就直接训长序列。RWKV 社区的 **infctx 训练器**利用 RNN 的天性：**沿时间轴做梯度检查点**——把超长序列切成段，每段只存状态不存中间激活，反向时重算（两次前向换显存）。效果：` },
        { type: 'table', head: ['指标', 'infctx 的表现'], rows: [
          ['显存增长', '7B 模型每增加 1024~2048 token 仅增约 2MB'],
          ['可训长度', '超过 100 万 token 的序列'],
          ['代价', '两次前向传播（计算换显存）'],
          ['实践技巧', '上下文 warmup：从 4K 起步用 200 步逐渐拉到目标长度'],
        ]},
        { type: 'callout', variant: 'tip', md: r`对比第 4 章「前向存什么，反向用什么」：梯度检查点是对同一原理的反向利用——**不存中间值，反向时重算**。RNN 结构让切段重算的边界恰好是状态向量，天然干净。` },
        { type: 'heading', text: '三种记忆方案的终局对比' },
        { type: 'table', head: ['方案', '信息保真', '内存随长度', '代表'], rows: [
          ['KV cache（Transformer）', '无损翻书', '线性增长 ⚠️', 'GPT 系列'],
          ['WKV 状态（RWKV v4-v7）', '有损压缩', '恒定 ✅', '本课实现的架构'],
          ['ROSA 符号检索（RWKV-8）', '对重复模式无损', '极低（token id）', 'RWKV-8 Heron'],
        ], caption: 'RWKV 的演进方向：用 ROSA 补无损召回，用 infctx 补训练长度，一步步逼近真正的「无限」。'},
        { type: 'quiz', quiz: {
          question: 'infctx 训练器能训超长序列的核心技术是？',
          options: [
            { text: '把词表变小了', correct: false },
            { text: '沿时间轴做梯度检查点：只存状态、反向时重算中间激活，以两次前向换显存', correct: true },
            { text: '使用了更大的 GPU', correct: false },
            { text: '去掉了反向传播', correct: false },
          ],
          explanation: 'RNN 的分段边界就是状态向量，切段重算天然成立。这是「训练像 Transformer、推理像 RNN」之外的第三重红利：长序列训练显存近恒定。',
        }},
      ],
    },
    {
      id: '13-4',
      title: '多模态 RWKV：从文本到万物',
      minutes: 17,
      blocks: [
        { type: 'text', md: r`RWKV 的线性成本 + 恒定内存 + 流式处理，对**长序列模态**（高清图像、视频、音频、点云）吸引力巨大——这些模态的 token 数动辄上万，Transformer 的平方税在这里最疼。于是 RWKV 迅速长出庞大的多模态生态。` },
        { type: 'heading', text: '视觉：把图像当长序列读' },
        { type: 'table', head: ['工作', '任务', 'RWKV 的改动/收益'], rows: [
          ['Vision-RWKV', '通用视觉骨干', '把 WKV 扩展到 2D 扫描方向'],
          ['RWKV-SAM', '图像分割', '比 Transformer 版快 2 倍以上且精度更好'],
          ['Restore-RWKV', '医学图像修复', 'Re-WKV 循环注意力 + Omni-Shift 全向位移（首个医学修复 RWKV）'],
          ['PointRWKV', '3D 点云', '比 Transformer/Mamba 同类节省约 46% FLOPS'],
          ['Hi-RWKV', '高光谱分类', '分层建模，发表于 IEEE TIP'],
        ]},
        { type: 'text', md: r`视觉化的共同手术：把「单向时间衰减」改造成**多方向空间扫描**（上下左右各扫一遍再融合），把 token shift 改造成**邻域位移**。你在第 9 章学的每个零件都有空间版对应物。` },
        { type: 'heading', text: '视觉-语言与音频' },
        { type: 'list', items: [
          r`*RWKV-CLIP**（格灵深瞳）：RWKV 驱动的视觉-语言对比学习，跨模态对齐优于同类`,
          r`*VisualRWKV**：CLIP 视觉编码器 + Eagle 语言模型，走 LLaVA 式两阶段指令微调，小模型打出越级表现`,
          r`*RWKV-Transducer**：流式语音识别（ASR），准确率有竞争力且延迟与内存更低`,
          r`*音乐**：Eagle/Finch 论文内置音乐建模实验（ABC 乐谱）；社区有 MIDI 生成、音乐分类等完整应用`,
          r`*视频**：MG-RWKV 做时序伪造定位（O(T) 全序列处理）、视频事件边界描述（IEEE TMM）`,
        ]},
        { type: 'heading', text: '超越语言模型：决策、科学与硬件' },
        { type: 'list', items: [
          r`*多智能体强化学习**：斯坦福团队用 RWKV 玩《Among Us》——单局轨迹数万 token，Transformer 显存吃不消，RWKV 靠 T-BPTT 在单张 A40 上训完（AAMAS 2025 口头报告）`,
          r`*机器人**：Decision-RWKV 把 RWKV 用作终身学习的决策骨干`,
          r`*科学计算**：1.5B 的 RWKV-7 被微调为自回归神经量子态（NQS），用序列建模能力表示量子波函数`,
          r`*硬件**：HFRWKV 全片上加速器——RWKV「只做矩阵乘向量、无 KV cache」的特性对芯片极其友好`,
          r`*双向变体**：Bi-RWKV 用双向 Time-Mixing 做理解类任务，推理提速 1.95 倍`,
        ]},
        { type: 'callout', variant: 'key', md: r`纵观整个生态，规律很清晰：**凡是「序列超长、资源受限、需要流式」的场景，就有 RWKV 的身影**。你在这门课学的 WKV/token shift/门控三件套，正是这套生态的共同语言。至此，课程的全部内容结束了——从 $\nabla L$ 到 RWKV-8 的符号语言，你已经走完了全程。` },
        { type: 'quiz', quiz: {
          question: '把 RWKV 从文本迁移到图像时，最核心的结构改造是？',
          options: [
            { text: '换掉所有 LayerNorm', correct: false },
            { text: '把单向时间衰减改为多方向空间扫描，token shift 改为邻域位移', correct: true },
            { text: '把词表扩大到像素数', correct: false },
            { text: '必须使用 Transformer 作为骨干', correct: false },
          ],
          explanation: '文本是一维单向的，图像是二维无向的。Vision-RWKV、Restore-RWKV 等工作都是围绕「多方向扫描 + 全向位移」做文章，WKV 本体原样保留。',
        }},
      ],
    },
  ],
};
