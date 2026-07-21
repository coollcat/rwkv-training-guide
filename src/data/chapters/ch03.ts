import type { Chapter } from '../types';

const r = String.raw;

export const ch03: Chapter = {
  id: 'ch03',
  num: '03',
  title: '概率与信息论：损失函数的诞生',
  subtitle: '从抛硬币到交叉熵——语言模型的损失是怎么长出来的',
  stage: '数学地基',
  accent: '45 90% 55%',
  lessons: [
    {
      id: '3-1',
      title: '概率基础：随机变量与常见分布',
      minutes: 13,
      blocks: [
        { type: 'text', md: r`概率论研究「不确定的事情有多可能」。核心概念：**随机变量** $X$ 是一个取值看运气的量，**概率分布**描述每个取值的可能性。所有概率都在 $[0,1]$ 之间，全部加起来等于 1。` },
        { type: 'list', items: [
          r`**伯努利分布**：一次抛硬币，$P(X=1) = p$。二分类问题的原型。`,
          r`**分类分布**（Categorical）：一次掷 $K$ 面骰子，每面概率 $p_i$，$\sum p_i = 1$。**语言模型每预测一个词，就是掷一次几万面的骰子**。`,
          r`**高斯分布**：钟形曲线 $\mathcal{N}(\mu, \sigma^2)$，权重初始化的常客。`,
        ]},
        { type: 'formula', tex: r`\mathbb{E}[X] = \sum_i x_i \, P(X = x_i), \qquad \mathrm{Var}(X) = \mathbb{E}\left[(X - \mathbb{E}X)^2\right]`, caption: '期望（平均值）与方差（波动程度）。' },
        { type: 'text', md: r`机器学习里几乎所有平均都是期望：loss 是「损失的期望」，梯度是「梯度的期望」。用一小撮样本（mini-batch）去估计这个期望，就是训练带有噪声的原因。` },
        { type: 'quiz', quiz: {
          question: '语言模型预测下一个词时，输出的是什么分布？',
          options: [
            { text: '伯努利分布（二选一）', correct: false },
            { text: '分类分布（词表几万词中选一个）', correct: true },
            { text: '高斯分布（连续值）', correct: false },
            { text: '均匀分布（完全随机）', correct: false },
          ],
          explanation: '词表里有几万个候选词，模型给每个词一个概率且总和为 1——这是标准的分类分布。这个认知是理解 softmax 和交叉熵的前提。',
        }},
      ],
    },
    {
      id: '3-2',
      title: '最大似然：训练目标的哲学源头',
      minutes: 14,
      blocks: [
        { type: 'text', md: r`假设我们有一个带参数 $\theta$ 的模型，它给任何数据的「可能性」打分 $P_\theta(x)$。训练的目标可以很朴素：**调整 θ，让真实数据出现的可能性最大**。这就是最大似然估计（MLE）。` },
        { type: 'formula', tex: r`\theta^* = \arg\max_{\theta} \prod_{i=1}^{N} P_\theta(x_i) = \arg\max_{\theta} \sum_{i=1}^{N} \log P_\theta(x_i)`, caption: '连乘变连加：取对数不改变最大值的位置，但避免了小数连乘溢出，还把乘法变成了好求导的加法。' },
        { type: 'text', md: r`加个负号，「最大化对数似然」就变成「最小化负对数似然」（NLL）：` },
        { type: 'formula', tex: r`\mathcal{L}(\theta) = -\frac{1}{N}\sum_{i=1}^{N} \log P_\theta(x_i)`, caption: '负对数似然损失。真实样本的概率越接近 1，log 越接近 0，损失越小。' },
        { type: 'callout', variant: 'key', md: r`语言模型的训练 = 对语料中每个真实的下一个词，最大化模型分配给它的对数概率。换句话说：**让模型对真实文本「毫不意外」**。这个原则到第 11 章都不会变。` },
        { type: 'quiz', quiz: {
          question: r`模型给真实答案的概率是 $P = 0.01$，对应的 NLL 损失约是多少？`,
          options: [
            { text: '0.01', correct: false },
            { text: r`$\approx 4.6$`, correct: true },
            { text: r`$\approx 0.46$`, correct: false },
            { text: '1', correct: false },
          ],
          explanation: r`$-\ln(0.01) = \ln(100) \approx 4.6$。概率越小惩罚越狠，而且是非线性的狠——概率从 0.5 到 0.9 损失只降 0.58，从 0.01 到 0.05 就降 1.6。`,
        }},
      ],
    },
    {
      id: '3-3',
      title: '信息熵与交叉熵：损失函数的最终形态',
      minutes: 16,
      blocks: [
        { type: 'text', md: r`信息论问：一个消息值多少「信息」？香农的答案：越不可能的事发生，信息量越大。概率 $p$ 的事件携带信息 $-\log p$ 比特。一个分布的平均信息量叫**熵**：` },
        { type: 'formula', tex: r`H(p) = -\sum_i p_i \log p_i`, caption: '熵：分布的不确定性。均匀分布熵最大，确定的分布熵为 0。' },
        { type: 'heading', text: '交叉熵：用错误的方式编码真实' },
        { type: 'formula', tex: r`H(p, q) = -\sum_i p_i \log q_i`, caption: '交叉熵：真实分布是 p，模型却以为分布是 q。' },
        { type: 'text', md: r`当真实分布 $p$ 是 one-hot（正确答案概率 1，其余 0）时，求和只剩一项：` },
        { type: 'formula', tex: r`H(p, q) = -\log q_{\text{correct}}`, caption: 'one-hot 标签下，交叉熵 = 负对数似然。两条路殊途同归！' },
        { type: 'callout', variant: 'key', md: r`所以语言模型的损失函数就是：对每个位置，取模型输出分布中**真实下一个词**的概率，取负对数，再对全语料求平均。就这么简单——但它是几千亿参数模型的唯一目标。` },
        { type: 'heading', text: 'Softmax：把任意分数变成概率' },
        { type: 'formula', tex: r`q_i = \mathrm{softmax}(z_i) = \frac{e^{z_i}}{\sum_j e^{z_j}}`, caption: 'softmax：指数放大差异，再归一化。输出总和恒为 1。' },
        { type: 'text', md: r`模型最后一层输出的原始分数叫 **logits**（可以是任何实数），softmax 把它变成合法概率分布。指数函数让「分数最高的选项获得压倒性概率」，同时保持处处可导。` },
        { type: 'interactive', name: 'softmax-demo', title: 'Softmax × 交叉熵实验台', desc: '拖动 logits 和温度，亲眼看 loss 如何响应。' },
        { type: 'quiz', quiz: {
          question: r`把 softmax 的温度 $T$ 调得很小（如 0.1），输出分布会？`,
          options: [
            { text: '变得更均匀', correct: false },
            { text: '变得更尖锐，最高分接近 1', correct: true },
            { text: '不再和为 1', correct: false },
            { text: '出现负数概率', correct: false },
          ],
          explanation: r`温度在指数里做除法 $e^{z_i / T}$：$T$ 小则分数差异被剧烈放大，分布尖锐；$T \to \infty$ 则趋于均匀。第 12 章生成文本时会用它控制「创造性」。`,
        }},
      ],
    },
  ],
};
