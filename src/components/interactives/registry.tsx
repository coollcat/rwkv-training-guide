import type { InteractiveName } from '@/data/types';
import VectorPlayground from './VectorPlayground';
import MatmulVisualizer from './MatmulVisualizer';
import GradientDescent from './GradientDescent';
import SoftmaxDemo from './SoftmaxDemo';
import BackpropStepper from './BackpropStepper';
import ActivationExplorer from './ActivationExplorer';
import RNNUnroll from './RNNUnroll';
import AttentionHeatmap from './AttentionHeatmap';
import WKVStepper from './WKVStepper';
import TimeMixingLab from './TimeMixingLab';
import LossCurveSim from './LossCurveSim';
import TokenizerDemo from './TokenizerDemo';
import RosaPlayground from './RosaPlayground';

/** 交互组件注册表：内容数据里的 name → 组件 */
export const INTERACTIVES: Record<InteractiveName, React.ComponentType> = {
  'vector-playground': VectorPlayground,
  'matmul-visualizer': MatmulVisualizer,
  'gradient-descent': GradientDescent,
  'softmax-demo': SoftmaxDemo,
  'backprop-stepper': BackpropStepper,
  'activation-explorer': ActivationExplorer,
  'rnn-unroll': RNNUnroll,
  'attention-heatmap': AttentionHeatmap,
  'wkv-stepper': WKVStepper,
  'time-mixing-lab': TimeMixingLab,
  'loss-curve-sim': LossCurveSim,
  'tokenizer-demo': TokenizerDemo,
  'rosa-playground': RosaPlayground,
};
