import type { Chapter } from '../types';

const r = String.raw;

export const ch08: Chapter = {
  id: 'ch08',
  num: '08',
  title: '注意力机制：直接检索历史',
  subtitle: 'Q·K·V 的直觉、Transformer 架构与它的平方代价',
  stage: '序列与注意力',
  accent: '280 80% 62%',
  lessons: [
    {
      id: '8-1',
      title: '注意力：一次可学习的「查字典」',
      minutes: 17,
      blocks: [
        { type: 'text', md: r`注意力的思想可以一句话说清：**每个位置都喊一声「我要找什么」（Query），每个历史位置都举着「我是什么」（Key）和「我装着什么」（Value）两块牌子；Query 和每个 Key 算相似度，归一化成权重，对 Value 加权求和。**` },
        { type: 'formula', tex: r`\mathrm{Attention}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) = \mathrm{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^\top}{\sqrt{d_k}}\right)\mathbf{V}`, caption: '深度学习史上最著名的公式之一。' },
        { type: 'list', items: [
          r`$\mathbf{Q}\mathbf{K}^\top$：每个 query 与每个 key 的点积相似度，得到 $t \times t$ 的分数矩阵（第 1 章：点积 = 相似度）`,
          r`$\sqrt{d_k}$：除以维度平方根，防止点积随维度增大而爆炸（维度越高，随机向量点积越大）`,
          r`$\mathrm{softmax}$：逐行归一化，每行是一个合法的概率分布（第 3 章）`,
          r`乘 $\mathbf{V}$：按权重对历史信息加权平均——**检索完成**`,
        ]},
        { type: 'callout', variant: 'tip', md: r`对比 RNN：RNN 把历史压缩进一个向量（有损）；注意力保留全部历史，用时直接查（无损但成本高）。一个是「凭记忆回答」，一个是「翻书回答」。` },
        { type: 'interactive', name: 'attention-heatmap', title: '注意力热力图', desc: '输入一句话，看每个字把注意力分给谁；切换因果掩码体验「不许看未来」。' },
        { type: 'quiz', quiz: {
          question: r`为什么要除以 $\sqrt{d_k}$？`,
          options: [
            { text: '让计算更快', correct: false },
            { text: '防止高维下点积过大，把 softmax 推进饱和区导致梯度消失', correct: true },
            { text: '让矩阵可以相乘', correct: false },
            { text: '归一化词向量长度', correct: false },
          ],
          explanation: r`维度 $d_k$ 的随机向量点积的方差正比于 $d_k$。不缩放的话分数动辄几十，softmax 输出接近 one-hot，梯度≈0。`,
        }},
      ],
    },
    {
      id: '8-2',
      title: '多头注意力、因果掩码与位置编码',
      minutes: 15,
      blocks: [
        { type: 'heading', text: '多头：同时从多个视角看' },
        { type: 'text', md: r`一组 Q/K/V 只能学一种「相似度」。**多头注意力**把维度切成 $h$ 份，每份独立做一次注意力（叫一个**头**），最后拼接投影。有的头学语法搭配，有的头学指代关系，有的头盯位置邻近——模型自动分工。` },
        { type: 'formula', tex: r`\mathrm{MultiHead} = \mathrm{Concat}(\mathrm{head}_1, \dots, \mathrm{head}_h)\,\mathbf{W}^O`, caption: 'h 个头并行计算再拼接。RWKV v5 之后的「多头化」正是借鉴于此。' },
        { type: 'heading', text: '因果掩码：不许偷看未来' },
        { type: 'text', md: r`训练生成模型时整段文本是已知的，但预测第 $t$ 个词时绝不能用第 $t+1$ 个词——否则考试作弊。做法：把分数矩阵的**上三角全部置为 $-\infty$**，softmax 后正好为 0。这就是你在热力图实验里看到的右上角空白。` },
        { type: 'heading', text: '位置编码：注意力不认顺序' },
        { type: 'text', md: r`点积相似度对顺序是盲的——「猫吃鱼」和「鱼吃猫」的注意力矩阵一模一样。必须额外注入位置信息：Transformer 用正弦/可学习的**位置编码**加到 embedding 上。` },
        { type: 'callout', variant: 'key', md: r`注意这个「补丁」：注意力本身没有位置感。**RWKV 的回应极为优雅——它的衰减项 $e^{-w\Delta t}$ 天然就是位置编码**：越远的历史衰减越多。不需要额外机制，位置感长在结构里。第 9 章见分晓。` },
        { type: 'quiz', quiz: {
          question: '训练因果语言模型时，因果掩码的作用是？',
          options: [
            { text: '加速矩阵乘法', correct: false },
            { text: '阻止每个位置看到未来的 token，保证训练与推理条件一致', correct: true },
            { text: '减少参数量', correct: false },
            { text: '让梯度更稳定', correct: false },
          ],
          explanation: '掩码把位置 i 对 j>i 的注意力权重清零。没有它，模型训练时偷看答案，推理时立刻露馅。',
        }},
      ],
    },
    {
      id: '8-3',
      title: 'Transformer 全景与它的平方税',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`2017 年《Attention Is All You Need》把上述零件组装成 **Transformer**：词嵌入 + 位置编码，然后堆叠 $L$ 个 block，每个 block = 多头注意力 + LayerNorm + MLP + 残差连接，最后投影到词表。今天几乎所有大模型都是它的变体。` },
        { type: 'code', title: '一个 Transformer block 的骨架（PyTorch 伪代码）', code: r`class TransformerBlock(nn.Module):
    def forward(self, x):                    # x: (b, t, d)
        x = x + self.attn(self.ln1(x))       # 注意力 + 残差
        x = x + self.mlp(self.ln2(x))        # MLP + 残差
        return x
# 记住这个形状：RWKV 的 block 和它几乎一样，
# 只是把 self.attn 换成了 time_mixing` },
        { type: 'heading', text: '平方税：注意力的阿喀琉斯之踵' },
        { type: 'text', md: r`问题出在 $\mathbf{Q}\mathbf{K}^\top$ 这个 $t \times t$ 矩阵上：` },
        { type: 'table', head: ['成本项', 'Transformer`, `随长度 t 增长'], rows: [
          ['训练计算量', r`$O(t^2 \cdot d)$`, '平方 ⚠️'],
          ['推理每步计算', r`$O(t \cdot d)$（要看全部历史）`, '线性 ⚠️'],
          ['推理内存（KV cache）', r`$O(t \cdot d \cdot L)$`, '线性 ⚠️'],
          ['并行性', '训练全并行 ✅', '——'],
        ]},
        { type: 'text', md: r`上下文翻倍，训练成本变四倍；对话拉到 100 万字，KV cache 能把显存撑爆。**有没有办法既有「检索历史」的能力，又有 RNN 那样固定大小的状态？**` },
        { type: 'callout', variant: 'key', md: r`这就是 RWKV 登场的全部理由。它把 softmax 注意力中的「逐个比较」改写成「带衰减的累加」，从而能用 RNN 递推形式计算——**推理时状态大小恒定，与历史长度无关**。下一章，我们把这句话拆成你能亲手写出的公式。` },
        { type: 'quiz', quiz: {
          question: 'Transformer 推理成本随上下文增长的根本原因是？',
          options: [
            { text: '参数太多', correct: false },
            { text: '每个新 token 都要与全部历史 token 计算注意力，且需缓存所有 KV', correct: true },
            { text: 'softmax 太慢', correct: false },
            { text: '位置编码太长', correct: false },
          ],
          explanation: r`Q·Kᵀ 让每个新位置都要检索全部历史。RWKV 把这步变成「读一个固定状态」，推理成本与历史长度彻底解耦。`,
        }},
      ],
    },
  ],
};
