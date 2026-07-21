import type { Chapter } from '../types';

const r = String.raw;

export const ch06: Chapter = {
  id: 'ch06',
  num: '06',
  title: '神经网络：积木与第一次手写训练',
  subtitle: '从神经元到 MLP，亲手训练出第一个能用的网络',
  stage: '机器学习内功',
  accent: '20 85% 58%',
  lessons: [
    {
      id: '6-1',
      title: '神经元、激活函数与万能近似',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`一个**神经元**做的事：对输入向量做点积加偏置，再过一遍非线性**激活函数**。一排神经元共享同一个输入，就组成一**层**；几层串起来，就是**多层感知机**（MLP）。` },
        { type: 'formula', tex: r`h = \phi(\mathbf{W}\mathbf{x} + \mathbf{b})`, caption: '一层 = 线性变换 + 非线性激活 φ' },
        { type: 'heading', text: '为什么必须是非线性' },
        { type: 'text', md: r`如果去掉 $\phi$，多层网络 $\mathbf{W}_3\mathbf{W}_2\mathbf{W}_1\mathbf{x}$ 可以合并成一个矩阵——**一百层也等价于一层**。非线性把空间反复弯折，叠得越深，能表达的函数越复杂。这是整个深度学习的地基。` },
        { type: 'callout', variant: 'key', md: r`**万能近似定理**：只要隐藏层够宽，一个单隐层网络就能逼近任意连续函数。这不是说「随便训都能学好」，而是说「表达能力管够，瓶颈在优化」。` },
        { type: 'interactive', name: 'activation-explorer', title: '激活函数观察器', desc: '对比 Sigmoid / Tanh / ReLU / SiLU 的曲线与导数，重点看导数在哪里「死掉」。' },
        { type: 'quiz', quiz: {
          question: 'RWKV 与 LLaMA 的隐藏层激活函数都选择 SiLU 而非 ReLU，主要因为？',
          options: [
            { text: 'SiLU 计算更快', correct: false },
            { text: 'SiLU 处处光滑可导，没有死亡区间，训练更稳定', correct: true },
            { text: 'SiLU 输出恒为正', correct: false },
            { text: 'SiLU 不需要参数', correct: false },
          ],
          explanation: r`ReLU 负半轴导数为 0（神经元可能永久失活）；SiLU $= x\cdot\sigma(x)$ 负半轴仍有微小但非零的梯度，且处处光滑。后面你会在 RWKV 的 Channel-Mixing 里亲手写它（的平方亲戚）。`,
        }},
      ],
    },
    {
      id: '6-2',
      title: '向量化思考：shape 是一切的纪律',
      minutes: 13,
      blocks: [
        { type: 'text', md: r`写神经网络代码时，数据从来不是一个个数，而是一坨坨张量。标准形状约定：输入 $\mathbf{X}$ 是 $(b, d)$——$b$ 个样本、每个 $d$ 维；序列任务再加一个时间轴 $(b, t, d)$。所有运算都是对整个张量同时进行的，没有 for 循环。` },
        { type: 'formula', tex: r`\mathbf{H} = \phi(\mathbf{X}\mathbf{W}^\top + \mathbf{b}), \quad \mathbf{X} \in \mathbb{R}^{b \times d_{\text{in}}},\ \mathbf{W} \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}`, caption: '一批样本同时过一层：矩阵乘法天然支持并行，这正是 GPU 存在的意义。' },
        { type: 'table', head: ['符号', '含义', '本课 RWKV 小模型的典型值'], rows: [
          [r`$b$`, 'batch size：一次喂几条序列', '8 ~ 64'],
          [r`$t$`, 'context length：序列多长', '256 ~ 1024'],
          [r`$d$`, 'd_model：每个位置的向量宽度', '256 ~ 768'],
          [r`$V$`, 'vocab size：词表大小', '65536（RWKV 官方）'],
        ]},
        { type: 'code', title: '纯 NumPy 实现一个 MLP 前向传播', code: r`import numpy as np

def mlp_forward(X, params):
    # X: (b, d_in)  params: 每层的 (W, b)
    h = X
    for W, b in params[:-1]:
        h = np.maximum(0, h @ W.T + b)   # 隐藏层 + ReLU
    W, b = params[-1]
    return h @ W.T + b                    # 输出层（无激活）

X = np.random.randn(32, 10)               # 32 个样本，每个 10 维
params = [
    (np.random.randn(64, 10) * 0.1, np.zeros(64)),   # 10 -> 64
    (np.random.randn(64, 64) * 0.1, np.zeros(64)),   # 64 -> 64
    (np.random.randn(2, 64) * 0.1, np.zeros(2)),     # 64 -> 2
]
out = mlp_forward(X, params)
print(out.shape)   # (32, 2)：每个样本 2 个输出分数` },
        { type: 'callout', variant: 'warn', md: r`注意初始化的 $\times 0.1$：权重太大会让激活值逐层爆炸。常用初始化（Xavier / Kaiming）的本质就是按层宽缩放初始方差，让信号逐层传播时尺度稳定。` },
      ],
    },
    {
      id: '6-3',
      title: '里程碑：50 行 NumPy 训练一个网络',
      minutes: 20,
      blocks: [
        { type: 'text', md: r`把第 2~5 章的零件全装起来，我们用手推的反向传播，从零训练一个网络学习 **XOR** 函数（线性模型永远学不会的经典难题）。这段代码值得你逐行敲一遍。` },
        { type: 'code', title: '手搓神经网络（含手写反向传播）', code: r`import numpy as np

# ---- 数据：XOR ----
X = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)   # (4, 2)
Y = np.array([[0],[1],[1],[0]], dtype=float)           # (4, 1)

# ---- 参数：2 -> 8 -> 1 ----
rng = np.random.default_rng(0)
W1 = rng.normal(0, 1, (8, 2));  b1 = np.zeros(8)
W2 = rng.normal(0, 1, (1, 8));  b2 = np.zeros(1)

def sigmoid(z): return 1 / (1 + np.exp(-z))

lr = 0.5
for step in range(5000):
    # ===== 前向 =====
    h  = sigmoid(X @ W1.T + b1)          # (4, 8) 隐藏层
    y  = sigmoid(h @ W2.T + b2)          # (4, 1) 输出（概率）
    loss = -(Y*np.log(y) + (1-Y)*np.log(1-y)).mean()  # 交叉熵

    # ===== 反向（手推的链式法则）=====
    dy  = (y - Y) / 4                    # dL/dy，sigmoid+CE 的优美化简
    dW2 = dy.T @ h                       # (1,8)：上游梯度 ⊗ 本层输入
    db2 = dy.sum(0)
    dh  = dy @ W2                        # (4,8)：乘 Wᵀ 往回传
    dz1 = dh * h * (1 - h)               # 过 sigmoid 的导数
    dW1 = dz1.T @ X
    db1 = dz1.sum(0)

    # ===== 梯度下降 =====
    for p, g in [(W1,dW1),(b1,db1),(W2,dW2),(b2,db2)]:
        p -= lr * g

print((y > 0.5).astype(int).ravel())   # [0 1 1 0] ✓ 学会了 XOR` },
        { type: 'list', items: [
          r`**前向**：数据从输入流到 loss，沿途存下所有中间值（h、y）`,
          r`**反向**：梯度从 loss 流回每个参数，每个环节只做「乘局部导数」`,
          r`**更新**：所有参数同时沿负梯度走一步`,
          r`循环 5000 次，网络从随机噪声里自己找到了 XOR 的规则`,
        ]},
        { type: 'callout', variant: 'key', md: r`恭喜——这就是**你手搓的第一个训练框架**。它已具备第 11 章 RWKV 框架的全部要素：参数、前向、反向、更新。剩下的只是「更大的模型 + 更强的工具」，思想零增加。` },
        { type: 'quiz', quiz: {
          question: r`代码中 ⌈dy = (y - Y) / 4⌉ 为什么形式这么简洁？`,
          options: [
            { text: '写错了，碰巧能跑', correct: false },
            { text: 'sigmoid 与交叉熵组合时导数恰好化简为「预测 − 标签」', correct: true },
            { text: '因为学习率是 0.5', correct: false },
            { text: '因为用了 NumPy', correct: false },
          ],
          explanation: r`交叉熵对 sigmoid 输出求导，链式法则乘开后中间项全部约掉，只剩 $y - Y$。softmax + 交叉熵有同样的化简——语言模型输出层的梯度也是「预测概率 − one-hot」。`,
        }},
      ],
    },
  ],
};
