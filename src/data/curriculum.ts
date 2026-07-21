import type { Chapter, Lesson } from './types';
import { ch00 } from './chapters/ch00';
import { ch01 } from './chapters/ch01';
import { ch02 } from './chapters/ch02';
import { ch03 } from './chapters/ch03';
import { ch04 } from './chapters/ch04';
import { ch05 } from './chapters/ch05';
import { ch06 } from './chapters/ch06';
import { ch07 } from './chapters/ch07';
import { ch08 } from './chapters/ch08';
import { ch09 } from './chapters/ch09';
import { ch10 } from './chapters/ch10';
import { ch11 } from './chapters/ch11';
import { ch12 } from './chapters/ch12';
import { ch13 } from './chapters/ch13';

/** 全部章节（顺序即学习顺序）。新增章节：在 chapters/ 下建文件后在此注册。 */
export const CURRICULUM: Chapter[] = [
  ch00, ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch13,
];

/** lessonId → (chapter, lesson) 索引 */
export const LESSON_INDEX = new Map<string, { chapter: Chapter; lesson: Lesson }>();
CURRICULUM.forEach((c) => c.lessons.forEach((l) => LESSON_INDEX.set(l.id, { chapter: c, lesson: l })));

/** 按学习顺序拍平的课时列表（用于「上一节/下一节」） */
export const FLAT_LESSONS: { chapter: Chapter; lesson: Lesson }[] = CURRICULUM.flatMap((c) =>
  c.lessons.map((l) => ({ chapter: c, lesson: l })),
);

export const TOTAL_LESSONS = FLAT_LESSONS.length;
