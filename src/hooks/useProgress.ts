import { useCallback, useEffect, useState } from 'react';

const KEY = 'rwkv-course-progress-v1';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** 课时完成进度（localStorage 持久化） */
export function useProgress() {
  const [done, setDone] = useState<Set<string>>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...done]));
    } catch {
      /* 隐私模式等场景静默失败 */
    }
  }, [done]);

  const toggle = useCallback((lessonId: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }, []);

  const isDone = useCallback((lessonId: string) => done.has(lessonId), [done]);

  return { done, toggle, isDone, count: done.size };
}
