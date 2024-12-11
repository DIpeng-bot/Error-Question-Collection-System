// 用户角色类型
export type UserRole = 'student' | 'teacher';

// 用户模型
export interface User {
  id: string;
  role: UserRole;
  name: string;
  class?: string;
  subjects: string[];
}

// 错题模型
export interface ErrorQuestion {
  id: string;
  userId: string;
  subject: string;
  chapter: string;
  questionType: string;
  difficulty: number;
  importance: number;
  content: {
    text: string;
    images: string[];
  };
  correctAnswer: string;
  wrongAnswer: string;
  analysis: {
    errorType: string;
    reason: string;
    explanation: string;
  };
  tags: string[];
  createTime: Date;
  reviewStatus: 'pending' | 'reviewed' | 'mastered';
  nextReviewTime: Date;
  reviewCount: number;
}

// 学习进度模型
export interface StudyProgress {
  userId: string;
  subject: string;
  totalQuestions: number;
  masteredQuestions: number;
  weakPoints: string[];
  lastReviewDate: Date;
}

// 通用响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 