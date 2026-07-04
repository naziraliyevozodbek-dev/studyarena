import { z } from 'zod';

export const telegramAuthSchema = z.object({
  initData: z.string().min(1, 'Init data is required'),
});

export const courseCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
});

export const homeworkCreateSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is too short'),
  deadline: z.string().optional().nullable(),
  xp_reward: z.number().int().min(0, 'XP cannot be negative').default(100),
});

export const submissionGradeSchema = z.object({
  status: z.enum(['graded', 'rejected']),
  score: z.number().int().min(0).optional(),
  feedback: z.string().optional(),
});

export const studentJoinSchema = z.object({
  course_code: z.string().length(6, 'Course code must be exactly 6 characters').toUpperCase(),
});

export const userSettingsSchema = z.object({
  full_name: z.string().min(3, 'Full name must be at least 3 characters').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
});

export const vocabularyCreateSchema = z.object({
  course_id: z.string().uuid(),
  category: z.string().min(1),
  german_word: z.string().min(1),
  translation: z.string().min(1),
  synonyms: z.string().optional(),
  example_sentence: z.string().optional(),
});

export const learnProgressSchema = z.object({
  vocabId: z.string().uuid(),
  status: z.enum(['learning', 'known']),
});
