import type { Chapter } from '../types';

const r = String.raw;

export const ch02: Chapter = {
  id: 'ch02',
  num: '02',
  title: '微积分：梯度的来源',
  subtitle: '导数、链式法则、梯度——反向传播的数学原材料',
  stage: '数学地基',
  accent: '265 80% 62%',
  lessons: [
    {
      id: '2-1',
      title: '导数与链式法则：变化的传导',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`导数回答一个问题：**输入动一点点，输出动多少**。函数 $f(x)$ 在 $x$ 处的导数 $f'(x)$ 就是那一点的「瞬时变化率」，几何上是切线的斜率。` },
        { type: 'formula', tex: r`f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}`, caption: '导数定义：变化量的极限比值。' },
        { type: 'text', md: r`常用求导规则（不用背，见过即可）：幂函数 $(x^n)' = nx^{n-1}$；指数 $(e^x)' = e^x$；对数 $(\ln x)' = 1/x$。真正重要的是下一条。` },
        { type: 'heading', text: '链式法则：深度学习的发动机' },
        { type: 'formula', tex: r`\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}`, caption: '复合函数 y = f(u(x)) 的导数 = 外导数 × 内导数' },
        { type: 'text', md: r`神经网络是几十层函数套娃：$L = f_{50}(f_{49}(\cdots f_1(x)))$。想知道第一层参数对最终 loss 的影响，就把中间每一段的导数**乘起来**。链式法则就是「反向传播」的数学本体——第 4 章我们会把它算给你看。` },
        { type: 'callout', variant: 'warn', title: '连乘的隐患', md: r`如果每个局部导数都是 0.9，50 层连乘后梯度只剩 $0.9^{50} \approx 0.005$——**梯度消失**；若都是 1.1，则是 $1.1^{50} \approx 117$——**梯度爆炸**。RNN 的痛点、激活函数的选择、初始化的讲究，全都源于这条乘法。` },
        { type: 'code', title: '数值验证：用定义逼近导数', code: r`def f(x):
    return x**3 + 2*x

def numerical_grad(f, x, h=1e-5):
    # 中心差分：比单边差分更准
    return (f(x + h) - f(x - h)) / (2 * h)

x = 3.0
print(numerical_grad(f, x))   # ≈ 29.0
print(3*x**2 + 2)             # 解析解 f'(x) = 3x² + 2 = 29 ✓` },
        { type: 'quiz', quiz: {
          question: r`$y = (3x+1)^2$，则 $\frac{dy}{dx}\big|_{x=1} = ?$`,
          options: [
            { text: '8', correct: false },
            { text: '24', correct: true },
            { text: '16', correct: false },
            { text: '6', correct: false },
          ],
          explanation: r`令 $u = 3x+1$，$y = u^2$。链式法则：$\frac{dy}{dx} = 2u \cdot 3 = 6(3x+1)$，代入 $x=1$ 得 $24$。`,
        }},
      ],
    },
    {
      id: '2-2',
      title: '偏导数与梯度：高维世界里的「下山方向」',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`神经网络的参数不是一两个，而是几十亿个。损失函数 $L(w_1, w_2, \dots)$ 是一个超高维空间里的曲面。对每个参数单独求导，叫**偏导数**——假装其他参数都是常数。` },
        { type: 'formula', tex: r`\frac{\partial L}{\partial w_i} = \text{把 } w_i \text{ 以外的量全当常数，对 } w_i \text{ 求导}`, caption: '∂ 是偏导数符号，读作 partial。' },
        { type: 'text', md: r`把所有偏导数排成一个向量，就是**梯度**（gradient）：` },
        { type: 'formula', tex: r`\nabla L = \left[ \frac{\partial L}{\partial w_1}, \frac{\partial L}{\partial w_2}, \dots, \frac{\partial L}{\partial w_n} \right]^\top`, caption: '梯度：指向函数值增长最快的方向。' },
        { type: 'callout', variant: 'key', md: r`梯度指向**上山**最快的方向，所以要**下山**（减小 loss）就得往反方向走：$w \leftarrow w - \eta \nabla L$。这就是梯度下降，机器学习里被反复执行几十亿次的一行公式。` },
        { type: 'text', md: r`在二维等高线图上，梯度总是**垂直于等高线**指向更陡的方向。下面这个实验室把这句话变成可以手玩的东西——你将在第 4 章反复回到这里。` },
        { type: 'interactive', name: 'gradient-descent', title: '梯度下降沙盒', desc: '在碗状曲面上放一个小球，调学习率看它如何滚向谷底（或飞出去）。' },
        { type: 'quiz', quiz: {
          question: r`$L(w_1, w_2) = w_1^2 + 3w_2^2$ 在点 $(2, 1)$ 处的梯度是？`,
          options: [
            { text: r`$(4, 6)$`, correct: true },
            { text: r`$(2, 3)$`, correct: false },
            { text: r`$(4, 3)$`, correct: false },
            { text: r`$(1, 3)$`, correct: false },
          ],
          explanation: r`$\frac{\partial L}{\partial w_1} = 2w_1 = 4$；$\frac{\partial L}{\partial w_2} = 6w_2 = 6$。梯度 $(4,6)$ 指向上山方向，下山就走 $(-4,-6)$。`,
        }},
      ],
    },
    {
      id: '2-3',
      title: '向量微积分：矩阵世界的求导法则',
      minutes: 14,
      blocks: [
        { type: 'text', md: r`真实网络里变量都是向量矩阵，求导结果也是矩阵。这块的符号看起来吓人，其实规则非常机械。掌握三条就够用：` },
        { type: 'formula', tex: r`\frac{\partial (\mathbf{W}\mathbf{x})}{\partial \mathbf{x}} = \mathbf{W}^\top`, caption: '线性层对输入的导数：权重转置。反向传播把梯度「乘 Wᵀ 传回去」。' },
        { type: 'formula', tex: r`\frac{\partial (\mathbf{W}\mathbf{x})}{\partial \mathbf{W}} = \mathbf{x}^\top \text{（外积形式）}`, caption: '线性层对权重的导数：与输入做外积。参数的梯度 = 上游梯度 ⊗ 本层输入。' },
        { type: 'formula', tex: r`\frac{\partial L}{\partial \mathbf{x}} = \mathbf{J}^\top \frac{\partial L}{\partial \mathbf{y}}`, caption: '向量版链式法则：雅可比矩阵 J 转置乘以上游梯度。' },
        { type: 'text', md: r`**雅可比矩阵**（Jacobian）就是「输出向量的每个分量对输入向量每个分量的偏导数」排成的矩阵。它是链式法则在向量世界的化身。你不用手算它——PyTorch 的 autograd 干的就是这件事——但你要知道它在干什么。` },
        { type: 'callout', variant: 'tip', md: r`记住一个画面就够了：反向传播时，梯度像水流一样从 loss 倒灌回每个参数。每经过一个矩阵乘法层，水流被**转置后的权重矩阵**重新分配一次；每经过一个非线性函数，水流被**该点的导数**按元素缩放一次。` },
        { type: 'code', title: 'PyTorch 自动求导初体验', code: r`import torch

x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
W = torch.randn(2, 3, requires_grad=True)

y = W @ x           # 线性层
loss = (y ** 2).sum()  # 标量 loss
loss.backward()     # 自动完成整条链式法则

print(x.grad)       # ∂loss/∂x，形状 (3,)
print(W.grad)       # ∂loss/∂W，形状 (2, 3)
# 到第 11 章，你将亲手写出这个 W 的全部故事` },
        { type: 'quiz', quiz: {
          question: r`层 $\mathbf{y} = \mathbf{W}\mathbf{x}$ 中，已知上游梯度 $\frac{\partial L}{\partial \mathbf{y}}$，则传给输入的梯度是？`,
          options: [
            { text: r`$\mathbf{W} \, \frac{\partial L}{\partial \mathbf{y}}$`, correct: false },
            { text: r`$\mathbf{W}^\top \, \frac{\partial L}{\partial \mathbf{y}}$`, correct: true },
            { text: r`$\frac{\partial L}{\partial \mathbf{y}} \, \mathbf{x}$`, correct: false },
            { text: r`$\mathbf{x}^\top \frac{\partial L}{\partial \mathbf{y}}$`, correct: false },
          ],
          explanation: r`向量链式法则：$\frac{\partial L}{\partial \mathbf{x}} = \mathbf{J}^\top \frac{\partial L}{\partial \mathbf{y}}$，而线性层的雅可比就是 $\mathbf{W}$。「前向乘 W，反向乘 Wᵀ」——对称的美感。`,
        }},
      ],
    },
  ],
};
