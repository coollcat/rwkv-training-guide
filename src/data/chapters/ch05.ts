import type { Chapter } from '../types';

const r = String.raw;

export const ch05: Chapter = {
  id: 'ch05',
  num: '05',
  title: '机器学习的范式',
  subtitle: '拟合、泛化、过拟合——训练之外的另一半学问',
  stage: '机器学习内功',
  accent: '330 75% 60%',
  lessons: [
    {
      id: '5-1',
      title: '学习 = 拟合 + 泛化',
      minutes: 12,
      blocks: [
        { type: 'text', md: r`机器学习流水线只有五步：**收集数据 → 定义模型（含参数 θ）→ 定义损失 → 梯度下降调参 → 评估**。前几章已经凑齐了数学零件，本章把它们组装成完整图景。` },
        { type: 'text', md: r`但「在训练数据上表现好」只是上半场。真正的目标是**泛化**：在没见过的数据上也好。为此数据要切成三份：` },
        { type: 'list', items: [
          r`**训练集**（约 90%）：梯度下降直接优化的对象`,
          r`**验证集**（约 5%）：训练过程中偷看的「模拟考」，用来调超参数（学习率、层数……）`,
          r`**测试集**（约 5%）：最终审判，训练全程不许碰，防止「刷题式提分」`,
        ]},
        { type: 'callout', variant: 'warn', md: r`用测试集调参 = 考试偷看答案。工业界的血泪教训：测试集每偷看一次，报告的分数就虚高一分。我们的框架里验证集 loss 会单独打印，请盯紧它而不是训练 loss。` },
        { type: 'quiz', quiz: {
          question: '训练 loss 持续下降，验证 loss 却开始上升，说明？',
          options: [
            { text: '学习率太低', correct: false },
            { text: '模型开始过拟合，在背训练数据', correct: true },
            { text: '数据量太大', correct: false },
            { text: '正常现象，不用管', correct: false },
          ],
          explanation: '这是过拟合的标准信号：模型在训练集上越来越好，泛化能力却在退化。下一节讲对策。',
        }},
      ],
    },
    {
      id: '5-2',
      title: '过拟合与正则化：给模型戴上缰绳',
      minutes: 13,
      blocks: [
        { type: 'text', md: r`参数足够多的模型可以把训练集背得滚瓜烂熟——包括里面的噪声。**过拟合**（overfitting）就是「学过头了」：记住了每道做过的题，却不会做新题。` },
        { type: 'heading', text: '三剂解药' },
        { type: 'list', ordered: true, items: [
          r`**更多数据**：最便宜也最有效的正则化。数据越多样，靠背题的性价比越低。`,
          r`**权重衰减**（weight decay）：在 loss 上加一项 $\lambda \lVert \theta \rVert^2$，惩罚过大的权重，逼模型「用简单的解释」。AdamW 把这项从梯度里拆出来单独做，效果更好——第 11 章用的就是它。`,
          r`**Dropout**：训练时随机把一部分神经元输出清零，逼网络不依赖任何单一神经元。大模型时代用得比从前少，但思想值得知道。`,
        ]},
        { type: 'formula', tex: r`\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{data}} + \lambda \lVert \theta \rVert^2`, caption: '正则化后的总损失：数据项 + 复杂度惩罚项。λ 控制缰绳松紧。' },
        { type: 'callout', variant: 'tip', md: r`直觉：权重小的模型，输出对输入的微小变化不敏感——「圆滑」的函数。而噪声恰恰是需要尖锐弯折才能拟合的东西。惩罚大权重大致等于惩罚「为噪声量身定做的弯折」。` },
        { type: 'quiz', quiz: {
          question: '权重衰减为什么能缓解过拟合？',
          options: [
            { text: '它让训练更快', correct: false },
            { text: '它惩罚过大的权重，偏好更平滑、更简单的函数', correct: true },
            { text: '它增加了训练数据', correct: false },
            { text: '它让梯度变为零', correct: false },
          ],
          explanation: '大权重能对训练样本的微小特征做出剧烈响应（背题）；限制权重大小，模型被迫找「对大多数样本都说得通」的平滑规律。',
        }},
      ],
    },
  ],
};
