import { openDB } from 'idb';

interface ImageData {
  id: string;
  data: string; // base64 encoded image data
  fileName: string;
  type: string;
  uploadTime: Date;
}

const DB_NAME = 'error-question-system-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export class ImageStorageService {
  private static instance: ImageStorageService;
  private db: Promise<any>;

  private constructor() {
    this.db = this.initDB();
  }

  private async initDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  public static getInstance(): ImageStorageService {
    if (!ImageStorageService.instance) {
      ImageStorageService.instance = new ImageStorageService();
    }
    return ImageStorageService.instance;
  }

  // 将File对象转换为base64字符串
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // 保存图片
  async saveImage(file: File): Promise<string> {
    try {
      const db = await this.db;
      const base64Data = await this.fileToBase64(file);
      const imageData: ImageData = {
        id: `${Date.now()}-${file.name}`,
        data: base64Data,
        fileName: file.name,
        type: file.type,
        uploadTime: new Date(),
      };

      await db.put(STORE_NAME, imageData);
      return imageData.id;
    } catch (error) {
      console.error('保存图片失败:', error);
      throw error;
    }
  }

  // 获取图片
  async getImage(id: string): Promise<ImageData | undefined> {
    try {
      const db = await this.db;
      return db.get(STORE_NAME, id);
    } catch (error) {
      console.error('获取图片失败:', error);
      throw error;
    }
  }

  // 删除图片
  async deleteImage(id: string): Promise<void> {
    try {
      const db = await this.db;
      await db.delete(STORE_NAME, id);
    } catch (error) {
      console.error('删除图片失败:', error);
      throw error;
    }
  }
} 