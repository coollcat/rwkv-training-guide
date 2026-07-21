/** 论文与外部资源清单（Resources 页） */

export interface Paper {
  title: string;
  authors: string;
  year: string;
  url: string;
  tag: 'RWKV' | '前置必读' | '代码仓库' | '进阶';
  note: string;
}

export const PAPERS: Paper[] = [
  {
    title: 'RWKV: Reinventing RNNs for the Transformer Era',
    authors: 'Bo Peng, Eric Alcaide, Quentin Anthony, et al.',
    year: '2023',
    url: 'https://arxiv.org/abs/2305.13048',
    tag: 'RWKV',
    note: 'RWKV-4 主论文，本课程第 9 章的全部公式出处。读法：先看 §3 架构，再对照第 11 章代码。',
  },
  {
    title: 'Eagle and Finch: RWKV with Matrix-Valued States and Dynamic Recurrence',
    authors: 'Bo Peng, Daniel Goldstein, Quentin Anthony, et al.',
    year: '2024',
    url: 'https://arxiv.org/abs/2404.05892',
    tag: 'RWKV',
    note: 'RWKV-5/6 论文：多头衰减与数据依赖的动态参数。毕业路线图第 3 步的阅读材料。',
  },
  {
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, et al.',
    year: '2017',
    url: 'https://arxiv.org/abs/1706.03762',
    tag: '前置必读',
    note: 'Transformer 原始论文。第 8 章的扩展阅读，重点看 §3.2 注意力与复杂度对比表。',
  },
  {
    title: 'Long Short-Term Memory',
    authors: 'Sepp Hochreiter, Jürgen Schmidhuber',
    year: '1997',
    url: 'https://www.bioinf.jku.at/publications/older/2604.pdf',
    tag: '前置必读',
    note: 'LSTM 原始论文（历史文献）。门控思想的源头，第 7-3 节的扩展阅读。',
  },
  {
    title: 'Neural Probabilistic Language Model',
    authors: 'Yoshua Bengio, et al.',
    year: '2003',
    url: 'https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf',
    tag: '前置必读',
    note: '神经语言模型的开山之作：词嵌入 + 下一个词预测，一切的起点。',
  },
  {
    title: 'Adam: A Method for Stochastic Optimization',
    authors: 'Diederik Kingma, Jimmy Ba',
    year: '2015',
    url: 'https://arxiv.org/abs/1412.6980',
    tag: '前置必读',
    note: 'Adam 优化器论文。第 4-1 节公式的出处，附录有完整的收敛性分析。',
  },
  {
    title: 'RWKV-LM 官方仓库',
    authors: 'BlinkDL',
    year: '持续更新',
    url: 'https://github.com/BlinkDL/RWKV-LM',
    tag: '代码仓库',
    note: '官方训练代码与 CUDA kernel。完成本课程后逐文件对照的第一站。',
  },
  {
    title: 'RWKV Tokenizer（词表 65536）',
    authors: 'BlinkDL',
    year: '持续更新',
    url: 'https://github.com/BlinkDL/ChatRWKV',
    tag: '代码仓库',
    note: '官方 BPE tokenizer 与推理示例。升级数据管线时参考。',
  },
  {
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    authors: 'Albert Gu, Tri Dao',
    year: '2023',
    url: 'https://arxiv.org/abs/2312.00752',
    tag: '进阶',
    note: '另一条「线性时间序列建模」路线（状态空间模型）。与 RWKV 互为镜像，对比阅读收益巨大。',
  },
  {
    title: 'Linear Transformers Are Secretly Fast Weight Programmers',
    authors: 'Imanol Schlag, Kazuki Irie, Jürgen Schmidhuber',
    year: '2021',
    url: 'https://arxiv.org/abs/2102.11174',
    tag: '进阶',
    note: '线性注意力的理论根基之一：把 softmax 注意力改写为递推形式的系统推导。',
  },
];
