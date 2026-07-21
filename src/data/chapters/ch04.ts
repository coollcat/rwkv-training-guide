import type { Chapter } from '../types';

const r = String.raw;

export const ch04: Chapter = {
  id: 'ch04',
  num: '04',
  title: '优化：如何把损失降下去',
  subtitle: '梯度下降家族、学习率的艺术、反向传播全过程',
  stage: '机器学习内功',
  accent: '160 84% 45%',
  lessons: [
    {
      id: '4-1',
      title: '梯度下降与它的家人们：SGD、Momentum、Adam',
      minutes: 18,
      blocks: [
        { type: 'text', md: r`有了梯度，更新参数只需要一行公式：**梯度下降**。其中 $\eta$（eta）叫**学习率**，控制每步走多大。` },
        { type: 'formula', tex: r`\theta_{t+1} = \theta_t - \eta \, \nabla_\theta \mathcal{L}(\theta_t)`, caption: '梯度下降：沿负梯度方向走一步。整门课最重要的一行公式。' },
        { type: 'text', md: r`全量数据算梯度太贵，实际用的是**小批量随机梯度下降**（mini-batch SGD）：每次随机抽一小撮样本估计梯度。便宜但有噪声——batch 越小噪声越大，反而有时能跳出局部坑。` },
        { type: 'heading', text: '动量与 Adam：更聪明的走法' },
        { type: 'formula', tex: r`v_t = \beta v_{t-1} + \nabla \mathcal{L}, \qquad \theta \leftarrow \theta - \eta v_t`, caption: 'Momentum：梯度带惯性，冲过小坑、减少震荡。β 常取 0.9。' },
        { type: 'formula', tex: r`\begin{aligned} m_t &= \beta_1 m_{t-1} + (1-\beta_1)\, g_t, \qquad v_t = \beta_2 v_{t-1} + (1-\beta_2)\, g_t^2 \\[6pt] \theta &\leftarrow \theta - \eta \, \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} \end{aligned}`, caption: 'Adam：一阶动量（方向）+ 二阶动量（每参数自适应步长）。今天训练大模型的默认选择。' },
        { type: 'callout', variant: 'tip', md: r`Adam 的直觉：$m$ 记住「最近梯度往哪指」，$v$ 记住「最近梯度有多大」。梯度稀少的参数自动获得更大步长，梯度剧烈的参数自动收着走。**第 11 章我们的框架直接调用 Adam，你只需懂它的脾气。**` },
        { type: 'interactive', name: 'loss-curve-sim', title: '训练曲线模拟器', desc: '切换优化器、学习率、batch size，看 loss 曲线的性格。' },
        { type: 'heading', text: '学习率调度：先热身，再退火' },
        { type: 'text', md: r`实战中学习率不是常数。标准配方：**warmup**（前几百步从 0 线性升到峰值，防止开局梯度过冲）→ **cosine decay**（余弦曲线缓慢降到接近 0，后期精修）。第 12 章调参时你会亲手设定这些值。` },
        { type: 'quiz', quiz: {
          question: 'Adam 相比朴素 SGD 的核心优势是？',
          options: [
            { text: '不需要计算梯度', correct: false },
            { text: '每个参数拥有自适应的有效步长', correct: true },
            { text: '保证找到全局最优', correct: false },
            { text: '训练时不需要学习率', correct: false },
          ],
          explanation: r`Adam 用二阶动量 $v_t$ 给每个参数单独缩放步长，稀疏特征的参数也能被充分更新。它仍然需要梯度，也不保证全局最优。`,
        }},
      ],
    },
    {
      id: '4-2',
      title: '反向传播：链式法则的工业化',
      minutes: 18,
      blocks: [
        { type: 'text', md: r`一个神经网络有几十亿参数，难道对每个参数都用定义数值求导？一次求导要算几十亿次前向——不可能。**反向传播**（backpropagation）把这件事变成一次前向 + 一次反向，代价只约为前向的两倍。` },
        { type: 'heading', text: '计算图：把函数拆成流水线' },
        { type: 'text', md: r`任何复杂函数都能拆成一张图：节点是中间变量，边是局部运算。前向时顺着箭头算出所有值；反向时从 loss 出发，每个节点把「上游梯度 × 自己的局部导数」传给下游。**每个节点只需要会做两件小事：算自己的输出，算自己的局部导数。**` },
        { type: 'interactive', name: 'backprop-stepper', title: '反向传播逐帧放映', desc: 'f = (a+b)×c，一步一步看梯度如何逆流而上。' },
        { type: 'heading', text: '前向存什么，反向用什么' },
        { type: 'text', md: r`注意刚才实验里的一个细节：反向算 $\partial f / \partial c$ 时用到了 $q$ 的值——那是**前向时存下来的**。所以反向传播要吃额外显存：前向每算一个中间结果都得留着，等反向来取。这就是为什么「训练比推理费显存」。` },
        { type: 'code', title: '手算一遍再和 PyTorch 对答案', code: r`import torch

a = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(3.0, requires_grad=True)
c = torch.tensor(4.0, requires_grad=True)

q = a + b          # 前向①：q = 5
f = q * c          # 前向②：f = 20
f.backward()       # 反向传播

print(a.grad)  # ∂f/∂a = c = 4
print(b.grad)  # ∂f/∂b = c = 4
print(c.grad)  # ∂f/∂c = q = 5
# 与你在实验室里手推的结果完全一致 ✓` },
        { type: 'callout', variant: 'key', md: r`到第 11 章你会写 ⌈loss.backward()⌉。那时请记住：这行代码背后就是你现在看到的这张小图，只是放大到了几十亿个节点。原理一丝不差。` },
        { type: 'quiz', quiz: {
          question: '反向传播时，经过一个「乘法门」（f = q×c），上游梯度传给 q 时要乘什么？',
          options: [
            { text: 'q 的值', correct: false },
            { text: 'c 的值', correct: true },
            { text: '1', correct: false },
            { text: 'f 的值', correct: false },
          ],
          explanation: r`乘法门 ∂f/∂q = c——梯度的传递系数是「另一个操作数」。加法门的传递系数恒为 1（梯度原样分流），这就是为什么残差连接（一路纯加）能让梯度畅通几百层。`,
        }},
      ],
    },
    {
      id: '4-3',
      title: '数值稳定性：exp 溢出与梯度裁剪',
      minutes: 12,
      blocks: [
        { type: 'text', md: r`公式在数学上正确，在计算机里却可能当场爆炸。浮点数有极限：float32 最大约 $3.4 \times 10^{38}$，而 $e^{89}$ 就已经溢出。深度学习工程里有大量「数学等价但数值更安全」的改写，本节认识两个最重要的。` },
        { type: 'heading', text: 'Softmax 的减最大值技巧' },
        { type: 'formula', tex: r`\mathrm{softmax}(z_i) = \frac{e^{z_i - m}}{\sum_j e^{z_j - m}}, \quad m = \max_j z_j`, caption: '分子分母同乘 e^(−m)，数学上丝毫不差，数值上 e 的指数最大为 0，永不溢出。' },
        { type: 'heading', text: '梯度裁剪：给失控的梯度踩刹车' },
        { type: 'formula', tex: r`\text{if } \lVert g \rVert > \tau: \quad g \leftarrow g \cdot \frac{\tau}{\lVert g \rVert}`, caption: '梯度范数超过阈值 τ 就整体缩回去。方向不变，只限幅度。' },
        { type: 'text', md: r`序列模型尤其需要它：长序列上梯度偶尔会突然飙到正常值的几百倍，一步更新就能毁掉几小时的训练。RWKV 官方仓库默认开启梯度裁剪，我们的框架也会带上（一行代码）。` },
        { type: 'callout', variant: 'warn', title: '为什么这里要专门讲数值稳定', md: r`RWKV 的 WKV 里全是 $e^{k_t}$ 这样的指数项，$k$ 稍大就溢出。第 9 章你会看到 RWKV 论文几乎用同样的「减最大值」思想设计了状态递推——**你现在已经见过这个思想的童年形态了**。` },
        { type: 'quiz', quiz: {
          question: r`softmax 中令 $m = \max z$，计算 $e^{z_i - m}$。为什么结果和直接算 $e^{z_i}$ 相同？`,
          options: [
            { text: '因为取近似，其实不同', correct: false },
            { text: '因为分子分母同乘了一个常数，约掉了', correct: true },
            { text: '因为 max 不影响 softmax', correct: false },
            { text: '因为 log 与 exp 互逆', correct: false },
          ],
          explanation: r`$\frac{e^{z_i - m}}{\sum_j e^{z_j - m}} = \frac{e^{-m} e^{z_i}}{e^{-m} \sum_j e^{z_j}}$，$e^{-m}$ 上下约掉。数学恒等，数值安全——这个「白嫖」技巧在 RWKV 里会再见。`,
        }},
      ],
    },
  ],
};
