import type { Chapter } from '../types';

const r = String.raw;

export const ch07: Chapter = {
  id: 'ch07',
  num: '07',
  title: '序列建模：语言的形状',
  subtitle: '语言模型任务、token 化、RNN 的辉煌与困境',
  stage: '序列与注意力',
  accent: '190 85% 58%',
  lessons: [
    {
      id: '7-1',
      title: '语言模型：预测下一个 token',
      minutes: 14,
      blocks: [
        { type: 'text', md: r`语言模型的任务朴素得令人怀疑：**给定前面所有词，预测下一个词的概率分布**。就这一个目标，喂进半个互联网的文字，竟长出了推理、翻译、写代码的能力——规模的魔法超出所有人的预料。` },
        { type: 'formula', tex: r`P(x_1, x_2, \dots, x_T) = \prod_{t=1}^{T} P(x_t \mid x_1, \dots, x_{t-1})`, caption: '概率的链式法则：一句话的概率 = 每步条件概率的连乘。模型只需学会每一项。' },
        { type: 'heading', text: 'Token 化：文字如何变成数字' },
        { type: 'text', md: r`计算机不认识「猫」，只认识数字。第一步是把文本切成 **token**（可以是一个字、一个子词、一个词），每个 token 在词表里有个 id。主流方案是 **BPE**（字节对编码）：从单字符开始，反复合并最高频的相邻对，常用词整块表示，生僻词拆碎表示——压缩率与覆盖率兼得。` },
        { type: 'interactive', name: 'tokenizer-demo', title: 'Token 化与 Embedding 流水线', desc: '输入文字，走完 文本→token→id→one-hot→稠密向量 的全过程。' },
        { type: 'text', md: r`进入网络时，id 通过 **embedding 矩阵**查表变成 $d$ 维向量（第 1 章说过：语义编码在方向里）；离开网络时，输出层把 $d$ 维向量投影回 $V$ 维 logits，softmax 后就是下个词的概率分布。训练目标：第 3 章的交叉熵，逐位置求和。` },
        { type: 'callout', variant: 'key', md: r`训练样本的构造免费且海量：任何一段文本，⌈输入 = 前 t 个 token，标签 = 后移一位的同一段文本⌉。不需要人工标注——这就是**自监督学习**，大模型能吃下整个互联网的根本原因。` },
        { type: 'quiz', quiz: {
          question: '语言模型训练的「标签」来自哪里？',
          options: [
            { text: '人工标注员逐句标注', correct: false },
            { text: '文本自身后移一位，无需人工（自监督）', correct: true },
            { text: '从词典里查', correct: false },
            { text: '随机生成', correct: false },
          ],
          explanation: '每段文本天然携带「下一个词是什么」的答案。自监督让训练数据几乎无限——这是大模型时代最重要的范式。',
        }},
      ],
    },
    {
      id: '7-2',
      title: 'RNN：把历史压进一个向量',
      minutes: 16,
      blocks: [
        { type: 'text', md: r`处理序列最古老的想法：维护一个**隐藏状态** $\mathbf{h}_t$ 作为「记忆」，每读一个新 token，就把记忆更新一次。这就是**循环神经网络**（RNN）。` },
        { type: 'formula', tex: r`\mathbf{h}_t = \tanh(\mathbf{W}_x \mathbf{x}_t + \mathbf{W}_h \mathbf{h}_{t-1} + \mathbf{b})`, caption: 'RNN 递推式：新记忆 = 当前输入与旧记忆的混合，tanh 压缩到 (-1,1)。' },
        { type: 'text', md: r`注意 $\mathbf{W}_h$ 在所有时间步**共享**——同一个矩阵被反复乘。这带来两个深远后果：` },
        { type: 'list', ordered: true, items: [
          r`**好处**：参数量与序列长度无关，推理时每步 O(1) 内存——RWKV 继承了这一点。`,
          r`**灾难**：反向传播沿时间展开（BPTT），梯度每传一步乘一次 $\mathbf{W}_h \cdot \mathrm{diag}(\tanh')$。几十步后连乘结果要么消失要么爆炸（回忆第 1 章的特征值直觉）。`,
        ]},
        { type: 'interactive', name: 'rnn-unroll', title: 'RNN 展开与梯度连乘', desc: '推进时间步，亲眼看梯度如何一步步衰减到零。' },
        { type: 'callout', variant: 'warn', md: r`梯度消失的实际含义：模型学不到「很久以前的信息对现在的影响」。读到「……所以这只**猫**终于吃到了鱼」时，它早就忘了开头出现过猫。RNN 理论上能记无限长，实践上只有几十步有效记忆。` },
        { type: 'quiz', quiz: {
          question: 'RNN 梯度消失的根本原因是什么？',
          options: [
            { text: '学习率设置不当', correct: false },
            { text: '同一个循环矩阵被反复连乘，特征值小于 1 时梯度指数衰减', correct: true },
            { text: 'tanh 函数计算太慢', correct: false },
            { text: '词表太大', correct: false },
          ],
          explanation: r`BPTT 中梯度含 $\prod \mathbf{W}_h \, \tanh'$，幅度按 $|\lambda|^{t}$ 缩放。这不是 bug，是结构宿命——后面的 LSTM 和 RWKV 都在与这个连乘作斗争。`,
        }},
      ],
    },
    {
      id: '7-3',
      title: '门控：LSTM 的解与未竟之路',
      minutes: 13,
      blocks: [
        { type: 'text', md: r`LSTM 的思路：既然连乘会失控，那就给记忆修一条**高速公路**——细胞状态 $\mathbf{c}_t$ 的更新以加法为主，梯度沿路几乎无损地流回遥远的过去。` },
        { type: 'formula', tex: r`\mathbf{c}_t = \mathbf{f}_t \odot \mathbf{c}_{t-1} + \mathbf{i}_t \odot \tilde{\mathbf{c}}_t`, caption: '遗忘门 f 决定旧记忆留多少，输入门 i 决定新信息写多少。加法式更新是梯度的高速公路。' },
        { type: 'text', md: r`三个**门**（gate）都是 sigmoid 输出 $(0,1)$ 之间的数，逐元素乘在信息流上——门就是**可学习的水龙头**。GRU 把它简化为两个门。` },
        { type: 'callout', variant: 'tip', md: r`请记住「门控」与「加法式状态更新」这两个概念。RWKV 的 receptance 门（$\sigma(r)$ 门控输出）、channel-mixing 的门、以及 WKV 状态的累加式更新，全是这套思想的直系后代。` },
        { type: 'text', md: r`但 LSTM 依然有硬伤：记忆终究是一个**固定大小的向量**，几百个 token 之后，早期信息被挤得面目全非；而且逐 token 串行计算，无法利用 GPU 并行，训练慢。于是人们换了个思路：**不压缩历史了，让模型直接回头检索历史**——下一章的注意力机制登场。` },
        { type: 'table', head: ['架构', '记忆形式', '长程依赖', '训练并行度'], rows: [
          ['RNN', '固定向量，逐步覆盖', '差（梯度消失）', '低（串行）'],
          ['LSTM/GRU', '门控细胞状态', '中（几百步）', '低（串行）'],
          ['Transformer`, `完整保留所有历史', '强（直接检索）', '高（全并行）'],
          ['RWKV', '固定状态 + 检索式衰减', '强且成本恒定', '高（可并行化）'],
        ], caption: '先混个眼熟，第 9 章这张表的最后一行会被彻底展开。'},
        { type: 'quiz', quiz: {
          question: 'LSTM 缓解梯度消失的关键设计是？',
          options: [
            { text: '用了更深的网络', correct: false },
            { text: '细胞状态的加法式更新 + 门控控制信息读写', correct: true },
            { text: '去掉了所有激活函数', correct: false },
            { text: '把序列倒过来输入', correct: false },
          ],
          explanation: '加法路径上梯度可以无损回传（加法门传递系数为 1），遗忘门学到接近 1 时记忆可长期保留。',
        }},
      ],
    },
  ],
};
