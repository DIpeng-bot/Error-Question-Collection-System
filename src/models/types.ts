// 用户相关类型
export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  subjects: string[];
  email?: string;
  avatar?: string;
  createTime?: Date;
}

// 错题内容类型
export interface QuestionContent {
  text: string;
  images: string[];
}

// 错题分析类型
export interface QuestionAnalysis {
  errorType: string;
  reason: string;
  explanation: string;
}

// 错题类型
export interface ErrorQuestion {
  id: string;
  userId: string;
  subject: string;
  chapter: string;
  questionType: string;
  difficulty: number;
  importance: number;
  content: QuestionContent;
  correctAnswer: string;
  wrongAnswer: string;
  analysis: QuestionAnalysis;
  tags: string[];
  createTime: Date;
  reviewStatus: 'pending' | 'reviewing' | 'mastered';
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