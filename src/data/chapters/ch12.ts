import type { Chapter } from '../types';

const r = String.raw;

export const ch12: Chapter = {
  id: 'ch12',
  num: '12',
  title: '训练实战与推理生成',
  subtitle: '调参指南、故障排查、RNN 模式生成文本',
  stage: '工程实战',
  accent: '200 80% 55%',
  lessons: [
    {
      id: '12-1',
      title: '调参指南与故障排查手册',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`框架写完只是开始，能不能训出东西全在细节。这一节是实战经验的浓缩。` },
        { type: 'heading', text: '超参数起手配方' },
        { type: 'table', head: ['超参数', '小玩具（CPU/单卡教学）', '认真一点（单卡）', '说明'], rows: [
          ['d_model', '128 ~ 256', '512 ~ 768', '宽度，越大越聪明也越慢'],
          ['n_layer`, `4 ~ 6', '12 ~ 24', '深度'],
          ['ctx_len', '128 ~ 256', '512 ~ 1024', '上下文长度'],
          ['batch', '16 ~ 32', '32 ~ 64', '显存不够先砍它'],
          ['lr`, `3e-4', '1e-4 ~ 3e-4', 'AdamW 的安全区'],
          ['weight_decay', '0.1', '0.1', 'embed/ln 层通常不衰减'],
        ]},
        { type: 'heading', text: '症状 → 诊断 → 处方' },
        { type: 'table', head: ['症状', '大概率原因', '处方'], rows: [
          ['loss 突然 NaN', '学习率过大 / 梯度爆炸 / exp 溢出', '降 lr、确认梯度裁剪生效、检查 k 的 clamp（回忆 9-4）'],
          ['loss 纹丝不动', 'lr 太小 / 标签错位 / 梯度为 0', '检查 y 是否右移了一位、打印梯度范数'],
          ['train↓ val↑', '过拟合（第 5 章）', '加数据、加 weight_decay、缩小模型'],
          ['loss 剧烈抖动', 'batch 太小 / lr 太大', '回忆第 4 章的损失曲线实验，按方抓药'],
          ['生成全是重复字', '训练不足 / 温度太低', '继续训、把温度调到 0.8~1.2'],
        ]},
        { type: 'interactive', name: 'loss-curve-sim', title: '复习：损失曲线的性格', desc: '把上面每条诊断在模拟器里复现一遍，形成肌肉记忆。' },
        { type: 'quiz', quiz: {
          question: '训练中途 loss 突然变成 NaN，第一步应该检查什么？',
          options: [
            { text: '词表是否够大', correct: false },
            { text: '学习率与梯度裁剪——指数项溢出或单步更新过猛是最常见原因', correct: true },
            { text: 'embedding 维度', correct: false },
            { text: '数据编码格式', correct: false },
          ],
          explanation: 'NaN 几乎都来自数值爆炸：lr 过大、梯度未裁剪、或 WKV 中 e^k 溢出。依次排查这三项即可定位。',
        }},
      ],
    },
    {
      id: '12-2',
      title: 'RNN 模式推理与毕业路线图',
      minutes: 16,
      blocks: [
        { type: 'text', md: r`最后，让我们用 RWKV 最优雅的方式生成文本：**RNN 模式**——状态在手里滚动，每步只算一个 token，内存恒定。这正是第 10 章账本的兑现。` },
        { type: 'code', title: 'generate.py：带状态滚动采样', code: r`import torch, torch.nn.functional as F
from model import RWKV
from prepare import stoi, itos   # 词表

ckpt = torch.load('ckpt.pt')
model = RWKV(V, d=256, n_layer=6); model.load_state_dict(ckpt['model'])
model.eval()

@torch.no_grad()
def generate(prompt, n_tokens=200, temperature=1.0, top_p=0.9):
    idx = torch.tensor([[stoi[c] for c in prompt]])
    for _ in range(n_tokens):
        logits, _ = model(idx)             # 教学版整段重算；进阶：只喂最后一个 token + 滚动状态
        logits = logits[:, -1, :] / temperature          # 温度（第 3 章）
        probs = F.softmax(logits, dim=-1)
        # top-p（核采样）：只从累计概率前 p 的候选中抽
        sorted_p, sorted_i = torch.sort(probs, descending=True)
        cum = torch.cumsum(sorted_p, dim=-1)
        keep = cum - sorted_p < top_p
        sorted_p[~keep] = 0
        next_id = torch.multinomial(sorted_p / sorted_p.sum(), 1)
        idx = torch.cat([idx, sorted_i.gather(-1, next_id)], dim=1)
    return ''.join(itos[i] for i in idx[0].tolist())

print(generate('从前有座山'))` },
        { type: 'callout', variant: 'warn', title: '留给你的第一个进阶作业', md: r`上面的代码每步都重算整段序列（清晰但浪费）。**真正的 RWKV 推理**是把 TimeMixing 的循环拆出来：prefill 阶段一次性灌入 prompt，之后每步只输入 1 个新 token，手动维护每层的 (x_prev, A, B)。你已经懂全部原理——把这个改造写出来，你的框架就脱胎换骨了。` },
        { type: 'heading', text: '毕业路线图' },
        { type: 'list', ordered: true, items: [
          r`**改造推理**：实现真正的 RNN 模式增量推理（见上）`,
          r`**加速训练**：把 WKV 循环改写为并行前缀扫描（9-4 的求和形式），或研读官方 CUDA kernel`,
          r`**升级架构**：读 RWKV-5/6 论文，给模型加上多头衰减与数据依赖的动态参数`,
          r`**换真数据**：接入 RWKV 官方 BPE tokenizer（词表 65536），喂真正的网页语料`,
          r`**对照源码**：逐文件对照 RWKV-LM 官方仓库，看你的手写版与工业实现差在哪`,
        ]},
        { type: 'callout', variant: 'key', title: '毕业宣言', md: r`走到这里，你已经完成了从「不知道梯度是什么」到「亲手写出一个可训练的 RWKV」的全程。这套知识迁移到任何架构（Transformer、Mamba、MoE）都只是换个模块的事——因为地基是通的。去官网翻论文、去 GitHub 读源码吧，你现在都能看懂了。` },
        { type: 'quiz', quiz: {
          question: 'top-p（核采样）的作用是？',
          options: [
            { text: '让模型训练更快', correct: false },
            { text: '只在累计概率前 p 的候选集合中抽样，兼顾多样性与质量', correct: true },
            { text: '提高词表利用率', correct: false },
            { text: '减少显存占用', correct: false },
          ],
          explanation: 'top-p 动态截断概率尾巴：分布尖锐时候选少（稳妥），分布平坦时候选多（多样）。温度控制形状，top-p 控制范围，两者搭配是生成的标准配方。',
        }},
      ],
    },
  ],
};
