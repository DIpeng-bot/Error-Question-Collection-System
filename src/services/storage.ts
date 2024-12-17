import { openDB, DBSchema } from 'idb';
import { User, ErrorQuestion, StudyProgress } from '../models/types';

interface ErrorQuestionDB extends DBSchema {
  users: {
    key: string;
    value: User;
  };
  errorQuestions: {
    key: string;
    value: ErrorQuestion;
    indexes: { 'by-user': string };
  };
  studyProgress: {
    key: string;
    value: StudyProgress;
    indexes: { 'by-user': string };
  };
}

const DB_NAME = 'error-question-system';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB<ErrorQuestionDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 用户存储
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      // 错题存储
      if (!db.objectStoreNames.contains('errorQuestions')) {
        const errorQuestionStore = db.createObjectStore('errorQuestions', { keyPath: 'id' });
        errorQuestionStore.createIndex('by-user', 'userId');
      }

      // 学习进度存储
      if (!db.objectStoreNames.contains('studyProgress')) {
        const progressStore = db.createObjectStore('studyProgress', { keyPath: 'id' });
        progressStore.createIndex('by-user', 'userId');
      }
    },
  });
  return db;
};

// 数据库操作类
export class StorageService {
  private static instance: StorageService;
  private db: Promise<any>;
  private readonly questionStorageKey = 'error_collection_questions';
  private readonly userStorageKey = 'error_collection_user';

  private constructor() {
    this.db = initDB();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // 用户相关操作
  async saveUser(user: User): Promise<void> {
    try {
      localStorage.setItem(this.userStorageKey, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
      throw new Error('Failed to save user to storage');
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userData = localStorage.getItem(this.userStorageKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  public async clearUser(): Promise<void> {
    localStorage.removeItem(this.userStorageKey);
  }

  // 错题相关操作
  async saveErrorQuestion(question: ErrorQuestion): Promise<void> {
    const db = await this.db;
    await db.put('errorQuestions', question);
  }

  async getErrorQuestion(id: string): Promise<ErrorQuestion | undefined> {
    const db = await this.db;
    return db.get('errorQuestions', id);
  }

  async getUserErrorQuestions(userId: string): Promise<ErrorQuestion[]> {
    const db = await this.db;
    return db.getAllFromIndex('errorQuestions', 'by-user', userId);
  }

  async deleteErrorQuestion(id: string): Promise<void> {
    const db = await this.db;
    await db.delete('errorQuestions', id);
  }

  // 学习进度相关操作
  async saveStudyProgress(progress: StudyProgress): Promise<void> {
    const db = await this.db;
    await db.put('studyProgress', progress);
  }

  async getUserProgress(userId: string): Promise<StudyProgress[]> {
    const db = await this.db;
    return db.getAllFromIndex('studyProgress', 'by-user', userId);
  }
} 