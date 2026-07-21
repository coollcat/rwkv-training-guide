import type { Chapter } from '../types';

const r = String.raw;

export const ch01: Chapter = {
  id: 'ch01',
  num: '01',
  title: '线性代数：神经网络的母语',
  subtitle: '向量、矩阵乘法、以及它们为什么是一切的基础',
  stage: '数学地基',
  accent: '200 90% 55%',
  lessons: [
    {
      id: '1-1',
      title: '标量、向量与张量：数据的容器',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`机器学习的所有数据——一张图、一句话、一次点击——最终都会变成**数字的阵列**。按维度排队：一个数是**标量**（scalar），一排数是**向量**（vector），一张表是**矩阵**（matrix），更高维统称**张量**（tensor）。` },
        { type: 'list', items: [
          r`标量：$x = 3.7$，比如某个神经元的输出`,
          r`向量：$\mathbf{x} = [x_1, x_2, \dots, x_n] \in \mathbb{R}^n$，比如一个词的 embedding`,
          r`矩阵：$\mathbf{W} \in \mathbb{R}^{m \times n}$，比如神经网络某一层的全部权重`,
          r`张量：$\mathbb{R}^{b \times t \times d}$，比如「batch 大小 × 序列长度 × 特征维度」的一批训练数据`,
        ]},
        { type: 'heading', text: '向量：有方向的一串数' },
        { type: 'text', md: r`向量最直观的画法是平面上的箭头。两个基本操作几乎出现在每一行神经网络代码里：**加法**（逐元素相加）和**点积**（dot product）。` },
        { type: 'formula', tex: r`\mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{n} a_i b_i = \lVert \mathbf{a} \rVert \, \lVert \mathbf{b} \rVert \cos\theta`, caption: '点积：对应位置相乘再求和。它同时等于两向量长度乘上夹角余弦。' },
        { type: 'callout', variant: 'key', md: r`点积衡量的是**相似度**：两个向量方向越一致，点积越大；垂直则为零。后面注意力机制里的「这个词跟那个词有多相关」，就是一次点积。` },
        { type: 'formula', tex: r`\cos(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{\lVert \mathbf{a} \rVert \, \lVert \mathbf{b} \rVert}`, caption: '余弦相似度：把长度归一化，只比较方向。' },
        { type: 'interactive', name: 'vector-playground', title: '向量游乐场', desc: '拖动滑杆改变两个向量，观察点积与夹角如何联动。' },
        { type: 'heading', text: '为什么词可以变成向量' },
        { type: 'text', md: r`「猫」不是一个数，但模型需要一个数字化的「猫」。做法：给每个词随机分配一个几百维的向量（**embedding**），然后让训练过程自动调整这些向量，使得语义相近的词向量方向也相近。于是「国王 − 男人 + 女人 ≈ 女王」这种向量算术成为可能——**语义被编码进了方向**。` },
        { type: 'quiz', quiz: {
          question: r`若 $\mathbf{a} \cdot \mathbf{b} = 0$，且两个向量都不是零向量，说明什么？`,
          options: [
            { text: '两向量方向完全相同', correct: false },
            { text: '两向量互相垂直（正交）', correct: true },
            { text: '两向量长度相等', correct: false },
            { text: '计算出错了', correct: false },
          ],
          explanation: r`点积 $= \lVert a \rVert \lVert b \rVert \cos\theta$，长度非零时点积为零 ⟹ $\cos\theta = 0$，即 $\theta = 90°$。`,
        }},
      ],
    },
    {
      id: '1-2',
      title: '矩阵乘法：一层神经网络的全部工作',
      minutes: 18,
      blocks: [
        { type: 'text', md: r`矩阵可以理解成「一堆向量排成的表」，也可以理解成一个**函数**：输入一个向量，输出另一个向量。神经网络的一层，本质就是一次矩阵乘法加一个偏置，再过一遍非线性函数。` },
        { type: 'formula', tex: r`\mathbf{y} = \mathbf{W}\mathbf{x} + \mathbf{b}`, caption: '线性层：W 把 n 维输入变换成 m 维输出。' },
        { type: 'heading', text: '矩阵乘法的定义' },
        { type: 'formula', tex: r`C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj}`, caption: 'C 的第 i 行第 j 列 = A 的第 i 行 · B 的第 j 列（点积）' },
        { type: 'text', md: r`规则只有一条：**左边的列数必须等于右边的行数**。$(m \times n) \cdot (n \times p) \to (m \times p)$。结果矩阵的每个元素，都是一次「行向量与列向量的点积」。` },
        { type: 'interactive', name: 'matmul-visualizer', title: '矩阵乘法透视器', desc: '点选结果矩阵的任意元素，看它是哪一行和哪一列「点」出来的。' },
        { type: 'callout', variant: 'warn', title: '维数纪律', md: r`写神经网络代码时 90% 的报错都是形状对不上。养成本能：每写一行矩阵运算，心里默念一次 ⌈(b, t, d) @ (d, d') → (b, t, d')⌉。后面手搓 RWKV 时这个习惯会救你无数次。` },
        { type: 'code', title: '用 NumPy 验证上面的乘法', code: r`import numpy as np

A = np.array([[1, 2, -1],
              [0, 3,  1],
              [2, -1, 0]])
B = np.array([[1, 0, 2],
              [-1, 1, 0],
              [0, 2, 1]])

C = A @ B            # @ 就是矩阵乘法
print(C.shape)       # (3, 3)
print(C[0, 0])       # 1*1 + 2*(-1) + (-1)*0 = -1

# 神经网络的一层
x = np.random.randn(4)        # 输入向量，维度 4
W = np.random.randn(8, 4)     # 权重矩阵：4 → 8
b = np.random.randn(8)
y = W @ x + b                 # 输出向量，维度 8
print(y.shape)                # (8,)` },
        { type: 'quiz', quiz: {
          question: r`$\mathbf{W} \in \mathbb{R}^{768 \times 3072}$，$\mathbf{x} \in \mathbb{R}^{3072}$，则 $\mathbf{W}\mathbf{x}$ 的维度是？`,
          options: [
            { text: r`$3072$`, correct: false },
            { text: r`$768$`, correct: true },
            { text: r`$768 \times 3072$`, correct: false },
            { text: '无法相乘', correct: false },
          ],
          explanation: r`$(768 \times 3072) \cdot (3072) \to 768$。RWKV 的 Channel-Mixing 里就有这样一组「先放大 4 倍再缩回来」的矩阵。`,
        }},
      ],
    },
    {
      id: '1-3',
      title: '转置、逆矩阵与特征向量：看懂论文里的变换',
      minutes: 12,
      blocks: [
        { type: 'heading', text: '转置：行列互换' },
        { type: 'formula', tex: r`(\mathbf{A}^\top)_{ij} = A_{ji}`, caption: '转置：沿主对角线翻转。注意力公式 Q·Kᵀ 里的 ᵀ 就是它。' },
        { type: 'text', md: r`转置有个高频性质：$(\mathbf{A}\mathbf{B})^\top = \mathbf{B}^\top \mathbf{A}^\top$（顺序反转）。后面推反向传播的矩阵形式时会直接用到。` },
        { type: 'heading', text: '逆矩阵与单位阵' },
        { type: 'formula', tex: r`\mathbf{A}\mathbf{A}^{-1} = \mathbf{A}^{-1}\mathbf{A} = \mathbf{I}`, caption: '逆矩阵：「撤销」这个变换。不是所有矩阵都有逆。' },
        { type: 'text', md: r`单位阵 $\mathbf{I}$ 对角线全 1 其余全 0，乘任何矩阵都等于没乘。实际代码里几乎从不显式求逆（又慢又不稳），但概念上你要知道「这个变换可逆吗」是在问什么。` },
        { type: 'heading', text: '特征值与特征向量：变换的「主轴」' },
        { type: 'formula', tex: r`\mathbf{A}\mathbf{v} = \lambda \mathbf{v}`, caption: '特征向量 v 被 A 变换后方向不变，只缩放 λ 倍。' },
        { type: 'callout', variant: 'tip', md: r`直觉：矩阵变换会把空间里的向量又转又拉。但总有那么几个特殊方向，变换后**方向不变只缩放**——这些方向就是特征向量，缩放倍数就是特征值。RNN 反复乘同一个矩阵时，最终行为完全被**最大特征值**支配：$|\lambda| > 1$ 爆炸，$|\lambda| < 1$ 消失。第 7 章你会看到这个直觉如何解释梯度消失。` },
        { type: 'text', md: r`对称矩阵（$\mathbf{A} = \mathbf{A}^\top$）有一组特别好的性质：特征值全是实数，特征向量互相正交。协方差矩阵、Hessian 矩阵都是对称的，所以优化理论里到处是特征分解的影子。本节不要求手算，能在论文里认出它就够了。` },
        { type: 'quiz', quiz: {
          question: r`RNN 每个时间步都把隐藏状态乘同一个矩阵 $\mathbf{W}_h$，其最大特征值 $|\lambda| = 0.9$。传播 100 步后，早期信息大约剩多少？`,
          options: [
            { text: r`约 90%`, correct: false },
            { text: r`约 $0.9^{100} \approx 2.7 \times 10^{-5}$，几乎消失`, correct: true },
            { text: '不变', correct: false },
            { text: '变成原来的 90 倍', correct: false },
          ],
          explanation: r`每步乘一次 $\mathbf{W}_h$，100 步就是 $\mathbf{W}_h^{100}$，幅度按 $|\lambda|^{100}$ 衰减。这就是 RNN 长期记忆困难的线性代数解释，也是 RWKV 用「逐通道标量衰减」来精细控制记忆长短的动机。`,
        }},
      ],
    },
  ],
};
