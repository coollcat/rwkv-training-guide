import type { Chapter } from '../types';

const r = String.raw;

export const ch11: Chapter = {
  id: 'ch11',
  num: '11',
  title: '手搓 RWKV 训练框架',
  subtitle: '数据管线、模型、训练循环——每一行都出自你手',
  stage: '工程实战',
  accent: '160 84% 45%',
  lessons: [
    {
      id: '11-1',
      title: '框架蓝图：五个模块与一条主线',
      minutes: 12,
      blocks: [
        { type: 'text', md: r`动笔之前先画图纸。任何训练框架都是五个模块的组合，我们用最小的复杂度各实现一份：` },
        { type: 'table', head: ['模块', '职责', '本框架的实现策略'], rows: [
          ['data.py', '把原始文本变成一摞摞 (x, y) 批次', '字符级 tokenizer + memmap 二进制文件'],
          ['model.py', 'RWKV 前向传播', '手写 TimeMixing / ChannelMixing / Block'],
          ['optim', '更新参数', 'PyTorch 自带 AdamW + 手写余弦学习率'],
          ['train.py', '训练循环：前向、反向、裁剪、记录、存档', '一个主循环，全部裸露无封装'],
          ['generate.py', 'RNN 模式逐 token 生成', '手动维护状态，体验 O(1) 推理'],
        ]},
        { type: 'callout', variant: 'key', title: '设计哲学', md: r`**教学框架的第一美德是「一眼看穿」**：不抽象、不封装、不magic。PyTorch 只负责两件事——tensor 计算与自动求导；RWKV 的每一行公式都由我们亲手写成代码。性能优化（并行扫描、CUDA kernel）留给你理解之后的第二步。` },
        { type: 'text', md: r`工具选择：为什么用 PyTorch 而不是纯 NumPy？因为手写 RWKV 的反向传播既不现实也无必要——autograd 替你处理链式法则（第 4 章原理已通），我们专注于架构本身。这和使用轮子不冲突：你是造车的人，不是炼橡胶的人。` },
        { type: 'quiz', quiz: {
          question: '教学框架中选择用 PyTorch autograd 而非手写反向传播，是因为？',
          options: [
            { text: '手写反向传播不可能实现', correct: false },
            { text: '反向传播原理已掌握，工程上交给自动求导，专注架构本身', correct: true },
            { text: 'PyTorch 不能自定义层', correct: false },
            { text: 'autograd 速度总是更快', correct: false },
          ],
          explanation: '第 4、6 章已经把链式法则和手推反向吃透了。工程上把机械劳动交给 autograd，把智力留给架构设计。',
        }},
      ],
    },
    {
      id: '11-2',
      title: '数据管线：从 txt 文件到 GPU 上的批次',
      minutes: 15,
      blocks: [
        { type: 'text', md: r`数据管线的任务：一份 txt 语料 → 编码成 id 流 → 随机切片成批。**标签不用额外准备**：输入右移一位就是标签（第 7 章的自监督）。` },
        { type: 'code', title: 'prepare.py：语料 → 二进制 id 流', code: r`import numpy as np

# 1) 读语料，构建字符级词表（教学用；生产换 BPE，如 RWKV 官方 tokenizer）
text = open('corpus.txt', encoding='utf-8').read()
vocab = sorted(set(text))
stoi = {ch: i for i, ch in enumerate(vocab)}
itos = {i: ch for ch, i in stoi.items()}
V = len(vocab)
print(f'词表大小 V = {V}')

# 2) 全文编码为 id，存成 memmap 友好的二进制
ids = np.array([stoi[c] for c in text], dtype=np.uint16)
np.save('train.npy', ids[: int(len(ids) * 0.95)])
np.save('val.npy',   ids[int(len(ids) * 0.95):])` },
        { type: 'code', title: 'data.py：随机取批次', code: r`import numpy as np
import torch

train_ids = np.load('train.npy')   # 生产环境用 np.memmap 处理超大文件
val_ids   = np.load('val.npy')

def get_batch(split, batch_size, ctx_len, device):
    data = train_ids if split == 'train' else val_ids
    # 随机选 batch_size 个起点，各取 ctx_len+1 个 token
    ix = np.random.randint(0, len(data) - ctx_len - 1, size=batch_size)
    seq = np.stack([data[i : i + ctx_len + 1] for i in ix])
    seq = torch.from_numpy(seq.astype(np.int64)).to(device)
    x, y = seq[:, :-1], seq[:, 1:]     # 输入与右移一位的标签
    return x, y

# x: (b, t)  y: (b, t) —— 每个位置都预测下一个 token` },
        { type: 'callout', variant: 'tip', md: r`注意 ⌈x, y = seq[:, :-1], seq[:, 1:]⌉ 这一刀：**切一次就同时得到输入和标签**。比如 seq = [今, 天, 天, 气, 好]，则 x = [今,天,天,气]，y = [天,天,气,好]，模型要在「今」后面学会「天」。` },
        { type: 'quiz', quiz: {
          question: '为什么数据管线不需要人工标注标签？',
          options: [
            { text: '因为用了字符级词表', correct: false },
            { text: '语言模型的标签就是输入序列右移一位，语料自带监督信号', correct: true },
            { text: '因为 PyTorch 自动生成标签', correct: false },
            { text: '训练时不需要标签', correct: false },
          ],
          explanation: '自监督：序列的下一个 token 就是标签。这是大模型能用无限文本训练的根本原因，你的框架免费继承了这一点。',
        }},
      ],
    },
    {
      id: '11-3',
      title: '模型实现：把第 9 章的公式逐行翻译',
      minutes: 25,
      blocks: [
        { type: 'text', md: r`这是全课的高潮。下面每一段代码都与第 9 章的公式一一对应——**你会发现没有一行是新的，全是你推导过的东西**。` },
        { type: 'code', title: 'model.py（一）：TimeMixing —— WKV 的心脏', code: r`import torch
import torch.nn as nn
import torch.nn.functional as F

class TimeMixing(nn.Module):
    def __init__(self, d):
        super().__init__()
        # token shift 混合系数 μ（逐通道，可学习）
        self.mu_r = nn.Parameter(torch.rand(d))
        self.mu_k = nn.Parameter(torch.rand(d))
        self.mu_v = nn.Parameter(torch.rand(d))
        # w: 时间衰减（用双重指数保证衰减率 ∈ (0,1)）  u: 当前 token 奖励
        self.w = nn.Parameter(torch.rand(d))
        self.u = nn.Parameter(torch.rand(d))
        # 投影矩阵 W_r / W_k / W_v / W_o
        self.receptance = nn.Linear(d, d, bias=False)
        self.key        = nn.Linear(d, d, bias=False)
        self.value      = nn.Linear(d, d, bias=False)
        self.output     = nn.Linear(d, d, bias=False)

    def forward(self, x):                    # x: (b, t, d)
        B, T, D = x.shape
        # ① Token Shift：x_prev[t] = x[t-1]（开头补零）
        x_prev = F.pad(x, (0, 0, 1, -1))
        r = self.receptance(self.mu_r * x + (1 - self.mu_r) * x_prev)
        k = self.key(self.mu_k * x + (1 - self.mu_k) * x_prev)
        v = self.value(self.mu_v * x + (1 - self.mu_v) * x_prev)
        k = torch.clamp(k, max=30)           # 教学版防溢出（对应 9-4 的 p 技巧）

        # ② WKV 递推：维护 A、B 两个累加器（9-2 的递推形式）
        decay = torch.exp(-torch.exp(self.w))       # e^{-w} ∈ (0,1)
        A = torch.zeros(B, D, device=x.device)      # 分子记忆
        Bs = torch.zeros(B, D, device=x.device)     # 分母记忆
        outs = []
        for t in range(T):
            kt, vt = k[:, t], v[:, t]
            bonus = torch.exp(self.u + kt)          # e^{u+k_t}
            outs.append((A + bonus * vt) / (Bs + bonus + 1e-9))
            A  = decay * A + torch.exp(kt) * vt     # A ← e^{-w}A + e^k·v
            Bs = decay * Bs + torch.exp(kt)         # B ← e^{-w}B + e^k
        wkv = torch.stack(outs, dim=1)              # (b, t, d)

        # ③ Receptance 门控 + 输出投影：W_o(σ(r) ⊙ wkv)
        return self.output(torch.sigmoid(r) * wkv)` },
        { type: 'code', title: 'model.py（二）：ChannelMixing 与 Block', code: r`class ChannelMixing(nn.Module):
    def __init__(self, d, hidden):
        super().__init__()
        self.mu_k = nn.Parameter(torch.rand(d))
        self.mu_r = nn.Parameter(torch.rand(d))
        self.key = nn.Linear(d, hidden)        # 先放大到 4d
        self.receptance = nn.Linear(d, d)
        self.value = nn.Linear(hidden, d)      # 再缩回 d

    def forward(self, x):
        x_prev = F.pad(x, (0, 0, 1, -1))
        k = self.key(self.mu_k * x + (1 - self.mu_k) * x_prev)
        r = self.receptance(self.mu_r * x + (1 - self.mu_r) * x_prev)
        return torch.sigmoid(r) * self.value(F.relu(k) ** 2)   # σ(r)⊙W_v(ReLU(k)²)

class Block(nn.Module):
    def __init__(self, d):
        super().__init__()
        self.ln1 = nn.LayerNorm(d)
        self.ln2 = nn.LayerNorm(d)
        self.time_mix = TimeMixing(d)
        self.channel_mix = ChannelMixing(d, 4 * d)

    def forward(self, x):
        x = x + self.time_mix(self.ln1(x))      # 残差连接（第 9-3 节）
        x = x + self.channel_mix(self.ln2(x))
        return x` },
        { type: 'code', title: 'model.py（三）：组装完整模型', code: r`class RWKV(nn.Module):
    def __init__(self, vocab_size, d=256, n_layer=6):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, d)     # 查表（7-1）
        self.blocks = nn.ModuleList([Block(d) for _ in range(n_layer)])
        self.ln_f = nn.LayerNorm(d)
        self.head = nn.Linear(d, vocab_size, bias=False)
        self.head.weight = self.embed.weight          # 权重共享：省参数、更稳定

    def forward(self, idx, targets=None):             # idx: (b, t)
        x = self.embed(idx)                           # (b, t, d)
        for blk in self.blocks:
            x = blk(x)
        logits = self.head(self.ln_f(x))              # (b, t, V)
        loss = None
        if targets is not None:
            # 交叉熵（第 3 章）：展平成 (b*t, V) 一次算完
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)),
                                   targets.view(-1))
        return logits, loss` },
        { type: 'callout', variant: 'key', md: r`对照检查：token shift ✓、lerp 混合 ✓、WKV 递推 ✓、σ(r) 门控 ✓、平方 ReLU ✓、LayerNorm + 残差 ✓、embedding 查表 ✓、交叉熵 ✓。**这个模型已经可以训练了。**` },
        { type: 'quiz', quiz: {
          question: 'forward 中训练与推理共用一个 for 循环沿时间推进。为什么教学版可以这样做？',
          options: [
            { text: '因为循环速度快', correct: false },
            { text: 'WKV 的递推形式天然适用于逐 token 处理；教学版牺牲并行性换取与推理代码的一致性', correct: true },
            { text: '因为 GPU 不支持并行', correct: false },
            { text: '因为这样省参数', correct: false },
          ],
          explanation: '递推形式训练时是串行的（慢但清晰），官方实现用并行前缀扫描加速。教学版选择「与推理同构」的写法，让训练与推理共享同一套数学。',
        }},
      ],
    },
    {
      id: '11-4',
      title: '训练循环：优化器、调度、裁剪与存档',
      minutes: 18,
      blocks: [
        { type: 'text', md: r`最后一块拼图。训练循环把前面所有模块拧成一股绳：` },
        { type: 'code', title: 'train.py：完整训练循环', code: r`import torch, math, time
from model import RWKV
from data import get_batch, V

device = 'cuda' if torch.cuda.is_available() else 'cpu'
CTX, BATCH, D, LAYERS = 256, 32, 256, 6
MAX_STEPS, LR, WARMUP = 5000, 3e-4, 200

model = RWKV(V, d=D, n_layer=LAYERS).to(device)
print(f'参数量: {sum(p.numel() for p in model.parameters()) / 1e6:.1f}M')

optimizer = torch.optim.AdamW(model.parameters(), lr=LR,
                              betas=(0.9, 0.95), weight_decay=0.1)

def lr_at(step):                       # warmup + 余弦退火（4-1）
    if step < WARMUP:
        return LR * step / WARMUP
    p = (step - WARMUP) / (MAX_STEPS - WARMUP)
    return LR * 0.5 * (1 + math.cos(math.pi * p))

for step in range(MAX_STEPS):
    for g in optimizer.param_groups:   # 手动应用学习率调度
        g['lr'] = lr_at(step)

    x, y = get_batch('train', BATCH, CTX, device)
    logits, loss = model(x, y)          # 前向（11-3）
    loss.backward()                     # autograd 反向（第 4 章）
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # 梯度裁剪（4-3）
    optimizer.step()                    # AdamW 更新（4-1）
    optimizer.zero_grad(set_to_none=True)

    if step % 100 == 0:
        xv, yv = get_batch('val', BATCH, CTX, device)
        with torch.no_grad():
            _, vloss = model(xv, yv)    # 验证集（第 5 章：盯这个！）
        print(f'step {step:5d} | train {loss.item():.4f} | val {vloss.item():.4f}')

    if step % 1000 == 0 and step > 0:   # checkpoint：模型快照
        torch.save({'model': model.state_dict(),
                    'step': step,
                    'optimizer': optimizer.state_dict()}, 'ckpt.pt')` },
        { type: 'list', items: [
          r`**AdamW**：weight_decay=0.1 从梯度里解耦的权重衰减（5-2）`,
          r`**梯度裁剪**：范数上限 1.0，长序列训练的保险丝（4-3）`,
          r`**学习率调度**：200 步热身 + 余弦退火（4-1）`,
          r`**checkpoint**：定期保存 ⌈模型 + 优化器⌉ 双状态，断电可续训`,
        ]},
        { type: 'callout', variant: 'tip', md: r`在一台消费级 GPU 上，d=256、6 层、字符级语料，几千步后你就能看到它写出像模像样的文本风格。loss 从 ln(V) 开始下降——$\ln(65) \approx 4.17$ 就是字符级模型的「瞎猜基线」。` },
        { type: 'quiz', quiz: {
          question: 'checkpoint 为什么要同时保存 optimizer 的状态？',
          options: [
            { text: '为了文件更大', correct: false },
            { text: 'Adam 的动量 m、v 是训练状态的一部分，不存就无法无缝续训', correct: true },
            { text: '因为 PyTorch 强制要求', correct: false },
            { text: '为了加快推理', correct: false },
          ],
          explanation: 'Adam 每个参数都携带一阶/二阶动量（4-1）。只存模型权重，续训时动量归零，相当于带着「失忆的优化器」重新起步。',
        }},
      ],
    },
  ],
};
