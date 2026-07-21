import { createContext, useContext } from 'react';
import type { useProgress } from './useProgress';

export const ProgressContext = createContext<ReturnType<typeof useProgress> | null>(null);

export function useProgressCtx() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressCtx 必须在 AppLayout 内使用');
  return ctx;
}
