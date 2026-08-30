# ARCHITECTURE.md — RWKV 训练全攻略 工程架构

## 项目是什么
从零基础到能手搓 RWKV 训练框架的交互式学习指南：14 章 · 50+ 课时，每个公式配交互实验室。

## 技术栈与结构
- React 19 + TypeScript + Vite 7 + Tailwind CSS + shadcn/ui + KaTeX
- 课程：数学地基 / 机器学习内功 / 序列与注意力 / RWKV 理论 / 工程实战 / 前沿视野
- 12 个交互实验室（梯度下降模拟、注意力热力图、RNN 展开、WKVS 逐步计算、Tokenizer…）

## 命令
- 构建：`npm run build` → `dist/`；开发：`npm run dev`

## 约定
- 新增实验室保持交互式（可视化优先）；公式用 KaTeX
- 详见 MAINTENANCE.md
